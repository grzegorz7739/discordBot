var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var ytdl = require('ytdl-core');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

//Nothing
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.get('/download', async (req, res) => {
  const { url } = req.query;

  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).send('Invalid YouTube URL');
  }

  try {
    const info = await ytdl.getInfo(url);
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });

    res.setHeader('Content-Type', audioFormat.container);
    res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');

    ytdl(url, { format: audioFormat })
        .pipe(res);
  } catch (err) {
    console.error('Error while downloading:', err);
    res.status(500).send('Failed to download video');
  }
});


module.exports = app;
