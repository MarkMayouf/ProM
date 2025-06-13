const {
  createProxyMiddleware
} = require('http-proxy-middleware');

const PORT = process.env.BACKEND_PORT || 5001;
const TARGET = process.env.BACKEND_URL || `http://localhost:${PORT}`;

// Create React App expects CommonJS module syntax
module.exports = function (app) {
  const proxyConfig = {
    target: TARGET,
    changeOrigin: true,
    secure: false,
    ws: true,
    xfwd: true,
    timeout: 30000, // 30 second timeout

    onProxyReq: (proxyReq, req, res) => {
      const time = new Date().toISOString();
      console.log(`[${time}] [ProxyReq] ${req.method} ${req.url} → ${TARGET}${req.url}`);
      
      // Log request headers for debugging
      console.log('[ProxyReq] Headers:', req.headers);
      
      proxyReq.setHeader('X-Forwarded-For', req.connection.remoteAddress);
    },

    onProxyRes: (proxyRes, req, res) => {
      const time = new Date().toISOString();
      console.log(`[${time}] [ProxyRes] ${proxyRes.statusCode} ← ${req.method} ${req.url}`);
      
      // Log response headers for debugging
      console.log('[ProxyRes] Headers:', proxyRes.headers);
      
      // Log detailed information for non-200 responses
      if (proxyRes.statusCode >= 400) {
        console.error(`[ProxyError] ${proxyRes.statusCode} response for ${req.method} ${req.url}`);
        let responseBody = '';
        
        proxyRes.on('data', function(data) {
          responseBody += data.toString('utf8');
        });
        
        proxyRes.on('end', function() {
          try {
            const parsedBody = JSON.parse(responseBody);
            console.error('[ProxyError] Response body:', parsedBody);
          } catch (e) {
            console.error('[ProxyError] Response body (raw):', responseBody);
          }
        });
      }
    },

    onError: (err, req, res) => {
      const time = new Date().toISOString();
      console.error(`[${time}] [ProxyError]`, {
        error: err.message,
        code: err.code,
        stack: err.stack,
        url: req.url,
        method: req.method
      });
      
      if (!res.headersSent && res.writeHead) {
        try {
          res.writeHead(500, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          });
          res.end(JSON.stringify({ 
            message: 'Proxy Error',
            error: err.message,
            code: err.code,
            timestamp: new Date().toISOString()
          }));
        } catch (writeErr) {
          console.error('[ProxyError] Failed to send error response:', writeErr);
        }
      }
    }
  };

  // API routes proxy with retry logic
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  const apiProxy = createProxyMiddleware({
    ...proxyConfig,
    onProxyReq: (proxyReq, req, res) => {
      req.retries = req.retries || 0;
      proxyConfig.onProxyReq(proxyReq, req, res);
    },
    onError: async (err, req, res) => {
      if (req.retries < maxRetries) {
        req.retries++;
        console.log(`[Retry] Attempt ${req.retries} for ${req.method} ${req.url}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return apiProxy(req, res);
      }
      proxyConfig.onError(err, req, res);
    }
  });

  app.use('/api', apiProxy);

  // WebSocket proxy
  app.use('/ws', createProxyMiddleware({ ...proxyConfig, ws: true }));

  // Static assets proxy with caching headers
  const staticProxyConfig = {
    ...proxyConfig,
    onProxyRes: (proxyRes, req, res) => {
      // Add caching headers for static assets
      proxyRes.headers['Cache-Control'] = 'public, max-age=31536000';
      proxyConfig.onProxyRes(proxyRes, req, res);
    }
  };

  app.use(
    '/images',
    createProxyMiddleware(staticProxyConfig)
  );

  app.use(
    '/uploads',
    createProxyMiddleware(staticProxyConfig)
  );
}