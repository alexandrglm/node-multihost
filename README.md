# # node-multihost

## Multi-Server Routing Framework

---

Milk every drop of the very limited free-tier accounts on services like Render.com

![head](./README/head-min.png)

A Dev/Prod. framework that enables hosting multiple independent web applications (microservers) within a single.

Each microserver maintains its own frontend, backend logic, and assets whilst sharing common infrastructure.

Domain-based routing automatically directs requests to the appropriate microserver.

What you develop is exactly what you get. You can optimize server costs by **pushing to the limits the very limited free-tier options on platforms like Render.com**, ...or simply, maintain an organised structure of multiple services where necessary.

---

## Implementation

This repository includes a working example with two microservers which I use for my websites.

### 1. WebShell Terminal (devel.run)

- **Domains:** `devel.run`, `localhost` (*Further explanation about localhost will be explained)
- **Purpose:** Browser-based terminal interface
- **Features:** Socket.IO, API auth

### 2. Portfolio Platform (justlearn.ing)

- **Domains:** `justlearn.ing`
- **Purpose:** Notes from courses I've been engaged
- **Features:** Portfolio, Blog, etc.

---

## Directory Structure

The framework uses isolated directories for each microserver:

```
project/
├── 🔌servers.config.json      # Contains all servers info needed
├── 🔌server.js                # Main server entry point
├── 🔌 vite.config.js          # Dynamic Vite config
│
├── server/                      # BACKEND
│   ├── 🔌server-routing.js        # Domain-based routing logic
│   │
│   ├── 1-develrun-src/          # Server 1 backend
│   │
│   └── 2-justlearning-src/      # Server 2 backend
│   
│
├── src/                        # FRONTEND
│   ├── 1-develrun-src/           # WebShell frontend
│   │   ├── App-Develrun.jsx
│   │   ├── main.jsx
│   │   └── Its own components/hooks/styles/slices .....
│   │ 
│   └── 2-justlearning-src/       # Portfolio frontend
│       ├── App-Justlearning.jsx
│       ├── main.jsx
│       └── Its own components/hooks/styles/slices ..... 
│  
│  
└── public/                     # PUBLIC ASSETS (html, img's, etc.)
    ├── 1-develrun-public/        # SERVER 1 PUBLIC
    │   ├── index-webshell.html
    │   ├── logo-light.png
    │   └── logo-dark.png
    │   
    └── 2-justlearning-public/    # SERVER 2 PUBLIC
        └── index-serverdos.html
```

## Adding New Microservers

New microservers are loaded dynamically based on configuration.

1. **Update Configuration:** Add entry to `servers.config.json`

2. **Create Directories:** Follow the established naming pattern

3. **Implement Backend:** Create setup function in server directory

4. **Implement Frontend:** Create React components in src & public directory

5. **Build & Deploy:** System automatically adapts to new configuration

---

## servers.config.json Configuration

All servers — including routes, ports, and configs — are orchestrated from `./server.js` based on `./servers.config.json`.

These data are imported and filtered/mapped by Vite, React, and the different components, as needed.

### Development vs Production Configuration

**Development Mode:**

- Place `servers.config.json` in your project root
- The framework automatically reads from this local file
- Easy to modify and test configuration changes

**Production Mode (Critical):**

- **NEVER commit sensitive configuration to your repository**
- Use your hosting platform's Secret Files feature
- Upload `servers.config.json` as a secret file to `/etc/secrets/servers.config.json`
- The framework automatically detects and prioritises the secret file over local configuration

**Why Secret Files?**

- Protects sensitive domain configurations, API routes, and server settings
- Prevents accidental exposure of production configuration in version control
- Allows different configurations per deployment environment
- Maintains security whilst enabling dynamic configuration

The chosen structure is scalable and can extend to SQL or any other database without breaking the core data model.

### Configuration Template

Create `servers.config.json` in your project root for development:

```json
{
  "global": {
    "dev": {
      "port": "",
      "host": "",
      "proxies": [
        { "path": "", "target": "" }
      ]
    },
    "build": {
      "outDir": "",
      "sourcemap": false,
      "chunkSizeWarningLimit": 0,
      "assetFileNames": {
        "images": "",
        "css": "",
        "default": ""
      },
      "chunkFileNames": ""
    },
    "chunks": {
      "vendor": [],
      "socket": [],
      "database": []
    },
    "aliases": {
      "@server": "",
      "@public": ""
    }
  },
  "servers": [
    {
      "id": 0,
      "name": "",
      "description": "",
      "domains": [],
      "paths": {
        "src": "",
        "public": "",
        "server": "",
        "html": "",
        "app": "",
        "main": ""
      },
      "server": {
        "setupFunction": "",
        "file": "",
        "routes": [],
        "skipSPA": [],
        "features": {
          "socketio": false,
          "cors": false,
          "rateLimit": false,
          "authentication": false,
          "mongodb": false,
          "redis": false,
          "ssl": false
        }
      },
      "database": {
        "type": "",
        "connection": "",
        "models": []
      }
    }
  ],
  "default": {
    "serverId": 0,
    "serverName": ""
  }
}
```

