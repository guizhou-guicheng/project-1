const mysql = require('mysql2/promise');
const express = require('express'); // 确保引入express（如果已有可忽略）

// 创建数据库连接池（保留原有所有配置）
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'a15338636582',
  database: process.env.DB_NAME || 'express_pro',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 20, // 增加连接池大小以支持更多并发请求
  queueLimit: 0,
  enableKeepAlive: true, // 启用连接保活
  keepAliveInitialDelay: 30000, // 30秒后开始保活
  connectTimeout: 10000, // 连接超时时间
  acquireTimeout: 10000 // 获取连接超时时间
});

// 测试连接并在数据库不存在时创建（保留原有核心逻辑，仅优化错误处理）
async function initializeDatabase(res) { // 新增res参数，用于返回响应
  let connection;
  try {
    // 首先不指定数据库连接，检查是否需要创建数据库
    const tempPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'a15338636582',
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    connection = await tempPool.getConnection();

    // 检查数据库是否存在
    const [databases] = await connection.query(
      `SHOW DATABASES LIKE '${process.env.DB_NAME || 'express_pro'}'`
    );

    if (databases.length === 0) {
      // 如果数据库不存在则创建
      await connection.query(
        `CREATE DATABASE ${process.env.DB_NAME || 'express_pro'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log('数据库创建成功');
    }

    connection.release();
    tempPool.end();

    // 现在测试与实际数据库的连接
    const testConnection = await pool.getConnection();

    // 检查用户表是否存在
    const [tables] = await testConnection.query(
      "SHOW TABLES LIKE 'users'"
    );

    if (tables.length > 0) {
      // 表存在，检查是否需要添加新字段
      const [columns] = await testConnection.query(
        "SHOW COLUMNS FROM users"
      );

      const columnNames = columns.map(col => col.Field);

      // 如果status字段不存在，添加它
      if (!columnNames.includes('status')) {
        await testConnection.query(
          "ALTER TABLE users ADD COLUMN status ENUM('active', 'pending_deletion', 'deleted') DEFAULT 'active'"
        );
      }

      // 如果deactivated_at字段不存在，添加它
      if (!columnNames.includes('deactivated_at')) {
        await testConnection.query(
          "ALTER TABLE users ADD COLUMN deactivated_at TIMESTAMP NULL"
        );
      }

      // 如果deactivation_reason字段不存在，添加它
      if (!columnNames.includes('deactivation_reason')) {
        await testConnection.query(
          "ALTER TABLE users ADD COLUMN deactivation_reason VARCHAR(255) NULL"
        );
      }
    } else {
      // 表不存在，创建新表
      await testConnection.query(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          status ENUM('active', 'pending_deletion', 'deleted') DEFAULT 'active',
          deactivated_at TIMESTAMP NULL,
          deactivation_reason VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
    console.log('用户表已创建或已存在');

    console.log('数据库连接成功');
    testConnection.release();

    // 通过res返回成功响应（适配Express）
    if (res) {
      res.status(200).json({
        success: true,
        message: '数据库初始化成功，连接已建立',
        data: {
          database: process.env.DB_NAME || 'express_pro',
          table: 'users'
        }
      });
    }

  } catch (error) {
    console.error('数据库连接错误:', error);
    // 通过res返回错误响应（适配Express）
    if (res) {
      res.status(500).json({
        success: false,
        message: '数据库初始化失败',
        error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message // 生产环境隐藏具体错误
      });
    }
    throw error; // 继续抛出错误，方便外层捕获
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 【新增】封装通用数据库查询方法（结合res返回结果）
async function query(sql, params, res) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);
    connection.release();

    // 通过res返回查询成功结果
    res.status(200).json({
      success: true,
      message: '查询成功',
      data: results
    });
    return results; // 同时返回结果，方便后续处理
  } catch (error) {
    console.error('数据库查询错误:', error);
    if (connection) connection.release();

    // 通过res返回查询错误
    res.status(500).json({
      success: false,
      message: '数据库操作失败',
      error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message
    });
    throw error;
  }
}

// 【新增】封装通用数据库增删改方法（结合res返回结果）
async function execute(sql, params, res) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);
    connection.release();

    // 通过res返回操作成功结果
    res.status(200).json({
      success: true,
      message: '操作成功',
      data: {
        affectedRows: results.affectedRows,
        insertId: results.insertId || null // 新增数据时返回自增ID
      }
    });
    return results;
  } catch (error) {
    console.error('数据库执行错误:', error);
    if (connection) connection.release();

    // 通过res返回操作错误
    res.status(500).json({
      success: false,
      message: '数据库操作失败',
      error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : error.message
    });
    throw error;
  }
}

// 连接池错误处理（保留原有逻辑）
pool.on('error', (err) => {
  console.error('MySQL连接池错误:', err);
});

// 【新增】初始化数据库的Express接口示例（演示如何结合res使用）
const dbRouter = express.Router();
// 初始化数据库接口
dbRouter.get('/init-db', (req, res) => {
  initializeDatabase(res); // 传入res，由初始化函数直接返回响应
});

// 示例：查询用户列表接口
dbRouter.get('/users', (req, res) => {
  const sql = 'SELECT id, username, email, status FROM users WHERE status = ?';
  const params = ['active'];
  query(sql, params, res); // 调用封装的query方法，自动通过res返回结果
});

// 示例：新增用户接口
dbRouter.post('/users', express.json(), (req, res) => {
  const { username, email, password } = req.body;
  // 参数校验
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名、邮箱、密码不能为空'
    });
  }
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  const params = [username, email, password];
  execute(sql, params, res); // 调用封装的execute方法
});

// 导出内容（包含原有+新增）
module.exports = {
  pool, // 保留原有连接池导出
  initializeDatabase, // 保留原有初始化函数（已适配res）
  query, // 新增通用查询方法（带res响应）
  execute, // 新增通用增删改方法（带res响应）
  dbRouter // 导出数据库相关路由，可直接挂载到Express app
};