var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var sseRouter = require('./routes/sse');
var { initializeDatabase } = require('./db');

var app = express();

// 视图引擎设置
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/sse', sseRouter);

// 捕获404错误并转发到错误处理器
app.use(function(req, res, next) {
  next(createError(404));
});

// 错误处理器
app.use(function(err, req, res, next) {
  // 设置本地变量，仅在开发环境中提供错误信息
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 检查是否为API请求（Accept: application/json）
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    // 返回JSON格式错误响应
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || '服务器内部错误',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // 渲染错误页面
  res.status(err.status || 500);
  res.render('error');
});

// 初始化数据库连接
initializeDatabase().catch(err => {
  console.error('初始化数据库失败:', err);
  process.exit(1);
});

module.exports = app;
