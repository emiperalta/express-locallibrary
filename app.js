let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let compression = require('compression');
let helmet = require('helmet');

let app = express();

app.use(compression());
app.use(helmet());

let indexRouter = require('./routes/index');
let catalogRouter = require('./routes/catalog');

const mongoose = require('mongoose');
const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });  
mongoose.Promise = global.Promise; 
let db = mongoose.connection; 
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log(`Connected to ${mongoDB} successfully`);  
})

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/catalog', catalogRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
