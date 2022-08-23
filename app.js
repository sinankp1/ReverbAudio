const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('express-handlebars')
const session = require('express-session')
const mongoose = require('mongoose')
const MongodbSession = require('connect-mongodb-session')(session)
const fileupload = require('express-fileupload')
const env = require('dotenv').config()
const connection = require('./config/connection')
console.log(process.env.SESSION_SECRET)
var app = express();



connection.connect()

const store = new MongodbSession({
  uri: connection.mongoUri,
  collection: 'mySessions',
})

app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  store: store,
}))

var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials/',
  helpers: {
    total: (qty, price) => {
      return qty * price
    },
    subTotal: function (arr) {
      let subtotal = 0;
      for (let i = 0; i < arr.length; i++) {
        subtotal = subtotal + arr[i].product.price * arr[i].quantity;
      }
      return subtotal;
    },
    json: function (data) {
      return JSON.stringify(data);
    },
    eq: function (data, string) {
      if (data === string) return true
      else return false
    },
    date: function (date) {
      let data = date + ""
      return data.slice(0, 16);
    },
    dateFormat: function (data) {
      var dateobj =
        new Date(data);

      var B = dateobj.toUTCString();

      return B.slice(5, 25)

    },
    inc1: function(data){
      return data + 1
    }
  }
}))

app.use(function (req, res, next) {
  if (!req.session.isAthentcated) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
  }
  next();
});

// app.use(function (req, res, next) {
//   if (!req.session.loggedin) {
//     res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
//     res.header('Expires', '-1');
//     res.header('Pragma', 'no-cache');
//   }
//   next();
// });

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileupload())

app.use('/', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { error: true, err });
});

module.exports = app;
