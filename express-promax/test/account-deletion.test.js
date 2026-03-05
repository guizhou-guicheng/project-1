/**
 * 账号注销和恢复功能测试
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

// 存储测试用户的token
let testToken = null;

describe('账号注销和恢复功能测试', () => {
  // 先注册一个测试用户
  before(async () => {
    const res = await request(app)
      .post('/auth/register')
      .send(testUser)
      .set('Accept', 'application/json');
    
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    testToken = res.body.data.token;
  });
  
  // 测试账号注销接口
  describe('POST /auth/delete-account', () => {
    it('应该返回401错误当未提供认证令牌', async () => {
      const res = await request(app)
        .post('/auth/delete-account')
        .send({ password: testUser.password })
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '未提供认证令牌');
    });
    
    it('应该返回400错误当未提供密码', async () => {
      const res = await request(app)
        .post('/auth/delete-account')
        .send({})
        .set('Authorization', `Bearer ${testToken}`)
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '数据验证失败');
    });
    
    it('应该返回401错误当密码错误', async () => {
      const res = await request(app)
        .post('/auth/delete-account')
        .send({ password: 'wrongpassword' })
        .set('Authorization', `Bearer ${testToken}`)
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '密码错误');
    });
    
    it('应该成功提交账号注销请求', async () => {
      const res = await request(app)
        .post('/auth/delete-account')
        .send({ password: testUser.password })
        .set('Authorization', `Bearer ${testToken}`)
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, '账号注销请求已提交，我们已发送确认邮件到您的邮箱。您有7天时间可以恢复账号。');
    });
    
    it('应该返回403错误当账号状态异常', async () => {
      // 再次尝试注销，此时账号状态应该是pending_deletion
      const res = await request(app)
        .post('/auth/delete-account')
        .send({ password: testUser.password })
        .set('Authorization', `Bearer ${testToken}`)
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '账号状态异常，无法注销');
    });
  });
  
  // 测试账号恢复接口
  describe('POST /auth/recover-account', () => {
    it('应该成功恢复账号', async () => {
      const res = await request(app)
        .post('/auth/recover-account')
        .set('Authorization', `Bearer ${testToken}`)
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, '账号恢复成功');
    });
    
    it('应该返回401错误当未提供认证令牌', async () => {
      const res = await request(app)
        .post('/auth/recover-account')
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '未提供认证令牌');
    });
    
    it('应该返回403错误当账号状态异常', async () => {
      // 再次尝试恢复，此时账号状态应该是active
      const res = await request(app)
        .post('/auth/recover-account')
        .set('Authorization', `Bearer ${testToken}`)
        .set('Accept', 'application/json');
      
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '账号状态异常，无法恢复');
    });
  });
});