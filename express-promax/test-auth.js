const http = require('http');

// 测试配置
const BASE_URL = 'http://localhost:3000';

// 测试数据
const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'password123'
};

// 工具函数：发送 POST 请求
function sendPostRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// 测试用例
async function runTests() {
  console.log('=== 开始测试注册和登录接口 ===\n');
  
  let testResults = [];
  let currentTest = 1;
  
  // 测试 1: 正常注册
  console.log(`测试 ${currentTest++}: 正常注册`);
  try {
    const response = await sendPostRequest('/auth/register', testUser);
    const result = {
      test: '正常注册',
      expected: '201 Created',
      actual: `${response.statusCode} ${http.STATUS_CODES[response.statusCode]}`,
      success: response.statusCode === 201 && response.data.success === true,
      details: response.data
    };
    testResults.push(result);
    console.log(`结果: ${result.success ? '✓ 通过' : '✗ 失败'}`);
    console.log(`响应: ${JSON.stringify(response.data, null, 2)}\n`);
  } catch (error) {
    const result = {
      test: '正常注册',
      expected: '201 Created',
      actual: 'Error',
      success: false,
      details: error.message
    };
    testResults.push(result);
    console.log(`结果: ✗ 失败`);
    console.log(`错误: ${error.message}\n`);
  }
  
  // 测试 2: 用户名已存在
  console.log(`测试 ${currentTest++}: 用户名已存在`);
  try {
    const response = await sendPostRequest('/auth/register', testUser);
    const result = {
      test: '用户名已存在',
      expected: '400 Bad Request',
      actual: `${response.statusCode} ${http.STATUS_CODES[response.statusCode]}`,
      success: response.statusCode === 400 && response.data.error === '用户名已存在',
      details: response.data
    };
    testResults.push(result);
    console.log(`结果: ${result.success ? '✓ 通过' : '✗ 失败'}`);
    console.log(`响应: ${JSON.stringify(response.data, null, 2)}\n`);
  } catch (error) {
    const result = {
      test: '用户名已存在',
      expected: '400 Bad Request',
      actual: 'Error',
      success: false,
      details: error.message
    };
    testResults.push(result);
    console.log(`结果: ✗ 失败`);
    console.log(`错误: ${error.message}\n`);
  }
  
  // 测试 3: 邮箱已存在
  console.log(`测试 ${currentTest++}: 邮箱已存在`);
  try {
    const response = await sendPostRequest('/auth/register', {
      username: `testuser2_${Date.now()}`,
      email: testUser.email,
      password: 'password123'
    });
    const result = {
      test: '邮箱已存在',
      expected: '400 Bad Request',
      actual: `${response.statusCode} ${http.STATUS_CODES[response.statusCode]}`,
      success: response.statusCode === 400 && response.data.error === '邮箱已被注册',
      details: response.data
    };
    testResults.push(result);
    console.log(`结果: ${result.success ? '✓ 通过' : '✗ 失败'}`);
    console.log(`响应: ${JSON.stringify(response.data, null, 2)}\n`);
  } catch (error) {
    const result = {
      test: '邮箱已存在',
      expected: '400 Bad Request',
      actual: 'Error',
      success: false,
      details: error.message
    };
    testResults.push(result);
    console.log(`结果: ✗ 失败`);
    console.log(`错误: ${error.message}\n`);
  }
  
  // 测试 4: 数据验证失败 - 用户名太短
  console.log(`测试 ${currentTest++}: 数据验证失败 - 用户名太短`);
  try {
    const response = await sendPostRequest('/auth/register', {
      username: 'ab',
      email: `test_short_${Date.now()}@example.com`,
      password: 'password123'
    });
    const result = {
      test: '数据验证失败 - 用户名太短',
      expected: '400 Bad Request',
      actual: `${response.statusCode} ${http.STATUS_CODES[response.statusCode]}`,
      success: response.statusCode === 400 && response.data.error === '数据验证失败',
      details: response.data
    };
    testResults.push(result);
    console.log(`结果: ${result.success ? '✓ 通过' : '✗ 失败'}`);
    console.log(`响应: ${JSON.stringify(response.data, null, 2)}\n`);
  } catch (error) {
    const result = {
      test: '数据验证失败 - 用户名太短',
      expected: '400 Bad Request',
      actual: 'Error',
      success: false,
      details: error.message
    };
    testResults.push(result);
    console.log(`结果: ✗ 失败`);
    console.log(`错误: ${error.message}\n`);
  }
  
  // 测试 5: 数据验证失败 - 邮箱格式不正确
  console.log(`测试 ${currentTest++}: 数据验证失败 - 邮箱格式不正确`);
  try {
    const response = await sendPostRequest('/auth/register', {
      username: `testemail_${Date.now()}`,
      email: 'invalid-email',
      password: 'password123'
    });
    const result = {
      test: '数据验证失败 - 邮箱格式不正确',
      expected: '400 Bad Request',
      actual: `${response.statusCode} ${http.STATUS_CODES[response.statusCode]}`,
      success: response.statusCode === 400 && response.data.error === '数据验证失败',
      details: response.data
    };
    testResults.push(result);
    console.log(`结果: ${result.success ? '✓ 通过' : '✗ 失败'}`);
    console.log(`响应: ${JSON.stringify(response.data, null, 2)}\n`);
  } catch (error) {
    const result = {
      test: '数据验证失败 - 邮箱格式不正确',
      expected: '400 Bad Request',
      actual: 'Error',
      success: false,
      details: error.message
    };
    testResults.push(result);
    console.log(`结果: ✗ 失败`);
    console.log(`错误: ${error.message}\n`);
  }
  
  // 测试 6: 数据验证失败 - 密码太短
  console.log(`测试 ${currentTest++}: 数据验证失败 - 密码太短`);
  try {
    const response = await sendPostRequest('/auth/register', {
      username: `testpass_${Date.now()}`,
      email: `testpass_${Date.now()}@example.com`,
      password: '12345'
    });
    const result = {
      test: '数据验证失败 - 密码太短',
      expected: '400 Bad Request',
      actual: `${response.statusCode} ${http.STATUS_CODES[response.statusCode]}`,
      success: response.statusCode === 400 && response.data.error === '数据验证失败',
      details: response.data
    };
    testResults.push(result);
    console.log(`结果: ${result.success ? '✓ 通过' : '✗ 失败'}`);
    console.log(`响应: ${JSON.stringify(response.data, null, 2)}\n`);
  } catch (error) {
    const result = {
      test: '数据验证失败 - 密码太短',
      expected: '400 Bad Request',
      actual: 'Error',
      success: false,
      details: error.message
    };
    testResults.push(result);
    console.log(`结果: ✗ 失败`);
    console.log(`错误: ${error.message}\n`);
  }
  
  // 测试 7: 正常登录
  console.log(`测试 ${currentTest++}: 正常登录`);
  try {
    const response = await sendPostRequest('/auth/login', {
      identifier: testUser.username,
      password: testUser.password
    });
    const result = {
      test: '正常登录',
      expected: '200 OK',
      actual: `${response.statusCode} ${http.STATUS_CODES[response.statusCode]}`,
      success: response.statusCode === 200 && response.data.success === true,
      details: response.data
    };
    testResults.push(result);
    console.log(`结果: ${result.success ? '✓ 通过' : '✗ 失败'}`);
    console.log(`响应: ${JSON.stringify(response.data, null, 2)}\n`);
  } catch (error) {
    const result = {
      test: '正常登录',
      expected: '200 OK',
      actual: 'Error',
      success: false,
      details: error.message
    };
    testResults.push(result);
    console.log(`结果: ✗ 失败`);
    console.log(`错误: ${error.message}\n`);
  }
  
  // 测试 8: 用户名/邮箱不存在
  console.log(`测试 ${currentTest++}: 用户名/邮箱不存在`);
  try {
    const response = await sendPostRequest('/auth/login', {
      identifier: 'nonexistentuser',
      password: 'password123'
    });
    const result = {
      test: '用户名/邮箱不存在',
      expected: '401 Unauthorized',
      actual: `${response.statusCode} ${http.STATUS_CODES[response.statusCode]}`,
      success: response.statusCode === 401 && response.data.error === '用户名/邮箱或密码错误',
      details: response.data
    };
    testResults.push(result);
    console.log(`结果: ${result.success ? '✓ 通过' : '✗ 失败'}`);
    console.log(`响应: ${JSON.stringify(response.data, null, 2)}\n`);
  } catch (error) {
    const result = {
      test: '用户名/邮箱不存在',
      expected: '401 Unauthorized',
      actual: 'Error',
      success: false,
      details: error.message
    };
    testResults.push(result);
    console.log(`结果: ✗ 失败`);
    console.log(`错误: ${error.message}\n`);
  }
  
  // 测试 9: 密码错误
  console.log(`测试 ${currentTest++}: 密码错误`);
  try {
    const response = await sendPostRequest('/auth/login', {
      identifier: testUser.username,
      password: 'wrongpassword'
    });
    const result = {
      test: '密码错误',
      expected: '401 Unauthorized',
      actual: `${response.statusCode} ${http.STATUS_CODES[response.statusCode]}`,
      success: response.statusCode === 401 && response.data.error === '用户名/邮箱或密码错误',
      details: response.data
    };
    testResults.push(result);
    console.log(`结果: ${result.success ? '✓ 通过' : '✗ 失败'}`);
    console.log(`响应: ${JSON.stringify(response.data, null, 2)}\n`);
  } catch (error) {
    const result = {
      test: '密码错误',
      expected: '401 Unauthorized',
      actual: 'Error',
      success: false,
      details: error.message
    };
    testResults.push(result);
    console.log(`结果: ✗ 失败`);
    console.log(`错误: ${error.message}\n`);
  }
  
  // 测试 10: 数据验证失败 - 未提供标识符
  console.log(`测试 ${currentTest++}: 数据验证失败 - 未提供标识符`);
  try {
    const response = await sendPostRequest('/auth/login', {
      password: 'password123'
    });
    const result = {
      test: '数据验证失败 - 未提供标识符',
      expected: '400 Bad Request',
      actual: `${response.statusCode} ${http.STATUS_CODES[response.statusCode]}`,
      success: response.statusCode === 400 && response.data.error === '数据验证失败',
      details: response.data
    };
    testResults.push(result);
    console.log(`结果: ${result.success ? '✓ 通过' : '✗ 失败'}`);
    console.log(`响应: ${JSON.stringify(response.data, null, 2)}\n`);
  } catch (error) {
    const result = {
      test: '数据验证失败 - 未提供标识符',
      expected: '400 Bad Request',
      actual: 'Error',
      success: false,
      details: error.message
    };
    testResults.push(result);
    console.log(`结果: ✗ 失败`);
    console.log(`错误: ${error.message}\n`);
  }
  
  // 测试 11: 数据验证失败 - 未提供密码
  console.log(`测试 ${currentTest++}: 数据验证失败 - 未提供密码`);
  try {
    const response = await sendPostRequest('/auth/login', {
      identifier: testUser.username
    });
    const result = {
      test: '数据验证失败 - 未提供密码',
      expected: '400 Bad Request',
      actual: `${response.statusCode} ${http.STATUS_CODES[response.statusCode]}`,
      success: response.statusCode === 400 && response.data.error === '数据验证失败',
      details: response.data
    };
    testResults.push(result);
    console.log(`结果: ${result.success ? '✓ 通过' : '✗ 失败'}`);
    console.log(`响应: ${JSON.stringify(response.data, null, 2)}\n`);
  } catch (error) {
    const result = {
      test: '数据验证失败 - 未提供密码',
      expected: '400 Bad Request',
      actual: 'Error',
      success: false,
      details: error.message
    };
    testResults.push(result);
    console.log(`结果: ✗ 失败`);
    console.log(`错误: ${error.message}\n`);
  }
  
  // 生成测试报告
  console.log('=== 测试报告 ===');
  console.log(`总测试用例: ${testResults.length}`);
  const passedTests = testResults.filter(r => r.success).length;
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${testResults.length - passedTests}`);
  console.log(`通过率: ${((passedTests / testResults.length) * 100).toFixed(2)}%`);
  
  console.log('\n失败的测试用例:');
  const failedTests = testResults.filter(r => !r.success);
  if (failedTests.length === 0) {
    console.log('所有测试用例都通过了！');
  } else {
    failedTests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.test}`);
      console.log(`   期望: ${test.expected}`);
      console.log(`   实际: ${test.actual}`);
      console.log(`   详情: ${JSON.stringify(test.details, null, 2)}`);
      console.log('');
    });
  }
  
  console.log('=== 测试完成 ===');
}

// 运行测试
runTests().catch(console.error);
