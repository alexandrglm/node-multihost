# `servers.config.json` Field Documentation

---

## Global Configuration
### `global.dev`
Development server configuration for Vite dev server.

| Field | Type | Description |
|-------|------|-------------|
| `port` | number | Port for Vite dev server (typically 7777) |
| `host` | string | Host address for dev server (0.0.0.0 for external access) |
| `proxies` | array | API proxy configuration for development |

#### `global.dev.proxies[]`
| Field | Type | Description |
|-------|------|-------------|
| `path` | string | API path to proxy (e.g., "/api", "/socket.io") |
| `target` | string | Target server URL (e.g., "http://localhost:3001") |

### `global.build`
Production build configuration for Vite.

| Field | Type | Description |
|-------|------|-------------|
| `outDir` | string | Output directory for built files (typically "dist") |
| `sourcemap` | boolean | Generate source maps (false for security in production) |
| `chunkSizeWarningLimit` | number | Warning threshold for chunk size in KB |
| `chunkFileNames` | string | Pattern for chunk file names with hash |

#### `global.build.assetFileNames`
| Field | Type | Description |
|-------|------|-------------|
| `images` | string | Pattern for image file names with hash |
| `css` | string | Pattern for CSS file names with hash |
| `default` | string | Pattern for other asset file names with hash |

### `global.chunks`
Manual chunk configuration for build optimization.

| Field | Type | Description |
|-------|------|-------------|
| `vendor` | array | Common vendor libraries (e.g., ["react", "react-dom"]) |
| `socket` | array | Socket.IO related libraries |
| `database` | array | Database related libraries |

### `global.aliases`
Path aliases for imports in Vite configuration.

| Field | Type | Description |
|-------|------|-------------|
| `@server` | string | Alias for server directory |
| `@public` | string | Alias for public directory |

---

## Server Configuration
### Root Server Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique identifier for the microserver |
| `name` | string | Internal name for the microserver (used in routing) |
| `description` | string | Human-readable description of the microserver |
| `domains` | array | List of domains that route to this microserver |

### `paths`
Directory structure configuration for the microserver.

| Field | Type | Description |
|-------|------|-------------|
| `src` | string | Frontend source directory name |
| `public` | string | Public assets directory name |
| `server` | string | Backend server directory name |
| `html` | string | HTML entry point filename |
| `app` | string | Main React component filename |
| `main` | string | React entry point filename |

### `server`
Backend server configuration.

| Field | Type | Description |
|-------|------|-------------|
| `setupFunction` | string | Name of setup function to import from server file |
| `file` | string | Backend server file name |
| `routes` | array | Specific API routes handled by this microserver |
| `skipSPA` | array | Paths that should skip SPA catchall routing |

#### `server.features`
Feature flags for the microserver.

| Field | Type | Description |
|-------|------|-------------|
| `socketio` | boolean | Enable Socket.IO WebSocket support |
| `cors` | boolean | Enable Cross-Origin Resource Sharing |
| `rateLimit` | boolean | Enable API rate limiting |
| `authentication` | boolean | Enable authentication middleware |
| `mongodb` | boolean | Enable MongoDB database support |
| `redis` | boolean | Enable Redis caching support |
| `ssl` | boolean | Enable SSL/HTTPS features |

### `database`
Database configuration (can be null if no database).

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Database type ("mongodb", "mysql", "postgresql", etc.) |
| `connection` | string | Connection string or identifier |
| `models` | array | List of data models/collections used |

---
## Global Default
### `default`
Fallback configuration when domain doesn't match any server.

| Field | Type | Description |
|-------|------|-------------|
| `serverId` | number | ID of default server to use |
| `serverName` | string | Name of default server to use |

---

## Usage Notes

### Required Fields
- `global.dev.port` and `global.dev.host` are required for development
- `servers[].id`, `name`, `domains` are required for each microserver
- `servers[].paths.src`, `public`, `html` are required for routing
- `servers[].server.setupFunction` and `file` are required for backend

### Optional Fields
- `database` can be null if microserver doesn't use a database
- `server.routes` can be empty array if no specific routes
- Most `server.features` default to false if not specified

### Naming Conventions
- Directory names should follow pattern: `{id}-{name}-{type}` (e.g., "1-develrun-src")
- Setup function names should follow pattern: `setup{PascalCase}` (e.g., "setupWebshell")
- Server file names should be descriptive: `server-{name}.js`

### Security Considerations
- Set `global.build.sourcemap: false` in production
- Consider using .env variables/secret files for the entire configuration in production

