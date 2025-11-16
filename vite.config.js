import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // تحميل environment variables
  const env = loadEnv(mode, process.cwd(), '')
  
  // الحصول على API URL من environment variable أو استخدام القيمة الافتراضية
  // الـ Base URL الصحيح هو: https://api.deutsch-tests.com
  const apiUrl = env.VITE_API_URL || 'https://api.deutsch-tests.com'
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // للسماح بالوصول من أي عنوان IP
      port: 5173,
      strictPort: false,
      proxy: {
        '/api': {
          // في التطوير، الـ proxy يوجه الطلبات إلى Railway Backend
          target: apiUrl,
          changeOrigin: true,
          secure: true, // استخدم true للـ HTTPS
          // إزالة /api من المسار قبل إرساله للـ Backend
          // لأن الـ Backend يتوقع /auth/login وليس /api/auth/login
          rewrite: (path) => {
            const newPath = path.replace(/^\/api/, '');
            console.log('🔄 Rewriting path:', path, '→', newPath);
            return newPath;
          },
          configure: (proxy, _options) => {
            proxy.on('error', (err, req, res) => {
              console.error('❌ Proxy Error:', err.message);
              console.error('Request URL:', req.url);
              if (!res.headersSent) {
                res.writeHead(502, {
                  'Content-Type': 'application/json',
                });
                res.end(JSON.stringify({
                  error: 'Bad Gateway',
                  message: 'لا يمكن الوصول إلى الـ Backend. تأكد من أن السيرفر يعمل.',
                  details: err.message
                }));
              }
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('📤 Sending Request:', req.method, req.url);
              console.log('   → Target URL:', `${apiUrl}${proxyReq.path}`);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('📥 Received Response:', proxyRes.statusCode, req.url);
              if (proxyRes.statusCode === 404) {
                console.error('⚠️ 404 Error - الـ endpoint غير موجود على الـ Backend');
                console.error('   حاول الوصول إلى:', `${apiUrl}${req.url}`);
              }
            });
          },
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
    },
  }
})
