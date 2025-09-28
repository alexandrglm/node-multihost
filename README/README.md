# Dynamic Multi-Microserver Architecture

## Overview

This system provides a scalable architecture for running multiple microservers within a single Express application. Each microserver maintains complete independence whilst sharing common infrastructure.

## Architecture

### Core Components

- **Dynamic Configuration**: `servers.config.json` defines all microserver settings
- **Domain Routing**: Automatic routing based on incoming domain
- **Dynamic Imports**: Runtime loading of microserver modules
- **Build System**: Vite configuration adapts to microserver requirements

### Directory Structure

```
project/
├── servers.config.json          # Central configuration
├── server.js                    # Main server with dynamic imports
├── server/
│   ├── server-routing.js        # Domain-based routing logic
│   ├── 1-develrun-src/         # WebShell microserver
│   │   └── server-webshell.js
│   └── 2-justlearning-src/     # Portfolio microserver
│       └── server-serverdos.js
├── src/
│   ├── 1-develrun-src/         # WebShell frontend
│   │   ├── App-Develrun.jsx
│   │   ├── main.jsx
│   │   └── components/
│   └── 2-justlearning-src/     # Portfolio frontend
│       ├── App-Justlearning.jsx
│       ├── main.jsx
│       └── components/
└── public/
    ├── 1-develrun-public/      # WebShell assets
    │   └── index-webshell.html
    └── 2-justlearning-public/  # Portfolio assets
        └── index-serverdos.html
```

## Configuration System

### Central Configuration

The `servers.config.json` file controls all aspects:

```json
{
  "global": {
    "dev": {
      "port": 7777,
      "host": "0.0.0.0",
      "proxies": [...]
    },
    "build": {
      "outDir": "dist",
      "sourcemap": false
    }
  },
  "servers": [
    {
      "id": 1,
      "name": "develrun",
      "domains": ["devel.run", "localhost"],
      "paths": {
        "src": "1-develrun-src",
        "public": "1-develrun-public",
        "html": "index-webshell.html"
      },
      "server": {
        "setupFunction": "setupWebshell",
        "routes": ["/status", "/auth/validate"],
        "features": {
          "socketio": true,
          "cors": true
        }
      }
    }
  ]
}
```

### Security

- **Production**: Use Render Secret Files at `/etc/secrets/servers.config.json`
- **Development**: Local file with fallback logic
- **Sensitive data**: Store in environment variables or secret files

## Development vs Production

### Development Mode

**Vite Dev Server**: Runs on port 7777
- Proxies API calls to Express server (port 3001)
- Hot module replacement for frontend changes
- Module override via URL parameters: `?module=develrun`

**Express Server**: Runs on port 3001
- Serves API routes
- WebSocket connections
- Static file serving for assets

### Production Mode

**Single Server**: Express serves everything
- Built assets from `dist/` directory
- Domain-based routing to appropriate microserver
- Consolidated static serving

## Domain Routing System

### Request Flow

1. **Domain Detection**: Extract hostname from request
2. **Microserver Resolution**: Match domain to configured microserver
3. **Module Loading**: Route to appropriate frontend/backend components
4. **Response**: Serve microserver-specific content

### Implementation

```javascript
// Domain mapping from configuration
const domainMap = {};
config.servers.forEach(server => {
  server.domains.forEach(domain => {
    domainMap[domain] = server.name;
  });
});

// Middleware assigns target module
req.targetModule = domainMap[domain] || domainMap['default'];
```

### SPA Routing

The system handles Single Page Application routing:

- **Skip Paths**: API routes bypass SPA catchall
- **HTML Serving**: Each microserver serves its specific HTML file
- **Asset Resolution**: Microserver-specific asset paths

## Dynamic Import System

### Runtime Module Loading

Instead of static imports, the system loads microserver modules dynamically:

```javascript
// Build setup function registry
const setupFunctions = {};

// Load each microserver module
for (const serverConfig of config.servers) {
  const modulePath = `./server/${serverConfig.paths.server}/${serverConfig.server.file}`;
  const importedModule = await import(modulePath);
  setupFunctions[serverConfig.server.setupFunction] = importedModule[setupFunctionName];
}
```

### Benefits

- **Zero Hardcoding**: All paths from configuration
- **Scalable**: Add microservers without code changes
- **Isolated**: Each microserver maintains independence
- **Flexible**: Different microservers can use different technologies

## Build System

### Vite Configuration

The build system adapts automatically:

- **Input Files**: Generated from microserver HTML paths
- **Proxies**: Created from microserver API routes
- **Chunks**: Optimised based on detected features
- **Aliases**: Dynamic aliases for each microserver

### Feature Detection

```javascript
// Automatic chunk optimisation
const hasSocketIO = config.servers.some(server => server.server.features.socketio);
if (hasSocketIO) {
  manualChunks.socket = ['socket.io-client'];
}
```

## Adding New Microservers

### Process

1. **Update Configuration**: Add entry to `servers.config.json`
2. **Create Directories**: Follow naming convention
3. **Implement Components**: Backend and frontend modules
4. **Deploy**: System adapts automatically

### Example Addition

```json
{
  "id": 3,
  "name": "analytics",
  "domains": ["analytics.example.com"],
  "paths": {
    "src": "3-analytics-src",
    "public": "3-analytics-public",
    "html": "index-analytics.html"
  },
  "server": {
    "setupFunction": "setupAnalytics",
    "file": "server-analytics.js"
  }
}
```

## Health Monitoring

### Endpoints

- **`/api/health`**: Operational status and statistics
- **`/api/config`**: Configuration debugging (development only)

### Metrics

- Active microserver count
- Dynamic import status
- Individual microserver statistics
- System uptime and performance

## Best Practices

### Configuration Management

- Use environment variables for sensitive data
- Maintain configuration versioning
- Validate configuration on startup

### Development Workflow

- Test individual microservers in isolation
- Use domain overrides for local testing
- Monitor build output for optimization opportunities

### Production Deployment

- Use secret files for configuration
- Enable graceful shutdown handling
- Monitor health endpoints for system status
