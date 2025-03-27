var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var ytdl = require('ytdl-core');
const { spawn } = require('child_process');

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

app.use('/download', async (req, res) => {
  const { url } = req.query;

  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).send('Invalid YouTube URL');
  }

  try {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename="stream.mp3"');

    // Pobieramy strumień audio
    const audioStream = ytdl(url, { quality: 'highestaudio' });

    // Uruchamiamy FFmpeg i konwertujemy do MP3
    const ffmpeg = spawn('ffmpeg', [
      '-i', 'pipe:0',  // Wejście: strumień z ytdl
      '-f', 'mp3',     // Format wyjściowy: MP3
      '-b:a', '192k',  // Jakość audio (bitrate)
      '-vn',           // Bez wideo
      'pipe:1'         // Wyjście: przesyłamy do klienta
    ]);

    // Przekierowanie błędów FFmpeg do konsoli
    ffmpeg.stderr.on('data', (data) => console.error(`FFmpeg error: ${data}`));

    // Przekazujemy strumień z ytdl do FFmpeg
    audioStream.pipe(ffmpeg.stdin);

    // Przekazujemy strumień z FFmpeg do klienta
    ffmpeg.stdout.pipe(res);

  } catch (err) {
    console.error('Error streaming:', err);
    res.status(500).send('Failed to stream audio');
  }
});


module.exports = app;
