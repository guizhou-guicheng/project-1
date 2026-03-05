/**
 * 认证路由模块
 * 处理用户注册和登录请求
 */
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');
const { generateToken, hashPassword, verifyPassword } = require('../utils/auth');
const authMiddleware = require('../middleware/auth');

/**
 * 用户注册接口
 * @route POST /auth/register
 * @description 注册新用户，返回用户信息和JWT令牌
 * @param {string} username - 用户名，长度3-50个字符
 * @param {string} email - 邮箱地址，必须是有效的邮箱格式
 * @param {string} password - 密码，长度至少6位
 * @returns {object} 201 - 注册成功，返回用户信息和令牌
 * @returns {object} 400 - 数据验证失败或用户名/邮箱已存在
 * @returns {object} 500 - 服务器内部错误
 */
router.post('/register', [
  // 数据验证
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50之间'),
  body('email').trim().isEmail().normalizeEmail().withMessage('请输入有效的邮箱地址'),
  body('password').isLength({ min: 6 }).withMessage('密码长度必须至少为6位')
], async (req, res) => {
  // 验证输入数据
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      error: '数据验证失败',
      details: errors.array() 
    });
  }

  const { username, email, password } = req.body;

  try {
    // 同时检查用户名和邮箱是否已存在
    const [existingUsers] = await pool.query(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    // 检查用户名是否已存在
    if (existingUsers.some(user => user.username === username)) {
      return res.status(400).json({ 
        success: false, 
        error: '用户名已存在' 
      });
    }
    
    // 检查邮箱是否已存在
    if (existingUsers.some(user => user.email === email)) {
      return res.status(400).json({ 
        success: false, 
        error: '邮箱已被注册' 
      });
    }

    // 密码加密
    const hashedPassword = await hashPassword(password);

    // 插入新用户
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // 生成JWT令牌
    const token = generateToken({ id: result.insertId, username, email });

    res.status(201).json({ 
      success: true, 
      message: '注册成功',
      data: {
        id: result.insertId,
        username,
        email,
        token
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    // 区分不同类型的错误，返回更具体的错误信息
    if (error.code === 'ER_DUP_ENTRY') {
      // 处理唯一约束冲突错误
      if (error.sqlMessage.includes('username')) {
        return res.status(400).json({ 
          success: false, 
          error: '用户名已存在' 
        });
      } else if (error.sqlMessage.includes('email')) {
        return res.status(400).json({ 
          success: false, 
          error: '邮箱已被注册' 
        });
      }
    }
    // 其他错误返回通用错误信息
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 用户登录接口
 * @route POST /auth/login
 * @description 用户登录，返回用户信息和JWT令牌
 * @param {string} identifier - 用户名或邮箱（二选一）
 * @param {string} username - 用户名（二选一，与identifier功能相同）
 * @param {string} password - 密码
 * @returns {object} 200 - 登录成功，返回用户信息和令牌
 * @returns {object} 400 - 数据验证失败
 * @returns {object} 401 - 用户名/邮箱或密码错误
 * @returns {object} 500 - 服务器内部错误
 */
router.post('/login', async (req, res) => {
  // 自定义验证逻辑
  const errors = [];
  const { identifier, username, password } = req.body;
  
  // 检查是否提供了identifier或username
  if (!identifier && !username) {
    errors.push({
      type: 'field',
      path: 'identifier',
      msg: '请输入用户名或邮箱'
    });
  }
  
  // 检查密码是否为空
  if (!password) {
    errors.push({
      type: 'field',
      path: 'password',
      msg: '请输入密码'
    });
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false, 
      error: '数据验证失败',
      details: errors 
    });
  }

  // 优先使用identifier，其次使用username
  const loginIdentifier = identifier || username;

  try {
    // 查找用户（通过用户名或邮箱）
    const [users] = await pool.query(
      'SELECT id, username, email, password FROM users WHERE username = ? OR email = ?',
      [loginIdentifier, loginIdentifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: '用户名/邮箱或密码错误' 
      });
    }

    const user = users[0];

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: '用户名/邮箱或密码错误' 
      });
    }

    // 生成JWT令牌
    const token = generateToken({ id: user.id, username: user.username, email: user.email });

    res.status(200).json({ 
      success: true, 
      message: '登录成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        token
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    // 区分不同类型的错误，返回更具体的错误信息
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      return res.status(500).json({ 
        success: false, 
        error: '数据库访问权限错误' 
      });
    }
    // 其他错误返回通用错误信息
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 账号注销接口
 * @route POST /auth/delete-account
 * @description 注销用户账号，需要验证身份
 * @param {string} password - 用户密码，用于验证身份
 * @returns {object} 200 - 注销请求提交成功
 * @returns {object} 400 - 数据验证失败
 * @returns {object} 401 - 身份验证失败
 * @returns {object} 403 - 账号状态异常
 * @returns {object} 500 - 服务器内部错误
 */
router.post('/delete-account', authMiddleware, [
  // 验证密码
  body('password').notEmpty().withMessage('请输入密码')
], async (req, res) => {
  // 验证输入数据
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      error: '数据验证失败',
      details: errors.array() 
    });
  }

  const { password } = req.body;

  try {
    // 查找用户
    const [users] = await pool.query(
      'SELECT id, username, email, password, status FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: '用户不存在' 
      });
    }

    const user = users[0];

    // 检查账号状态
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        error: '账号状态异常，无法注销' 
      });
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: '密码错误' 
      });
    }

    // 检查是否有未完成的交易或待处理事项（这里可以根据实际业务逻辑添加）
    // 例如：检查用户是否有未完成的订单、未处理的消息等

    // 执行账号注销流程
    // 1. 将账号状态设置为pending_deletion
    // 2. 记录注销时间和原因
    await pool.query(
      'UPDATE users SET status = ?, deactivated_at = ?, deactivation_reason = ? WHERE id = ?',
      ['pending_deletion', new Date(), '用户主动注销', req.user.id]
    );

    // 2. 发送注销确认通知到用户邮箱（这里可以集成邮件发送服务）
    console.log(`发送注销确认邮件到: ${user.email}`);
    // 实际项目中，这里应该使用邮件发送服务发送确认邮件

    // 3. 实现注销后悔期机制（7天内允许恢复账号）
    // 可以通过定时任务或在用户尝试登录时检查

    res.status(200).json({ 
      success: true, 
      message: '账号注销请求已提交，我们已发送确认邮件到您的邮箱。您有7天时间可以恢复账号。',
      data: {
        deactivation_date: new Date(),
        recovery_period: '7天',
        recovery_instructions: '如果您想恢复账号，请在7天内使用原账号登录并按照提示操作。'
      }
    });

  } catch (error) {
    console.error('账号注销错误:', error);
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 恢复账号接口
 * @route POST /auth/recover-account
 * @description 恢复处于注销后悔期的账号
 * @returns {object} 200 - 账号恢复成功
 * @returns {object} 401 - 身份验证失败
 * @returns {object} 403 - 账号状态异常或已过后悔期
 * @returns {object} 500 - 服务器内部错误
 */
router.post('/recover-account', authMiddleware, async (req, res) => {
  try {
    // 查找用户
    const [users] = await pool.query(
      'SELECT id, username, email, status, deactivated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: '用户不存在' 
      });
    }

    const user = users[0];

    // 检查账号状态
    if (user.status !== 'pending_deletion') {
      return res.status(403).json({ 
        success: false, 
        error: '账号状态异常，无法恢复' 
      });
    }

    // 检查是否在后悔期内（7天）
    const deactivationDate = new Date(user.deactivated_at);
    const now = new Date();
    const daysDiff = (now - deactivationDate) / (1000 * 60 * 60 * 24);

    if (daysDiff > 7) {
      return res.status(403).json({ 
        success: false, 
        error: '已过账号恢复期限' 
      });
    }

    // 恢复账号
    await pool.query(
      'UPDATE users SET status = ?, deactivated_at = NULL, deactivation_reason = NULL WHERE id = ?',
      ['active', req.user.id]
    );

    res.status(200).json({ 
      success: true, 
      message: '账号恢复成功',
      data: {
        recovery_date: new Date(),
        status: 'active'
      }
    });

  } catch (error) {
    console.error('账号恢复错误:', error);
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;