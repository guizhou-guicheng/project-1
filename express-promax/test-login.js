const http = require('http');

// 测试注册
function testRegister() {
  const postData = JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  });

  const options = {
    hostname: 'localhost',
    port: 2000,
    path: '/auth/register',
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
      console.log('注册响应:', data);
      // 注册完成后测试登录
      testLogin();
    });
  });

  req.on('error', (e) => {
    console.error('注册请求错误:', e);
  });

  req.write(postData);
  req.end();
}

// 测试登录
function testLogin() {
  const postData = JSON.stringify({
    identifier: 'testuser',
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
      console.log('登录响应:', data);
    });
  });

  req.on('error', (e) => {
    console.error('登录请求错误:', e);
  });

  req.write(postData);
  req.end();
}

// 开始测试
testRegister();
