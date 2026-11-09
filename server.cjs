const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const files = {'/':'index.html','/index.html':'index.html','/app.js':'app.js','/curriculum.js':'curriculum.js','/shell.js':'shell.js','/guidance.js':'guidance.js','/style.css':'style.css','/terminal.css':'terminal.css'};
http.createServer((req,res)=>{const name=files[req.url.split('?')[0]];if(!name){res.writeHead(404);res.end('Not found');return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');res.end(fs.readFileSync(path.join(__dirname,name)));}).listen(8080,'127.0.0.1',()=>console.log('Terminal Quest : http://127.0.0.1:8080'));
