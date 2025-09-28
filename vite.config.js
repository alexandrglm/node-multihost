// ============================================
// vite.config.js - 100% Dynamic Configuration from JSON
// ============================================
// NOTICE:  Everything is read from servers.config.json
// Completely data-driven configuration for infinite scalability
// ============================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// ============================================
// LOAD SERVER CONFIGURATION
// ============================================
let config;

try {


  // Try secret file first (production)
  if (fs.existsSync('/etc/secrets/servers.config.json')) {

    const configData = fs.readFileSync('/etc/secrets/servers.config.json', 'utf8');
    config = JSON.parse(configData);

    console.log('[VITE] Loaded configuration from secret file for', config.servers.length, 'microservers');

  } else {

    // Fallback to local file (development)
    const configData = fs.readFileSync('./servers.config.json', 'utf8');
    config = JSON.parse(configData);

    console.log('[VITE] Loaded configuration from local file for', config.servers.length, 'microservers');
  }

} catch (error) {

  console.error('[VITE] CRITICAL: Failed to load servers.config.json:', error.message);
  process.exit(1);

}



// ============================================
// GENERATE DYNAMIC BUILD INPUTS FIX 2 -> Via HTMLs
// ============================================
const buildInputs = {};

config.servers.forEach(server => {

  const htmlPath = `./public/${server.paths.public}/${server.paths.html}`;


  if (fs.existsSync(htmlPath)) {

    buildInputs[server.name] = htmlPath;

  }

});
console.log('[VITE] Build inputs configured:', Object.keys(buildInputs));


// ============================================
// GENERATE DYNAMIC DEV PROXIES
// ============================================
const devProxies = {};

// Global proxies from configuration
config.global.dev.proxies.forEach(proxy => {

  devProxies[proxy.path] = proxy.target;
  console.log(`[VITE] Added global proxy: ${proxy.path} â†' ${proxy.target}`);
});


// Specific proxies from each microserver
config.servers.forEach(server => {

  // Server-specific routes
  server.server.routes.forEach(route => {

    if (!devProxies[route]) { // Avoid duplicates

      devProxies[route] = config.global.dev.proxies[0].target; // Use first target as default
      console.log(`[VITE] Added server proxy: ${route} â†' ${config.global.dev.proxies[0].target}`);

    }
  });



  // Routes that should be proxied (skipSPA that are APIs)
  server.server.skipSPA.forEach(skipPath => {

    if ((skipPath.startsWith('/api/') || skipPath.startsWith('/auth') || skipPath.startsWith('/status'))
      && !devProxies[skipPath]) {
      devProxies[skipPath] = config.global.dev.proxies[0].target;

    console.log(`[VITE] Added API proxy: ${skipPath} â†' ${config.global.dev.proxies[0].target}`);
      }
  });
});


console.log('[VITE] Dev proxies configured:', Object.keys(devProxies));



// ============================================
// GENERATE DYNAMIC MANUAL CHUNKS
// ============================================
const manualChunks = { ...config.global.chunks };

// Add specific chunks based on detected features
const hasSocketIO = config.servers.some(server => server.server.features.socketio);

if (hasSocketIO && !manualChunks.socket) {

  manualChunks.socket = ['socket.io-client'];
  console.log('[VITE] Added socket.io chunk (detected Socket.IO usage)');

}



// Future automatic detections
const hasMongoDB = config.servers.some(server => server.database?.type === 'mongodb');

if (hasMongoDB && !manualChunks.database) {

  manualChunks.database = ['mongoose', 'mongodb'];
  console.log('[VITE] Added database chunk (detected MongoDB usage)');

}

console.log('[VITE] Manual chunks configured:', Object.keys(manualChunks));


// ============================================
// GENERATE DYNAMIC ALIASES
// ============================================
const aliases = { ...config.global.aliases };

// Specific aliases for each microserver
config.servers.forEach(server => {

  aliases[`@${server.name}`] = path.resolve(__dirname, `./src/${server.paths.src}`);
  console.log(`[VITE] Added alias: @${server.name} â†' ./src/${server.paths.src}`);

});


console.log('[VITE] Aliases configured:', Object.keys(aliases));



