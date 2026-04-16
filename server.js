const express = require('express');
const cors    = require('cors');
const http    = require('http');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

/* ── 공통 프록시 함수 ── */
function proxyRequest(hostname, port, targetPath, res) {
  const options = {
    hostname,
    port,
    path: targetPath,
    method: 'GET',
    headers: {
      'Accept':     'application/json',
      'User-Agent': 'Mozilla/5.0'
    }
  };

  console.log(`[PROXY] → http://${hostname}:${port}${targetPath}`);

  const proxyReq = http.request(options, (proxyRes) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = proxyRes.statusCode;
    let body = '';
    proxyRes.setEncoding('utf8');
    proxyRes.on('data', chunk => { body += chunk; });
    proxyRes.on('end', () => {
      console.log(`[PROXY] ← ${proxyRes.statusCode} (${body.length} bytes)`);
      res.end(body);
    });
  });

  proxyReq.on('error', (err) => {
    console.error('[PROXY ERROR]', err.message);
    if (!res.headersSent)
      res.status(502).json({ error: 'Proxy error', message: err.message });
  });

  proxyReq.setTimeout(10000, () => {
    proxyReq.destroy();
    if (!res.headersSent)
      res.status(504).json({ error: 'Timeout' });
  });

  proxyReq.end();
}

/* ── 실시간 지하철 API 프록시 ── */
app.get('/api/subway/*path', (req, res) => {
  const pathArr    = Array.isArray(req.params.path) ? req.params.path : [req.params.path];
  const joined     = pathArr.map(encodeURIComponent).join('/');
  const targetPath = '/api/subway/' + joined +
    (Object.keys(req.query).length
      ? '?' + new URLSearchParams(req.query).toString()
      : '');
  proxyRequest('swopenapi.seoul.go.kr', 80, targetPath, res);
});

/* ── 일반 Open API 프록시 (포트 8088) ── */
app.get('/api/general/*path', (req, res) => {
  const pathArr    = Array.isArray(req.params.path) ? req.params.path : [req.params.path];
  const joined     = pathArr.map(encodeURIComponent).join('/');
  const targetPath = '/' + joined +
    (Object.keys(req.query).length
      ? '?' + new URLSearchParams(req.query).toString()
      : '');
  proxyRequest('openapi.seoul.go.kr', 8088, targetPath, res);
});

/* ── 진단 엔드포인트: 서버 IP 및 API 직접 호출 결과 확인 ── */
app.get('/debug', (req, res) => {
  const testPath = '/api/subway/685a4d4b48617572373962795a424b/json/realtimeStationArrival/0/3/%EA%B0%95%EB%82%A8';
  const options  = {
    hostname: 'swopenapi.seoul.go.kr',
    port: 80,
    path: testPath,
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' }
  };

  const result = { serverTime: new Date().toISOString(), apiUrl: `http://swopenapi.seoul.go.kr${testPath}` };

  const testReq = http.request(options, (testRes) => {
    let body = '';
    testRes.setEncoding('utf8');
    testRes.on('data', c => body += c);
    testRes.on('end', () => {
      result.statusCode = testRes.statusCode;
      result.apiResponse = body.substring(0, 500);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(result);
    });
  });
  testReq.on('error', err => {
    result.error = err.message;
    res.json(result);
  });
  testReq.setTimeout(8000, () => { testReq.destroy(); result.error = 'timeout'; res.json(result); });
  testReq.end();
});

/* ── 헬스체크 ── */
app.get('/health', (_, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n✅ 서울 지하철 프록시 서버 실행 중`);
  console.log(`   포트:     ${PORT}`);
  console.log(`   헬스체크: /health`);
  console.log(`   진단:     /debug\n`);
});
