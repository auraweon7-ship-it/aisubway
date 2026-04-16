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

/* ── Anthropic Claude API 프록시 (CORS 우회) ── */
app.post('/api/claude', express.json({ limit: '4mb' }), async (req, res) => {
  const https = require('https');

  const payload = JSON.stringify({
    model:      req.body.model      || 'claude-sonnet-4-20250514',
    max_tokens: req.body.max_tokens || 1000,
    stream:     req.body.stream     || false,
    messages:   req.body.messages
  });

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'Content-Length':    Buffer.byteLength(payload),
      'anthropic-version': '2023-06-01',
      'x-api-key':         process.env.ANTHROPIC_API_KEY || ''
    }
  };

  console.log('[CLAUDE] 분석 요청 수신');

  // ── 스트리밍 모드 ──
  if (req.body.stream) {
    res.setHeader('Content-Type',        'text/event-stream');
    res.setHeader('Cache-Control',       'no-cache');
    res.setHeader('Connection',          'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const apiReq = https.request(options, (apiRes) => {
      apiRes.on('data', chunk => res.write(chunk));
      apiRes.on('end',  ()    => res.end());
    });
    apiReq.on('error', err => {
      console.error('[CLAUDE ERROR]', err.message);
      res.write(`data: {"error":"${err.message}"}\n\n`);
      res.end();
    });
    apiReq.write(payload);
    apiReq.end();

  // ── 일반 모드 ──
  } else {
    const apiReq = https.request(options, (apiRes) => {
      let body = '';
      apiRes.setEncoding('utf8');
      apiRes.on('data', c => body += c);
      apiRes.on('end', () => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = apiRes.statusCode;
        res.end(body);
      });
    });
    apiReq.on('error', err => {
      if (!res.headersSent)
        res.status(502).json({ error: err.message });
    });
    apiReq.write(payload);
    apiReq.end();
  }
});

/* ── CORS preflight ── */
app.options('/api/claude', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});


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