### The JSON TL;DR is located here (./README)

---

## Usage in Development / Production

Same usage for both modes.

**What you build using Node, React, Vite, etc... is then built and deployed the same way in both dev and prod.**

Check packages.json, dependencies, and, scripts.

### Requirements

- Node.js 16+
- npm or yarn
- React 18+
- Vite 4+

### Development Workflow

The development environment runs two servers:

#### 1. Vite Dev Server (port 7777): Frontend development with hot reload

```bash
npm run start
```

#### 2. Express Server (port 3001): Backend APIs and WebSocket connections

```bash
node server
```

**Development Testing & Module Override:**

The framework includes a powerful development feature for testing different microservers without changing your domain configuration:

**Module Override Syntax:**

```bash
# Test your first microserver
http://localhost:7777?module=develrun

# Test your second microserver  
http://localhost:7777?module=justlearning

# Test any configured microserver
http://localhost:7777?module=yourServerName
```

**How It Works:**

- The `?module=` parameter bypasses domain-based routing
- Loads the specified microserver regardless of your current domain
- Allows rapid testing of different microservers during development
- Perfect for testing microserver isolation and functionality

**Additional Development Testing:**

- Test domain routing locally by modifying your hosts file
- Hot reload works independently for each microserver
- Each microserver maintains its own development state

### Production Deployment

```bash
# Build for production
npm run build

# Deploy to production server
npm run deploy
```

---

## Environment Configuration

### Local Development

**Required Files:**

- Place `servers.config.json` in project root
- Create `.env` file with development environment variables

**Essential Development Variables:**

```bash
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# WebShell specific (if using WebShell microserver)
JWT_SECRET=your-development-jwt-secret
SHELL_HASHWORD=your-development-shell-password

# Database connections (if using databases)
MONGODB_URI=your-development-mongo-connection
```

### Production Environment Variables

**Platform-Specific Setup (Render, Heroku, etc.):**

**Core Variables:**

```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
```

**Microserver-Specific Variables:**

```bash
# Authentication & Security
JWT_SECRET=your-production-jwt-secret-min-32-chars
SHELL_HASHWORD=your-production-shell-password

# Database Connections
MONGODB_URI=your-production-mongo-connection-string

# External Services
VITE_SHELL_URI=your-production-websocket-url

# Optional: Debug access token for /api/config endpoint
CONFIG_DEBUG_TOKEN=your-secret-debug-token
```

**Critical Security Notes:**

- Use strong, unique passwords and secrets in production
- Never commit these values to version control
- Use your platform's environment variable management
- Rotate secrets regularly

**Secret Files Configuration:**

- Upload `servers.config.json` to `/etc/secrets/servers.config.json`
- Framework automatically detects and uses secret file in production
- Maintains fallback to local file for development

### Development vs Production Logging

**Development:**

```bash
[ROUTING] Configuration loaded from local file
[VITE] Loaded configuration from local file for 2 microservers
```

**Production:**

```bash
[ROUTING] Configuration loaded from secret file
[VITE] Loaded configuration from secret file for 2 microservers
```

![Render Build-Deploy config](./README/Screenshot_20250928_021301.png)

---

## Testing Your Setup

### Local Testing

1. Start both development servers
2. Test each microserver: `http://localhost:7777?module=yourServerName`
3. Verify domain routing with modified hosts file
4. Check API endpoints: `http://localhost:3001/api/health`

### Production Testing

1. Deploy to your hosting platform
2. Verify secret files are loaded correctly
3. Test domain routing with actual domains
4. Monitor logs for configuration source confirmation

---

## Troubleshooting

**Common Issues:**

- **Configuration not found:** Ensure secret file path is correct in production
- **Module not loading:** Check dynamic import paths match configuration
- **Domain routing fails:** Verify domain configuration in servers.config.json
- **Build errors:** Ensure all HTML files exist in configured paths

**Debug Endpoints:**

- `/api/health` - System status and configuration summary
- `/api/config` - Detailed configuration (development only)

---