// ============================================
// VITE CONFIGURATION EXPORT
// ============================================
export default defineConfig({

  // ============================================
  // PLUGINS FIX 3
  // ============================================
  plugins: [
    react(),
  
    // PLUGIN 1, PREPROCESS, Custom plugin to transform HTML during build
    {
      name: 'multiserver-html-transform',
      transformIndexHtml: {
      
        order: 'pre',
      
        handler(html, context) {
      
      
          // NO HARDCODED
          const matchedServer = config.servers.find(server => 
      
            context.filename.includes(server.paths.public) ||
            context.filename.includes(server.paths.html.replace('.html', ''))
      
          );
          
          if (!matchedServer) {
      
            console.warn('[PLUGIN] No server matched for:', context.filename);
            return html;
          }
          
          return html.replace(
            /src="[^"]*\/src\/[^"]+\/main\.jsx"/,
            `src="/assets/${matchedServer.name}-[hash].js"`
          );
        }
      }
    },
    // PLUGIN 2 -> POSTPROCESS
    {
      name: 'post-build-fix',
      closeBundle() {
        const fs = require('fs');
        const path = require('path');
        const glob = require('glob');
        
        console.log('[POST-BUILD] Fixing HTML references...');
        
        // Buscar HTML files generados
        const htmlFiles = glob.sync('dist/**/*.html');
        
        htmlFiles.forEach(htmlFile => {
          let content = fs.readFileSync(htmlFile, 'utf8');
          
          // Detectar servidor por path del archivo
          const serverName = htmlFile.includes('webshell') ? 'develrun' : 'justlearning';
          
          // Buscar archivo JS correspondiente
          const jsFiles = glob.sync(`dist/assets/${serverName}-*.js`);
          
          if (jsFiles.length > 0) {
            const jsPath = jsFiles[0].replace('dist', '');
            content = content.replace(
              /src="[^"]*\/src\/[^"]+\/main\.jsx"/g,
              `src="${jsPath}"`
            );
            
            fs.writeFileSync(htmlFile, content);
            console.log(`[POST-BUILD] Fixed ${htmlFile} -> ${jsPath}`);
          }
        });
      }
    }
  ],

  // ============================================
  // GLOBAL DEFINITIONS
  // ============================================
  define: {
    global: 'globalThis',
    'process.env': {
      REACT_APP_SHELL_URI: JSON.stringify(process.env.REACT_APP_SHELL_URI),
      VITE_SHELL_URI: JSON.stringify(process.env.VITE_SHELL_URI),
      // Inject configuration for the frontend
      MICROSERVERS_CONFIG: JSON.stringify({
        servers: config.servers.map(server => ({
          name: server.name,
          domains: server.domains,
          features: server.server.features,
          paths: server.paths
        })),
        default: config.default
      })
    }
  },

  // ============================================
  // DEV SERVER CONFIGURATION
  // ============================================
  server: {
    port: config.global.dev.port,
    host: config.global.dev.host,
    proxy: devProxies
  },

  // ============================================
  // BUILD CONFIGURATION
  // ============================================
  build: {
    outDir: config.global.build.outDir,
    sourcemap: config.global.build.sourcemap,
    chunkSizeWarningLimit: config.global.build.chunkSizeWarningLimit,

    rollupOptions: {
      input: buildInputs,

      output: {
        manualChunks: manualChunks,
        chunkFileNames: config.global.build.chunkFileNames,
        
        // Configure entry file names to match what HTML expects
        entryFileNames: (chunkInfo) => {
          return `assets/${chunkInfo.name}-[hash].js`;
        },

        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return config.global.build.assetFileNames.images;
          }

          if (/css/i.test(ext)) {
            return config.global.build.assetFileNames.css;
          }

          return config.global.build.assetFileNames.default;
        }
      }
    }
  },

  // ============================================
  // RESOLVE CONFIGURATION
  // ============================================
  resolve: {
    alias: aliases
  }
})

// ============================================
// CONFIGURATION VALIDATION
// ============================================
if (Object.keys(buildInputs).length === 0) {
  console.error('[VITE] ERROR: No valid HTML inputs found!');
  console.error('[VITE] Make sure HTML files exist in the configured paths');
  process.exit(1);
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VITE CONFING BUILD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Build Inputs: ${Object.keys(buildInputs).join(', ')}
🔄 Dev Proxies: ${Object.keys(devProxies).length} routes configured
⚡ Manual Chunks: ${Object.keys(manualChunks).join(', ')}
🔗 Aliases: ${Object.keys(aliases).join(', ')}
🎯 Microservers: ${config.servers.length} configured
🌐 Dev Server: ${config.global.dev.host}:${config.global.dev.port}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

