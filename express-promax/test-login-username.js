const http = require('http');

// 测试使用username参数登录
function testLoginWithUsername() {
  const postData = JSON.stringify({
    username: 'testuser',
    password: 'password123'
  });

  const options = {
    hostname: 'localhost',
    port: 2000,
    path: '/auth/login',
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
      console.log('登录响应 (使用username):', data);
      console.log('状态码:', res.statusCode);
    });
  });

  req.on('error', (e) => {
    console.error('登录请求错误:', e);
  });

  req.write(postData);
  req.end();
}

// 开始测试
testLoginWithUsername();