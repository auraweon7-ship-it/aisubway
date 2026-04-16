const express = require('express');
const cors    = require('cors');
const https   = require('https');
const http    = require('http');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

/* ── 서울시 실시간 지하철 API 프록시 ── */
app.get('/api/subway/*', (req, res) => {
  // /api/subway/KEY/json/... → swopenapi.seoul.go.kr/api/subway/KEY/json/...
  const targetPath = req.url.replace(/^\/api\/subway/, '/api/subway');
  const options = {
    hostname: 'swopenapi.seoul.go.kr',
    port: 80,
    path: targetPath,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; SubwayProxy/1.0)'
    }
  };

  console.log(`[PROXY] → http://swopenapi.seoul.go.kr${targetPath}`);

  const proxyReq = http.request(options, (proxyRes) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = proxyRes.statusCode;

    let body = '';
    proxyRes.setEncoding('utf8');
    proxyRes.on('data', chunk => body += chunk);
    proxyRes.on('end', () => {
      console.log(`[PROXY] ← ${proxyRes.statusCode} (${body.length} bytes)`);
      res.end(body);
    });
  });

  proxyReq.on('error', (err) => {
    console.error('[PROXY ERROR]', err.message);
    res.status(502).json({ error: 'Proxy error', message: err.message });
  });

  proxyReq.setTimeout(10000, () => {
    proxyReq.destroy();
    res.status(504).json({ error: 'Timeout', message: '서울시 API 응답 시간 초과' });
  });

  proxyReq.end();
});

/* ── 일반 Open API 프록시 ── */
app.get('/api/general/*', (req, res) => {
  const targetPath = req.url.replace(/^\/api\/general/, '');
  const options = {
    hostname: 'openapi.seoul.go.kr',
    port: 8088,
    path: targetPath,
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.statusCode = proxyRes.statusCode;
    let body = '';
    proxyRes.setEncoding('utf8');
    proxyRes.on('data', chunk => body += chunk);
    proxyRes.on('end', () => res.end(body));
  });

  proxyReq.on('error', err => res.status(502).json({ error: err.message }));
  proxyReq.end();
});

/* ── 헬스체크 ── */
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`\n✅ 서울 지하철 프록시 서버 실행 중`);
  console.log(`   주소:     http://localhost:${PORT}`);
  console.log(`   대시보드: http://localhost:${PORT}/index.html`);
  console.log(`   헬스체크: http://localhost:${PORT}/health`);
  console.log('\n   Ctrl+C 로 서버 종료\n');
});