### Scalability
- Add new microservers by appending to `servers` array
- Increment `id` for each new microserver
- Follow established directory and naming patterns
- System automatically adapts to new configuration without code changes

---

## Example

```json
{
  "global": {
    "dev": {
      "port": 7777,
      "host": "0.0.0.0",
      "proxies": [
        { "path": "/api", "target": "http://localhost:3001" },
        { "path": "/socket.io", "target": "http://localhost:3001" },
        { "path": "/status", "target": "http://localhost:3001" },
        { "path": "/auth", "target": "http://localhost:3001" },
        { "path": "/webhooks", "target": "http://localhost:3001" }
      ]
    },
    "build": {
      "outDir": "dist",
      "sourcemap": false,
      "chunkSizeWarningLimit": 1500,
      "assetFileNames": {
        "images": "images/[name]-[hash][extname]",
        "css": "css/[name]-[hash][extname]",
        "default": "assets/[name]-[hash][extname]"
      },
      "chunkFileNames": "js/[name]-[hash].js"
    },
    "chunks": {
      "vendor": ["react", "react-dom", "react-router-dom"],
      "socket": ["socket.io-client"],
      "database": ["mongoose", "mongodb", "redis"]
    },
    "aliases": {
      "@server": "./server",
      "@public": "./public",
      "@shared": "./shared",
      "@utils": "./utils"
    }
  },
  "servers": [
    {
      "id": 1,
      "name": "ecommerce",
      "description": "E-commerce Platform with Payment Processing",
      "domains": ["shop.example.com", "store.localhost", "ecommerce.render.com"],
      "paths": {
        "src": "1-ecommerce-src",
        "public": "1-ecommerce-public",
        "server": "1-ecommerce-src",
        "html": "index-shop.html",
        "app": "App-Ecommerce.jsx",
        "main": "main.jsx"
      },
      "server": {
        "setupFunction": "setupEcommerce",
        "file": "server-ecommerce.js",
        "routes": ["/api/products", "/api/cart", "/api/payments", "/api/orders"],
        "skipSPA": ["/assets/", "/api/", "/webhooks/", "/uploads/"],
        "features": {
          "socketio": true,
          "cors": true,
          "rateLimit": true,
          "authentication": true,
          "mongodb": true,
          "redis": true,
          "ssl": true
        }
      },
      "database": {
        "type": "mongodb",
        "connection": "ecommerce_db",
        "models": ["User", "Product", "Order", "Payment", "Cart", "Category"]
      }
    },
    {
      "id": 2,
      "name": "analytics",
      "description": "Real-time Analytics Dashboard",
      "domains": ["analytics.example.com", "dashboard.localhost"],
      "paths": {
        "src": "2-analytics-src",
        "public": "2-analytics-public",
        "server": "2-analytics-src",
        "html": "index-analytics.html",
        "app": "App-Analytics.jsx",
        "main": "main.jsx"
      },
      "server": {
        "setupFunction": "setupAnalytics",
        "file": "server-analytics.js",
        "routes": ["/api/metrics", "/api/reports", "/api/charts"],
        "skipSPA": ["/assets/", "/api/", "/export/"],
        "features": {
          "socketio": true,
          "cors": true,
          "rateLimit": false,
          "authentication": true,
          "mongodb": false,
          "redis": true,
          "ssl": true
        }
      },
      "database": {
        "type": "postgresql",
        "connection": "analytics_warehouse",
        "models": ["Event", "Session", "User", "Metric", "Report"]
      }
    },
    {
      "id": 3,
      "name": "blog",
      "description": "Content Management System and Blog",
      "domains": ["blog.example.com", "cms.localhost", "content.example.com"],
      "paths": {
        "src": "3-blog-src",
        "public": "3-blog-public",
        "server": "3-blog-src",
        "html": "index-blog.html",
        "app": "App-Blog.jsx",
        "main": "main.jsx"
      },
      "server": {
        "setupFunction": "setupBlog",
        "file": "server-blog.js",
        "routes": ["/api/posts", "/api/comments", "/api/media", "/api/admin"],
        "skipSPA": ["/assets/", "/api/", "/admin/", "/rss/", "/sitemap.xml"],
        "features": {
          "socketio": false,
          "cors": true,
          "rateLimit": true,
          "authentication": true,
          "mongodb": true,
          "redis": false,
          "ssl": false
        }
      },
      "database": {
        "type": "mongodb",
        "connection": "blog_content",
        "models": ["Post", "Comment", "Author", "Category", "Tag", "Media"]
      }
    }
  ],
  "default": {
    "serverId": 1,
    "serverName": "ecommerce"
  }
}
```
