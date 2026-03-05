/**
 * SSE连接测试脚本
 */
const http = require('http');

// 发送SSE请求
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/sse/stream',
  method: 'GET',
  headers: {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache'
  }
};

console.log('开始测试SSE连接...');

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  
  // 处理响应数据
  res.on('data', (chunk) => {
    console.log('接收到数据:');
    console.log(chunk.toString());
  });
  
  // 处理连接结束
  res.on('end', () => {
    console.log('连接已关闭');
  });
});

// 处理错误
req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

// 发送请求
req.end();

// 5秒后关闭请求
setTimeout(() => {
  console.log('主动关闭连接');
  req.destroy();
}, 5000);