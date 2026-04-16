const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 모든 출처 CORS 허용
app.use(cors());

// 정적 파일 서빙 (대시보드 HTML)
app.use(express.static(path.join(__dirname, 'public')));

// 실시간 지하철 API 프록시
app.use('/api/subway', createProxyMiddleware({
  target: 'http://swopenapi.seoul.go.kr',
  changeOrigin: true,
  pathRewrite: { '^/api/subway': '/api/subway' },
  on: {
    proxyReq: (proxyReq, req) => {
      console.log(`[PROXY] ${req.method} ${req.url}`);
    },
    error: (err, req, res) => {
      console.error('[PROXY ERROR]', err.message);
      res.status(500).json({ error: 'Proxy error', message: err.message });
    }
  }
}));

// 일반 Open API 프록시 (필요시)
app.use('/api/general', createProxyMiddleware({
  target: 'http://openapi.seoul.go.kr',
  changeOrigin: true,
  pathRewrite: { '^/api/general': '' },
}));

app.listen(PORT, () => {
  console.log(`\n✅ 서울 지하철 CORS 프록시 서버 실행 중`);
  console.log(`   주소: http://localhost:${PORT}`);
  console.log(`   대시보드: http://localhost:${PORT}/index.html`);
  console.log(`   API 경로: http://localhost:${PORT}/api/subway/{인증키}/json/...`);
  console.log('\n   Ctrl+C 로 서버 종료\n');
});
