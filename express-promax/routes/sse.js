/**
 * Server-Sent Events (SSE) 路由模块
 * 提供实时数据推送功能
 */
const express = require('express');
const router = express.Router();

// 存储所有活跃的SSE连接
const clients = new Map();

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 发送SSE消息
 * @param {Object} res - Express响应对象
 * @param {string} event - 事件类型
 * @param {Object} data - 消息数据
 * @param {string} id - 消息ID
 */
function sendSSE(res, event, data, id) {
  if (res.writable) {
    if (id) {
      res.write(`id: ${id}\n`);
    }
    if (event) {
      res.write(`event: ${event}\n`);
    }
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

/**
 * 发送心跳包
 */
function sendHeartbeat() {
  clients.forEach((res, clientId) => {
    sendSSE(res, 'heartbeat', { timestamp: Date.now() });
  });
}

// 每30秒发送一次心跳包
setInterval(sendHeartbeat, 30000);

/**
 * SSE连接接口
 * @route GET /sse/stream
 * @description 建立SSE连接，持续接收实时数据
 * @param {string} eventType - 可选，指定要订阅的事件类型
 * @returns {text/event-stream} 持续的SSE数据流
 */
router.get('/stream', (req, res) => {
  // 设置SSE响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*'); // 支持跨域
  
  // 生成客户端ID
  const clientId = generateId();
  
  // 存储连接
  clients.set(clientId, res);
  console.log(`SSE client connected: ${clientId}`);
  
  // 发送欢迎消息
  sendSSE(res, 'welcome', {
    message: 'SSE连接已建立',
    clientId: clientId,
    timestamp: Date.now()
  });
  
  // 处理客户端断开连接
  req.on('close', () => {
    clients.delete(clientId);
    console.log(`SSE client disconnected: ${clientId}`);
  });
  
  // 处理错误
  req.on('error', (err) => {
    console.error(`SSE client error: ${clientId}`, err);
    clients.delete(clientId);
  });
  
  // 模拟实时数据推送
  const interval = setInterval(() => {
    if (!clients.has(clientId)) {
      clearInterval(interval);
      return;
    }
    
    // 发送实时数据
    sendSSE(res, 'data', {
      timestamp: Date.now(),
      randomValue: Math.random(),
      message: '实时数据更新'
    });
  }, 5000);
});

/**
 * 向所有客户端广播消息
 * @route POST /sse/broadcast
 * @description 向所有连接的客户端广播消息
 * @param {string} event - 事件类型
 * @param {Object} data - 消息数据
 * @returns {object} 广播结果
 */
router.post('/broadcast', (req, res) => {
  const { event, data } = req.body;
  
  if (!event || !data) {
    return res.status(400).json({
      success: false,
      error: '事件类型和数据不能为空'
    });
  }
  
  const messageId = generateId();
  let sentCount = 0;
  
  clients.forEach((clientRes, clientId) => {
    sendSSE(clientRes, event, data, messageId);
    sentCount++;
  });
  
  res.json({
    success: true,
    message: `广播消息已发送`,
    data: {
      event: event,
      messageId: messageId,
      sentTo: sentCount,
      totalClients: clients.size
    }
  });
});

/**
 * 获取当前连接数
 * @route GET /sse/stats
 * @description 获取当前SSE连接数
 * @returns {object} 连接统计信息
 */
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      connectedClients: clients.size,
      timestamp: Date.now()
    }
  });
});

module.exports = router;