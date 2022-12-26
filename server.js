import {build, createServer, defineConfig, preview} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';
import {Server} from 'socket.io';
import pty from 'node-pty';
import os from 'os';

const config = defineConfig({
  plugins: [
    VitePWA({
      filename: 'service-worker.js',
      manifestFilename: 'manifest.webmanifest',
      injectRegister: 'inline',
      registerType: 'autoUpdate',
      minify: true,
      devOptions: {
        enabled: false
      },
      workbox: {
        inlineWorkboxRuntime: true,
        globPatterns: [
          '**/*.{html,css,js,png,svg}'
        ]
      },
      manifest: {
        name: 'Terminal',
        short_name: 'Terminal',
        lang: 'en',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: '/icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-alt.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    }),
    {
      enforce: 'post',
      transformIndexHtml: (html) =>
        html.replace('type="module"', 'type="module" defer')
          .replace('id="vite-plugin-pwa:inline-sw"', 'id="vite-plugin-pwa:inline-sw" defer')
    }
  ],
  root: 'src/',
  base: '/',
  publicDir: false,
  envDir: '../',
  css: {
    devSourcemap: true
  },
  build: {
    target: 'esnext',
    modulePreload: {
      polyfill: false
    },
    outDir: '../public',
    assetsDir: './',
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    emptyOutDir: true,
    minify: true,
    rollupOptions: {
      output: {
        assetFileNames: ({name}) => `${name.replace(/^(index|style).css$/, 'styles.css')}`,
        entryFileNames: 'script.js'
      }
    }
  }
});

const io = (server) => {
  server = new Server(server);
  server.on('connection', (socket) => {
    const shell = process.env[os.platform() == 'win32' ? 'COMSPEC' : 'SHELL'];
    const terminal = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cwd: process.env.HOME,
      env: process.env
    });
    socket.on('input', (data) => terminal.write(data));
    terminal.on('data', (data) => socket.emit('output', data));
    socket.on('resize', (cols, rows) => terminal.resize(cols, rows));
    terminal.on('exit', () => socket.emit('exit'));
  });
};

(async () => {
  if (process.argv.includes('--serve')) {
    const server = await createServer(config);
    io(server.httpServer);
    await server.listen();
    server.printUrls();
  }
  else if (process.argv.includes('--build')) {
    await build(config);
  }
  else if (process.argv.includes('--preview')) {
    const server = await preview(config);
    io(server.httpServer);
    server.printUrls();
  }
})();
