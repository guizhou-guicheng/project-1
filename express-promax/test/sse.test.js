/**
 * SSE接口测试
 */
const assert = require('assert');
const request = require('supertest');
const app = require('../app');

// 测试SSE接口
describe('SSE接口测试', () => {
  describe('GET /sse/stream', () => {
    it('应该返回200状态码和正确的响应头', function(done) {
      // 使用原生http模块测试
      const http = require('http');
      const server = app.listen(0, () => {
        const port = server.address().port;
        const options = {
          hostname: 'localhost',
          port: port,
          path: '/sse/stream',
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream'
          }
        };
        
        const req = http.request(options, (res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.strictEqual(res.headers['content-type'], 'text/event-stream');
          assert.strictEqual(res.headers['cache-control'], 'no-cache');
          assert.strictEqual(res.headers['connection'], 'keep-alive');
          assert.strictEqual(res.headers['access-control-allow-origin'], '*');
          req.destroy(); // 立即销毁请求
          server.close();
          done();
        });
        
        req.on('error', (err) => {
          server.close();
          // 忽略销毁请求导致的错误
          if (err.code !== 'ECONNRESET') {
            done(err);
          } else {
            done();
          }
        });
        
        req.end();
      });
    });
  });
  
  describe('POST /sse/broadcast', () => {
    it('应该成功广播消息', async () => {
      const res = await request(app)
        .post('/sse/broadcast')
        .send({
          event: 'test',
          data: { message: 'test message' }
        })
        .set('Content-Type', 'application/json');
      
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, '广播消息已发送');
      assert.strictEqual(res.body.data.event, 'test');
    });
    
    it('应该返回400错误当事件类型或数据为空', async () => {
      const res = await request(app)
        .post('/sse/broadcast')
        .send({})
        .set('Content-Type', 'application/json');
      
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, '事件类型和数据不能为空');
    });
  });
  
  describe('GET /sse/stats', () => {
    it('应该返回连接统计信息', async () => {
      const res = await request(app)
        .get('/sse/stats');
      
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.connectedClients >= 0);
      assert.ok(res.body.data.timestamp);
    });
  });
});