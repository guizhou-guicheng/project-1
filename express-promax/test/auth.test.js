/**
 * 认证接口测试
 */
const assert = require('assert');
const request = require('supertest');
const app = require('../app');

// 测试用户数据
const testUser = {
  username: 'testuser' + Date.now(),
  email: 'test' + Date.now() + '@example.com',
  password: 'password123'
};

// 已注册用户（用于登录测试）
let registeredUser = null;

describe('认证接口测试', () => {
  // 测试注册接口
  describe('POST /auth/register', () => {
    it('应该成功注册新用户', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(testUser)
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, '注册成功');
      assert.ok(res.body.data.id);
      assert.strictEqual(res.body.data.username, testUser.username);
      assert.strictEqual(res.body.data.email, testUser.email);
      assert.ok(res.body.data.token);
      
      // 保存注册的用户信息用于后续测试
      registeredUser = res.body.data;
    });
    
    it('应该返回400错误当用户名为空', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: '',
          email: 'test@example.com',
          password: 'password123'
        })
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '数据验证失败');
    });
    
    it('应该返回400错误当邮箱格式无效', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123'
        })
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '数据验证失败');
    });
    
    it('应该返回400错误当密码长度不足', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123'
        })
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '数据验证失败');
    });
  });
  
  // 测试登录接口
  describe('POST /auth/login', () => {
    it('应该使用username参数成功登录', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password
        })
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, '登录成功');
      assert.ok(res.body.data.id);
      assert.strictEqual(res.body.data.username, testUser.username);
      assert.strictEqual(res.body.data.email, testUser.email);
      assert.ok(res.body.data.token);
    });
    
    it('应该使用identifier参数成功登录', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          identifier: testUser.username,
          password: testUser.password
        })
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, '登录成功');
      assert.ok(res.body.data.id);
      assert.strictEqual(res.body.data.username, testUser.username);
      assert.strictEqual(res.body.data.email, testUser.email);
      assert.ok(res.body.data.token);
    });
    
    it('应该返回401错误当密码错误', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        })
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '用户名/邮箱或密码错误');
    });
    
    it('应该返回400错误当用户名为空', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          password: testUser.password
        })
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '数据验证失败');
    });
    
    it('应该返回400错误当密码为空', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          username: testUser.username
        })
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '数据验证失败');
    });
  });
});