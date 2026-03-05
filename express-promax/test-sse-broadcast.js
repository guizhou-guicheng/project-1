/**
 * SSE广播测试脚本
 */
const http = require('http');

// 测试广播功能
function testBroadcast() {
  console.log('开始测试SSE广播功能...');
  
  const postData = JSON.stringify({
    event: 'custom',
    data: {
      message: 'Hello from broadcast test',
      timestamp: Date.now(),
      test: true
    }
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/sse/broadcast',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('广播响应:');
      console.log(JSON.parse(data));
    });
  });
  
  req.on('error', (e) => {
    console.error(`广播请求错误: ${e.message}`);
  });
  
  req.write(postData);
  req.end();
}

// 测试统计功能
function testStats() {
  console.log('\n开始测试SSE统计功能...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/sse/stats',
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('统计响应:');
      console.log(JSON.parse(data));
    });
  });
  
  req.on('error', (e) => {
    console.error(`统计请求错误: ${e.message}`);
  });
  
  req.end();
}

// 先测试广播功能，再测试统计功能
testBroadcast();
setTimeout(testStats, 1000);