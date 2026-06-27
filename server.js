/**
 * HTTP 服务 — 为 dtrPicker 提供本地访问（Node.js 版）
 *
 * 用法：
 *   node server.js
 *   然后访问 http://localhost:16800/
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 16800;
const ROOT = __dirname;

/** MIME 类型映射 */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

const server = http.createServer((req, res) => {
  // 安全：拒绝路径遍历
  const clean = decodeURIComponent(req.url).split('?')[0];
  const normalized = path.normalize(clean).replace(/^(\.\.(\/|\\|$))+/, '');
  // 请求 '/' 时返回 index.html
  const relative = normalized === '/' || normalized === '\\' ? 'index.html' : normalized;
  const filePath = path.join(ROOT, relative);

  // 只服务 ROOT 下的文件
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(data);
  });
});

server.on('connection', (socket) => {
  // 忽略客户端断连错误
  socket.on('error', () => {});
});

server.listen(PORT, '0.0.0.0', () => {
  process.stderr.write(`Serving HTTP on 0.0.0.0:${PORT} (http://localhost:${PORT}/)\n`);
});
