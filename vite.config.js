import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import cesium from 'vite-plugin-cesium'

function withSafeCorsHeaders(target, rewrite) {
  return {
    target,
    changeOrigin: true,
    secure: false,
    rewrite,
    configure: (proxy) => {
      proxy.on('proxyRes', (proxyRes) => {
        proxyRes.headers['access-control-allow-origin'] = '*'
        proxyRes.headers['access-control-allow-methods'] = 'GET,OPTIONS'
        proxyRes.headers['access-control-allow-headers'] = '*'
        delete proxyRes.headers['access-control-allow-credentials']
      })
    }
  }
}

export default defineConfig({
  plugins: [cesium(), {
    name: 'serve-public-tiles',
    configureServer(server) {
      // 服务 public/VectorTile 目录下的 .pbf 矢量瓦片
      server.middlewares.use('/VectorTile', (req, res, next) => {
        const filePath = path.join(__dirname, 'public', 'VectorTile', req.url.split('?')[0]);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'application/x-protobuf');
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
      // 服务 public/my_tiles 目录下的栅格瓦片（.jpg 或 .png）
      server.middlewares.use('/my_tiles', (req, res, next) => {
        const filePath = path.join(__dirname, 'public', 'my_tiles', req.url.split('?')[0]);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
          } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
          }
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    }
  }],
  server: {
    proxy: {
      '/proxy/gaode-vector': withSafeCorsHeaders(
        'https://wprd01.is.autonavi.com',
        (path) => path.replace(/^\/proxy\/gaode-vector/, '/appmaptile')
      ),
      '/proxy/gaode-satellite': withSafeCorsHeaders(
        'https://webst01.is.autonavi.com',
        (path) => path.replace(/^\/proxy\/gaode-satellite/, '/appmaptile')
      ),
      '/proxy/tianditu': withSafeCorsHeaders(
        'https://t0.tianditu.gov.cn',
        (path) => path.replace(/^\/proxy\/tianditu/, '')
      ),
      '/geoserver': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/python-api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/python-api/, '')
      }
    }
  }
})
