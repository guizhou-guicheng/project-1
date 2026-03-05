/**
 * 性能测试脚本
 * 测试优化前后的性能差异
 */
const http = require('http');
const url = require('url');

// 测试配置
const config = {
  baseUrl: 'http://localhost:3000',
  iterations: 100,
  concurrency: 10
};

// 测试用户数据
const testUser = {
  username: 'performancetest' + Date.now(),
  email: 'performance' + Date.now() + '@example.com',
  password: 'password123'
};

// 存储测试结果
const results = {
  register: [],
  login: []
};

// 发送HTTP请求
function sendRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: data });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

// 测试注册接口
async function testRegister() {
  console.log('测试注册接口...');
  
  const options = {
    hostname: url.parse(config.baseUrl).hostname,
    port: url.parse(config.baseUrl).port,
    path: '/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const postData = JSON.stringify(testUser);

  for (let i = 0; i < config.iterations; i++) {
    const startTime = Date.now();
    try {
      const response = await sendRequest(options, postData);
      const endTime = Date.now();
      results.register.push(endTime - startTime);
      if (i % 10 === 0) {
        console.log(`注册测试进度: ${i}/${config.iterations}`);
      }
    } catch (error) {
      console.error('注册测试错误:', error);
    }
  }
}

// 测试登录接口
async function testLogin() {
  console.log('测试登录接口...');
  
  const options = {
    hostname: url.parse(config.baseUrl).hostname,
    port: url.parse(config.baseUrl).port,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const postData = JSON.stringify({
    username: testUser.username,
    password: testUser.password
  });

  for (let i = 0; i < config.iterations; i++) {
    const startTime = Date.now();
    try {
      const response = await sendRequest(options, postData);
      const endTime = Date.now();
      results.login.push(endTime - startTime);
      if (i % 10 === 0) {
        console.log(`登录测试进度: ${i}/${config.iterations}`);
      }
    } catch (error) {
      console.error('登录测试错误:', error);
    }
  }
}

// 计算性能统计数据
function calculateStats(data) {
  if (data.length === 0) return { avg: 0, min: 0, max: 0, median: 0 };
  
  const sorted = data.sort((a, b) => a - b);
  const sum = data.reduce((acc, val) => acc + val, 0);
  
  return {
    avg: sum / data.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)]
  };
}

// 生成性能报告
function generateReport() {
  console.log('\n===== 性能测试报告 =====');
  
  const registerStats = calculateStats(results.register);
  const loginStats = calculateStats(results.login);
  
  console.log('\n注册接口性能:');
  console.log(`平均响应时间: ${registerStats.avg.toFixed(2)}ms`);
  console.log(`最小响应时间: ${registerStats.min}ms`);
  console.log(`最大响应时间: ${registerStats.max}ms`);
  console.log(`中位数响应时间: ${registerStats.median}ms`);
  
  console.log('\n登录接口性能:');
  console.log(`平均响应时间: ${loginStats.avg.toFixed(2)}ms`);
  console.log(`最小响应时间: ${loginStats.min}ms`);
  console.log(`最大响应时间: ${loginStats.max}ms`);
  console.log(`中位数响应时间: ${loginStats.median}ms`);
  
  console.log('\n===== 测试完成 =====');
}

// 运行性能测试
async function runPerformanceTest() {
  try {
    // 先注册一个测试用户
    await testRegister();
    // 然后测试登录
    await testLogin();
    // 生成报告
    generateReport();
  } catch (error) {
    console.error('性能测试错误:', error);
  }
}

// 启动性能测试
runPerformanceTest();