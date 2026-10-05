/* 零依赖静态文件服务器：npm run dev -- --port 7100 --host 127.0.0.1
   仅用于本地预览；游戏本身双击 index.html 即可玩，不需要它。 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let port = 7100, host = '127.0.0.1';
for(let i = 0; i < args.length; i++){
  if((args[i] === '--port' || args[i] === '-p') && args[i + 1]) port = Number(args[++i]);
  if((args[i] === '--host' || args[i] === '-h') && args[i + 1]) host = args[++i];
}
// 兼容 `--port=1234` 写法
args.forEach(a => {
  const m = a.match(/^--port=(\d+)$/); if(m) port = Number(m[1]);
  const h = a.match(/^--host=(.+)$/); if(h) host = h[1];
});

const ROOT = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if(urlPath === '/') urlPath = '/index.html';
  const file = path.join(ROOT, path.normalize(urlPath));
  if(!file.startsWith(ROOT)){ res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if(err){ res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, host, () => console.log('奶蛙工厂预览: http://' + host + ':' + port + '/'));
