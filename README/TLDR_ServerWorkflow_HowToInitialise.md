# Multi-Microserver System Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [System Components](#system-components)
5. [Getting Started](#getting-started)
6. [Microserver Development](#microserver-development)
7. [Deployment](#deployment)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

## Overview

Node-multihost serves a dynamic, configuration-driven framework for hosting multiple independent applications (microservers) within a single Node.js process. The system provides automatic domain routing, dynamic module loading, and comprehensive management capabilities.

- **Configuration-driven architecture**: All server behaviour controlled via `servers.config.json`
- **Dynamic module loading**: Microservers loaded at runtime based on configuration
- **Domain-based routing**: Automatic request routing based on domain names
- **Hot-swappable microservers**: Add or modify microservers without system redesign
- **Unified health monitoring**: Centralised health checks and statistics
- **Graceful shutdown handling**: Proper cleanup and resource management
- **Keep-alive system**: Automated system health monitoring

## Architecture

### System Design

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   HTTP Request  │────│  Domain Router   │────│ Target          │
│                 │    │                  │    │ Microserver     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  ServerManager   │
                       │                  │
                       ├──────────────────┤
                       │ MicroserverMgr   │
                       │ HealthManager    │
                       │ ErrorHandler     │
                       │ KeepAlive        │
                       └──────────────────┘
```

## Configuration

### Configuration File Structure

The system is controlled by a single `servers.config.json` file:

```json
{
  "global": {
    "dev": {
      "port": 7777,
      "host": "0.0.0.0",
      "proxies": [
        { "path": "/api", "target": "http://localhost:3001" }
      ]
    },
    "build": {
      "outDir": "dist",
      "sourcemap": false
    },
    "aliases": {
      "@server": "./server"
    }
  },
  "servers": [
    {
      "id": 1,
      "name": "example-server",
      "description": "Example Microserver",
      "domains": ["example.com", "localhost"],
      "paths": {
        "src": "example-src",
        "public": "example-public", 
        "server": "example-server",
        "html": "index-example.html"
      },
      "server": {
        "setupFunction": "setupExample",
        "file": "server-example.js",
        "routes": ["/api/example"],
        "skipSPA": ["/assets/", "/api/"],
        "features": {
          "socketio": true,
          "cors": true
        }
      }
    }
  ],
  "default": {
    "serverId": 1,
    "serverName": "example-server"
  }
}
```

### Configuration Sections

#### Global Configuration

The global section defines system-wide settings that apply to all microservers.

##### Development Settings (`global.dev`)
- **`port`** (number): Port for the Vite development server (typically 7777)
  - Used only during development for hot module replacement
  - Production uses the main server port instead
- **`host`** (string): Bind address for development server ("0.0.0.0" allows external access)
- **`proxies`** (array): API proxy configuration for development
  - **`path`** (string): Request path to proxy (e.g., "/api", "/socket.io")
  - **`target`** (string): Destination server URL (e.g., "http://localhost:3001")
  - Enables seamless development without CORS issues

##### Build Process (`global.build`)
- **`outDir`** (string): Output directory for built assets (default: "dist")
- **`sourcemap`** (boolean): Whether to generate source maps for debugging
- **`chunkSizeWarningLimit`** (number): File size threshold in KB for warnings
- **`assetFileNames`** (object): Asset naming patterns during build
  - **`images`**: Pattern for image files (e.g., "images/[name]-[hash][extname]")
  - **`css`**: Pattern for CSS files (e.g., "assets/[name]-[hash][extname]")
  - **`default`**: Fallback pattern for other assets
- **`chunkFileNames`** (string): Pattern for JavaScript chunk files

##### Module Chunks (`global.chunks`)
- **`vendor`** (array): Common dependencies to bundle separately (e.g., ["react", "react-dom"])
  - Improves caching by separating framework code from application code
- **`socket`** (array): WebSocket-related dependencies (e.g., ["socket.io-client"])
- Additional chunks can be defined for optimal loading performance

##### Path Aliases (`global.aliases`)
- **`@server`** (string): Alias for server directory (e.g., "./server")
- **`@public`** (string): Alias for public assets directory (e.g., "./public")
- Custom aliases can be added for convenience (e.g., "@components": "./src/shared")

#### Individual Server Configuration

Each entry in the `servers` array defines a complete microserver configuration.

##### Core Identity
- **`id`** (number): Unique numeric identifier for the microserver
  - Used for internal routing and reference
  - Must be unique across all microservers
- **`name`** (string): Internal server name used in logs and routing
  - Used as the key in domain mapping
  - Should be URL-safe (no spaces or special characters)
- **`description`** (string): Human-readable description for documentation and logs
  - Appears in health check responses and startup information

##### Domain Routing (`domains`)
- **`domains`** (array): List of domain names that route to this microserver
  - Can include multiple domains for the same microserver
  - Supports subdomains (e.g., "api.example.com", "www.example.com")
  - "localhost" should be included for local development
  - First domain in array is considered primary

##### File System Paths (`paths`)
- **`src`** (string): Source directory for frontend code (e.g., "example-src")
  - Contains React components, hooks, styles, and frontend logic
- **`public`** (string): Static assets directory (e.g., "example-public")
  - Contains HTML templates, images, fonts, and other static files
- **`server`** (string): Backend source directory (e.g., "example-server")
  - Contains server setup files, routes, middleware, and backend logic
- **`html`** (string): HTML template filename (e.g., "index-example.html")
  - Entry point HTML file for this microserver's frontend
- **`app`** (string): Main React component filename (e.g., "App-Example.jsx")
  - Root React component for the microserver
- **`main`** (string): Frontend entry point filename (e.g., "main.jsx")
  - JavaScript entry point that renders the React app

##### Backend Configuration (`server`)
- **`setupFunction`** (string): Name of the exported setup function (e.g., "setupExample")
  - Must match the actual function name in the server file
  - Called during microserver initialisation with (app, server, options)
- **`file`** (string): Main server file name (e.g., "server-example.js")
  - Contains the setup function and main server logic
  - Located in the directory specified by `paths.server`
- **`routes`** (array): API routes handled by this microserver (e.g., ["/api/example", "/status"])
  - Used for documentation and potential route conflict detection
  - Not used for actual routing (handled by setup function)
- **`skipSPA`** (array): URL patterns that bypass Single Page Application routing
  - **Common patterns**:
    - "/assets/": Static asset requests
    - "/api/": API endpoint requests  
    - "/socket.io/": WebSocket connections
  - Requests matching these patterns are passed to Express middleware instead

##### Feature Flags (`server.features`)
- **`socketio`** (boolean): Whether this microserver uses WebSocket connections
  - Enables Socket.IO integration in the setup function
- **`cors`** (boolean): Whether to enable Cross-Origin Resource Sharing
  - Useful for API microservers accessed from different domains
- **`rateLimit`** (boolean): Whether to enable request rate limiting
  - Protects against abuse and ensures fair resource usage
- **`authentication`** (boolean): Whether this microserver handles user authentication
  - May trigger additional security middleware setup
- **`mongodb`** (boolean): Whether this microserver requires MongoDB connection
  - Can trigger database connection setup in the framework
- **Custom features**: Additional boolean flags can be added for microserver-specific functionality

##### Database Configuration (`database`)
- **`database`** (object|null): Database connection configuration
  - **`type`** (string): Database type ("mongodb", "mysql", "postgresql")
  - **`connectionString`** (string): Database connection URL
  - **`options`** (object): Database-specific connection options
  - Set to `null` if no database required

#### Default Server (`default`)
- **`serverId`** (number): ID of the default microserver for unmatched domains
- **`serverName`** (string): Name of the default microserver
- Used when a request doesn't match any configured domain

---

## System Components

### ServerManager

The main orchestration class that coordinates all system operations.

**Responsibilities:**
- Express application setup and middleware configuration
- Configuration loading and validation
- Microserver lifecycle management
- Health monitoring coordination
- Graceful shutdown handling

**Key Methods:**
- `initialise()`: Complete system setup
- `start()`: Begin HTTP server listening
- `gracefulShutdown()`: Clean system termination

### MicroserverManager

Handles dynamic loading and management of individual microserver modules.

**Responsibilities:**
- Dynamic module imports based on configuration
- Setup function execution and instance management
- Microserver registry maintenance
- Statistics collection from microservers

**Dynamic Loading Process:**
1. Read microserver configuration
2. Build file path from configuration values
3. Use `import()` to load module at runtime
4. Extract and validate setup function
5. Register function for later execution

### HealthManager

Provides health monitoring and diagnostic endpoints.

**Endpoints:**
- `/api/health`: Comprehensive system health information
- `/api/config`: Configuration debugging (development only)

**Health Data Includes:**
- Server uptime and resource usage
- Microserver status and statistics
- System configuration information
- Memory and process metrics

### ErrorHandler

Centralised error handling and process management.

**Capabilities:**
- Global error event handling
- Graceful shutdown coordination
- Process signal management
- Detailed error logging

**Handled Events:**
- `uncaughtException`: Unhandled synchronous errors
- `unhandledRejection`: Unhandled Promise rejections
- `SIGTERM`: Graceful shutdown signal
- `SIGINT`: Interrupt signal (Ctrl+C)

### ServerKeepAlive

Automated system health monitoring and external ping system.

**Features:**
- Configurable ping intervals
- External URL health checks
- System statistics logging
- Memory usage monitoring

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- React 18+ (for frontend components)
- Vite 4+ (for build system)

### Installation

1. **Clone or setup the framework structure:**
   ```bash
   mkdir my-multiserver-app
   cd my-multiserver-app
   ```

2. **Create the basic structure:**
   ```
   project/
   ├── servers.config.json
   ├── server.js
   ├── server/
   │   ├── ServerManager.js
   │   ├── MicroserverManager.js
   │   ├── HealthManager.js
   │   ├── ErrorHandler.js
   │   └── server-module-keepalive.js
   └── package.json
   ```

3. **Install dependencies:**
   ```bash
   npm install express dotenv cors
   ```

### Quick Start

1. **Create `servers.config.json`** with your microserver definitions
2. **Start the system:**
   ```bash
   node server.js
   ```
3. **Access health endpoint:**
   ```bash
   curl http://localhost:3001/api/health
   ```

## Microserver Development

### Creating a Microserver

#### 1. Directory Structure

```
server/
└── your-microserver-server/
    ├── server-yourname.js          # Main server file
    ├── routes/                     # API routes
    ├── middleware/                 # Custom middleware
    └── models/                     # Data models
```

#### 2. Setup Function

Each microserver must export a setup function:

```javascript
// server-yourname.js
export function setupYourMicroserver(app, server, options) {
    console.log(`[YOUR-MICROSERVER] Setting up ${options.serverName}...`);
    
    // Configure middleware
    app.use('/api/your-routes', yourMiddleware);
    
    // Setup routes
    app.get('/api/your-endpoint', (req, res) => {
        res.json({ message: 'Hello from your microserver!' });
    });
    
    // Optional: Setup WebSocket or other services
    // const io = new Server(server);
    
    // Return instance for lifecycle management
    return {
        getStats: () => ({
            status: 'running',
            endpoints: ['/api/your-endpoint']
        }),
        cleanup: async () => {
            console.log('[YOUR-MICROSERVER] Cleanup completed');
        }
    };
}
```

#### 3. Configuration Entry

Add your microserver to `servers.config.json`:

```json
{
  "id": 3,
  "name": "your-microserver",
  "description": "Your Custom Microserver",
  "domains": ["yourdomain.com", "localhost"],
  "paths": {
    "server": "your-microserver-server"
  },
  "server": {
    "setupFunction": "setupYourMicroserver",
    "file": "server-yourname.js",
    "routes": ["/api/your-endpoint"],
    "features": {
      "socketio": false,
      "cors": true
    }
  }
}
```

### Microserver Lifecycle

1. **Loading**: Module dynamically imported during system startup
2. **Setup**: Setup function called with Express app and HTTP server
3. **Operation**: Microserver handles requests via configured routes
4. **Monitoring**: Health statistics collected via `getStats()` method
5. **Cleanup**: `cleanup()` method called during graceful shutdown

### Best Practices

#### Error Handling
```javascript
export function setupYourMicroserver(app, server, options) {
    try {
        // Setup logic here
        
        return {
            getStats: () => ({ status: 'running' }),
            cleanup: async () => {
                // Cleanup resources
            }
        };
    } catch (error) {
        console.error('[YOUR-MICROSERVER] Setup failed:', error.message);
        throw error;
    }
}
```

#### Resource Management
- Always implement the `cleanup()` method
- Close database connections in cleanup
- Clear intervals and timeouts
- Remove event listeners

#### Configuration Access
```javascript
export function setupYourMicroserver(app, server, options) {
    const { serverConfig, serverId, serverName } = options;
    
    // Access configuration
    const features = serverConfig.server.features;
    const domains = serverConfig.domains;
    
    // Use configuration to control behaviour
    if (features.cors) {
        app.use(cors());
    }
}
```

## Deployment

### Development Environment

```bash
# Start development server
npm run dev      # Frontend (port 7777)
node server.js   # Backend (port 3001)
```

### Production Deployment

1. **Build frontend assets:**
   ```bash
   npm run build
   ```

2. **Set environment variables:**
   ```bash
   export NODE_ENV=production
   export PORT=3001
   export HOST=0.0.0.0
   ```

3. **Start production server:**
   ```bash
   node server.js
   ```

### Container Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "server.js"]
```

### Environment Variables

- `NODE_ENV`: Environment mode (development/production)
- `PORT`: HTTP server port
- `HOST`: Server bind address
- `JWT_SECRET`: JWT signing secret (if using authentication)

## Monitoring

### Health Endpoints

#### System Health
```bash
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "microservers": {
    "total": 2,
    "active": 2
  },
  "stats": {
    "microserver-name": {
      "status": "running"
    }
  }
}
```

#### Configuration Info
```bash
GET /api/config
```

### Logging

The system provides structured logging with prefixed messages:

- `[SERVER MANAGER]`: Main server operations
- `[MICROSERVER MANAGER]`: Module loading and setup
- `[HEALTH MANAGER]`: Health check operations
- `[ERROR HANDLER]`: Error handling and cleanup
- `[MICROSERVER-NAME]`: Individual microserver logs

### Metrics Collection

Microservers can provide custom metrics via the `getStats()` method:

```javascript
getStats: () => ({
    status: 'running',
    requestCount: requestCounter,
    lastRequest: lastRequestTime,
    activeConnections: connectionCount,
    customMetrics: {
        processedItems: itemCount,
        averageResponseTime: avgResponseTime
    }
})
```

## Troubleshooting

### Common Issues

#### Module Not Found
```
Error: Cannot find module './server/microserver-path/server-file.js'
```

**Solutions:**
- Verify file path in `servers.config.json`
- Check that microserver file exists
- Ensure correct relative path from project root

#### Setup Function Not Found
```
Function 'setupMicroserver' not found in module
```

**Solutions:**
- Verify export syntax: `export function setupMicroserver(...)`
- Check function name matches configuration
- Ensure function is properly exported

#### Port Already In Use
```
Error: EADDRINUSE: address already in use :::3001
```

**Solutions:**
- Check for other running processes: `lsof -i :3001`
- Change port in environment variables
- Kill conflicting processes

#### Configuration Loading Failed
```
Failed to load servers.config.json
```

**Solutions:**
- Verify JSON syntax with a validator
- Check file exists in project root
- Ensure proper file permissions

### Debug Mode

Enable detailed logging:

```bash
DEBUG=* node server.js
```

Access configuration endpoint:

```bash
curl http://localhost:3001/api/config?debug_token=dev
```

### Performance Issues

1. **Check memory usage**: Monitor `/api/health` endpoint
2. **Review microserver stats**: Examine individual microserver metrics
3. **Analyse logs**: Look for error patterns or slow operations
4. **Resource monitoring**: Use `htop` or similar tools

## API Reference

### ServerManager Methods

#### `constructor(options)`
Creates new ServerManager instance.

**Parameters:**
- `options.port` (number): Server port
- `options.host` (string): Server host
- `options.keepAliveConfig` (object): Keep-alive configuration

#### `async initialise()`
Complete system initialisation.

**Returns:** Promise\<ServerManager>

**Throws:** Error if initialisation fails

#### `async start(callback)`
Start HTTP server.

**Parameters:**
- `callback` (function): Optional startup callback

**Returns:** Promise\<void>

#### `async gracefulShutdown(signal)`
Graceful system shutdown.

**Parameters:**
- `signal` (string): Shutdown signal name

**Returns:** Promise\<void>

### MicroserverManager Methods

#### `async loadAllModules(config)`
Load all microserver modules.

**Parameters:**
- `config` (object): Server configuration

**Returns:** Promise\<void>

#### `async setupAllMicroservers(config)`
Setup all loaded microservers.

**Parameters:**
- `config` (object): Server configuration

**Returns:** Promise\<void>

#### `getStats()`
Get manager statistics.

**Returns:** Object with statistics

### Health Endpoints

#### GET /api/health
System health information.

**Response:**
- `status`: Overall system status
- `timestamp`: Current timestamp
- `uptime`: Process uptime in seconds
- `microservers`: Microserver information
- `stats`: Individual microserver statistics

#### GET /api/config
Configuration debugging information (development only).

**Response:**
- `servers`: Complete server configuration
- `dynamicImports`: Import status information
- `routing`: Domain routing configuration

### Microserver Interface

#### Setup Function Signature
```javascript
function setupMicroserver(app, server, options)
```

**Parameters:**
- `app`: Express application instance
- `server`: HTTP server instance
- `options.shouldStart`: Whether function should start server (always false)
- `options.serverConfig`: Complete microserver configuration
- `options.serverId`: Numeric server ID
- `options.serverName`: String server name

**Returns:** Object with optional methods:
- `getStats()`: Return statistics object
- `cleanup()`: Cleanup function for graceful shutdown

---

*This documentation covers the complete Multi-Microserver System. For specific implementation details, refer to the source code and configuration examples.*
