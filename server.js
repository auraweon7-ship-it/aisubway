const express = require('express');
const cors    = require('cors');
const http    = require('http');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

/* ── 서울시 실시간 지하철 API 프록시 ── */
app.get('/api/subway/*path', (req, res) => {
  const targetPath = '/api/subway/' + req.params.path +
    (Object.keys(req.query).length ? '?' + new URLSearchParams(req.query).toString() : '');

  console.log(`[PROXY] → http://swopenapi.seoul.go.kr${targetPath}`);

  const options = {
    hostname: 'swopenapi.seoul.go.kr',
    port: 80,
    path: targetPath,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0'
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = proxyRes.statusCode;
    let body = '';
    proxyRes.setEncoding('utf8');
    proxyRes.on('data', chunk => { body += chunk; });
    proxyRes.on('end', () => {
      console.log(`[PROXY] ← ${proxyRes.statusCode} (${body.length}bytes)`);
      res.end(body);
    });
  });

  proxyReq.on('error', (err) => {
    console.error('[PROXY ERROR]', err.message);
    res.status(502).json({ error: 'Proxy error', message: err.message });
  });

  proxyReq.setTimeout(10000, () => {
    proxyReq.destroy();
    res.status(504).json({ error: 'Timeout' });
  });

  proxyReq.end();
});

/* ── 헬스체크 ── */
app.get('/health', (_, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n✅ 서울 지하철 프록시 서버 실행 중`);
  console.log(`   포트: ${PORT}`);
  console.log(`   헬스체크: /health\n`);
});
