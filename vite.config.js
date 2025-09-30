// ============================================
// vite.config.js - Clean Multi-Server Build from JSON
// ============================================
// Objective: Single clean structure, no duplication
// Target: dist/public/<server>/ with all assets in place
// ============================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// ============================================
// LOAD CONFIGURATION
// ============================================
let config;
try {
  const configPath = fs.existsSync('/etc/secrets/servers.config.json')
  ? '/etc/secrets/servers.config.json'
  : './servers.config.json';

  const configData = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configData);
  console.log(`[VITE] Loaded config: ${config.servers.length} servers`);
} catch (error) {
  console.error('[VITE] Failed to load servers.config.json:', error.message);
  process.exit(1);
}

// ============================================
// BUILD INPUTS - One HTML per server
// ============================================
const buildInputs = {};

config.servers.forEach(server => {
  const htmlPath = `./public/${server.paths.public}/${server.paths.html}`;

  if (fs.existsSync(htmlPath)) {
    buildInputs[server.name] = htmlPath;
  } else {
    console.warn(`[VITE] HTML not found: ${htmlPath}`);
  }
});

console.log('[VITE] Build inputs:', Object.keys(buildInputs));

// ============================================
// DEV PROXIES
// ============================================
const devProxies = {};

config.global.dev.proxies.forEach(proxy => {
  devProxies[proxy.path] = proxy.target;
});

// Add server-specific routes
config.servers.forEach(server => {
  server.server.routes.forEach(route => {
    if (!devProxies[route]) {
      devProxies[route] = config.global.dev.proxies[0].target;
    }
  });
});

// ============================================
// ALIASES
// ============================================
const aliases = { ...config.global.aliases };

config.servers.forEach(server => {
  aliases[`@${server.name}`] = path.resolve(process.cwd(), `./src/${server.paths.src}`);
});

// ============================================
// VITE CONFIG
// ============================================
export default defineConfig({
  plugins: [
    react(),

                            // Custom plugin to handle static assets dynamically from config
                            {
                              name: 'handle-static-assets',
                              configureServer(server) {
                                // Serve static files during development - dynamically from config
                                config.servers.forEach(serverConfig => {
                                  server.middlewares.use(`/${serverConfig.paths.public}`, (req, res, next) => {
                                    req.url = req.url.replace(`/${serverConfig.paths.public}`, `/public/${serverConfig.paths.public}`);
                                    next();
                                  });
                                });
                              },

                              resolveId(id) {
                                // Resolve static asset imports - check all servers from config
                                for (const serverConfig of config.servers) {
                                  if (id.startsWith(`/${serverConfig.paths.public}/`)) {
                                    const assetPath = path.resolve(process.cwd(), `public${id}`);
                                    if (fs.existsSync(assetPath)) {
                                      return assetPath;
                                    }
                                  }
                                }
                                return null;
                              },

                              load(id) {
                                // Handle static assets
                                if (id.includes('public/') && /\.(png|jpg|jpeg|gif|svg|ico)$/.test(id)) {
                                  return `export default "${id.replace(process.cwd() + '/public', '')}"`;
                                }
                                return null;
                              },

                              async generateBundle(options, bundle) {
                                // Copy static assets to dist - dynamically from config
                                for (const serverConfig of config.servers) {
                                  const sourceDir = path.join('public', serverConfig.paths.public);
                                  const targetDir = path.join('dist', 'public', serverConfig.paths.public);

                                  if (fs.existsSync(sourceDir)) {
                                    // Create target directory
                                    if (!fs.existsSync(targetDir)) {
                                      fs.mkdirSync(targetDir, { recursive: true });
                                    }

                                    // Copy all files except HTML (HTML is handled by Vite)
                                    const files = fs.readdirSync(sourceDir);
                                    files.forEach(file => {
                                      if (!file.endsWith('.html')) {
                                        const sourcePath = path.join(sourceDir, file);
                                        const targetPath = path.join(targetDir, file);

                                        const stat = fs.statSync(sourcePath);
                                        if (stat.isDirectory()) {
                                          fs.cpSync(sourcePath, targetPath, { recursive: true });
                                        } else {
                                          fs.copyFileSync(sourcePath, targetPath);
                                        }

                                        console.log(`[ASSETS] Copied: ${file} -> public/${serverConfig.paths.public}/`);
                                      }
                                    });
                                  }
                                }
                              }
                            }
  ],

  define: {
    global: 'globalThis',
    'process.env': {
      REACT_APP_SHELL_URI: JSON.stringify(process.env.REACT_APP_SHELL_URI),
                            VITE_SHELL_URI: JSON.stringify(process.env.VITE_SHELL_URI),
                            MICROSERVERS_CONFIG: JSON.stringify({
                              servers: config.servers.map(s => ({
                                name: s.name,
                                domains: s.domains,
                                features: s.server.features,
                                paths: s.paths
                              })),
                              default: config.default
                            })
    }
  },

  server: {
    port: config.global.dev.port,
    host: config.global.dev.host,
    proxy: devProxies
  },

  build: {
    outDir: 'dist',
    rollupOptions: {
      input: buildInputs,

      output: {
        // Put everything in assets/ except manual chunks
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: (chunkInfo) => {
          // Manual chunks go to js/
          if (config.global.chunks[chunkInfo.name]) {
            return 'js/[name]-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: config.global.chunks
      }
    }
  },

  resolve: {
    alias: aliases
  },

  // Disable publicDir to prevent automatic copying
  publicDir: false
});

console.log(`
┌─────────────────────────────────────────────┐
│             CLEAN VITE CONFIG               │
├─────────────────────────────────────────────┤
│ Servers: ${Object.keys(buildInputs).join(', ')}
│ No publicDir auto-copy                      │
│ Target: dist/public/<server>/               │
└─────────────────────────────────────────────┘
`);
