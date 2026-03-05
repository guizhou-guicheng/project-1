/**
 * 认证相关工具函数
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// JWT密钥，建议在生产环境中通过环境变量设置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * 生成JWT令牌
 * @param {object} payload - 令牌载荷，包含用户信息
 * @param {string} expiresIn - 过期时间，默认7天
 * @returns {string} JWT令牌
 */
exports.generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @returns {object} 解码后的令牌载荷
 */
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('无效的令牌');
  }
};

/**
 * 密码加密
 * @param {string} password - 原始密码
 * @param {number} saltRounds - 加密强度，默认10
 * @returns {Promise<string>} 加密后的密码
 */
exports.hashPassword = async (password, saltRounds = 10) => {
  return await bcrypt.hash(password, saltRounds);
};

/**
 * 验证密码
 * @param {string} password - 原始密码
 * @param {string} hashedPassword - 加密后的密码
 * @returns {Promise<boolean>} 密码是否匹配
 */
exports.verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};