# Node-Multihost Integration Guide
## Overview
***
This guide explains how to integrate standalone Node.js/React microservers into the node-multihost system with minimal modifications. We'll use the WebShell project as a working example.

## Architecture Concept

Node-multihost allows you to:  

- Develop microservers independently as standalone applications  
- Deploy multiple microservers on a single server instance  
- Route traffic based on domain names  
- Maintain separate codebases that can be copied with minimal adaptation  

## Prerequisites

Your standalone microserver should contain:

- Express.js application structure  
- HTTP server instance  
- A main class or setup function that configures routes and middleware  

---

## Integration Steps
***
### Step 1: Understand Your Standalone Structure

**Example: WebShell Standalone ./server files**

```
1-develrun-server/
├── server.js                    # Standalone entry point
├── server-webshell.js           # Main WebShellServer class
├── webshell/                    # Manager classes (Auth, Security, Sessions, etc.)
└── [other files]
```

The original standalone `server.js` creates its own Express app and HTTP server:

```javascript
// server.js (standalone)
const app = express();
const server = http.createServer(app);

const webshell = new WebShellServer(app, server, { shouldStart: true });
await webshell.initialise();
await webshell.start();  // Calls server.listen()
```

***

### Step 2: Modify the Main Class

In your main class (e.g., `WebShellServer`), modify the `start()` method to respect the `shouldStart` option:

#### **Before:**
```javascript
async start() {
    
    return new Promise( (resolve, reject) => {
    
        const { port, host } = this.config.server;
        
        this.server.listen(port, host, (error) => {
            if (error) {
                reject(error);
                return;
            }
            
            // Setup complete
            this._setupErrorHandlers();
            resolve();
        });
    });
}
```

#### **After:**
```javascript
async start() {
    
    // Skip starting if managed by multi-host
    if (this.options.shouldStart === false) {
    
        console.log('[WEBSHELL] Skipping server.listen() - managed by multi-host');
        return Promise.resolve();
    }
    
    // Original code for standalone mode
    return new Promise((resolve, reject) => {
        
        const { port, host } = this.config.server;
        
        this.server.listen(port, host, (error) => {
            if (error) {
                reject(error);
                return;
            }
            
            this._setupErrorHandlers();
            resolve();
        });
    });
}
```

#### **Why:** 

>In multi-host mode, the main server already handles `server.listen()`. This modification prevents port conflicts and allows your microserver to skip server startup whilst still initialising all its components.  

***
### Step 3: Create the Integration Script

Create a new file `multihost-entry.js` in your microserver directory. This will serve **as a bridge between the standalone app code and this multi-host system**.

**Template (adapted to node-multhost server mode):**

```javascript
// multihost-entry.js - Integration script for multi-host
import { WebShellServer } from './server-webshell.js';

/**
 * Setup function for multi-host integration
 * 
 * @param {Express.Application} app - Express app from multi-host
 * @param {http.Server} server - HTTP server from multi-host
 * @param {Object} options - Configuration options from multi-host
 * @returns {Object} Multi-host compatible interface
 */
 
export async function setupWebshell(app, server, options = {}) {

    console.log('[MULTIHOST-ENTRY] Initialising WebShell for multi-host environment...');
    
    try {
 
    // Create instance with forced multi-host mode
        const webshell = new WebShellServer(app, server, {
            ...options,
    
        shouldStart: false  // Critical: prevent server.listen()
        });
        
        // Initialise all components (managers, middleware, Socket.IO, routes)
        await webshell.initialise();
        
        // DO NOT call webshell.start() - multi-host handles server.listen()
        
        // Return multi-host compatible interface
        return {
            /**
             * Cleanup function for graceful shutdown
             */
            cleanup: async () => {
        
                console.log('[MULTIHOST-ENTRY] Starting WebShell cleanup...');
                
                // Close Socket.IO if present
                if (webshell.io) {
                
                    await new Promise((resolve) => {
                    
                        webshell.io.close(() => {
                            console.log('[MULTIHOST-ENTRY] Socket.IO closed');
                            resolve();
                        });
                    });
                }
                
                // Add other cleanup tasks as needed
                console.log('[MULTIHOST-ENTRY] WebShell cleanup complete');
            },
            
            /**
             * API HEALTH Monitoring Statistics integration 
             */
            getStats: () => {
                
                try {
                
                    const stats = webshell.getStats();
                    
                    return {
                        ...stats,
                        mode: 'multi-host',
                        hasSocketIO: !!webshell.io
                    };
                
                } catch (error) {
                    return { error: error.message, mode: 'multi-host' };
                }
            },
            
            
            // Expose internal instances for advanced use cases
            io: webshell.io,
            security: webshell.security,
            auth: webshell.auth,
            sessions: webshell.sessions,
            executor: webshell.executor
        };
        
    } catch (error) {
        
        console.error('[MULTIHOST-ENTRY] Failed to setup WebShell:', error.message);
        throw error;
    }
}
```

#### **Resume for this step:**
- Export a function with a descriptive name (e.g., `setupWebshell`)
- Force `shouldStart: false` to prevent `server.listen()`
- Return an object with `cleanup` and `getStats` methods
- Handle any Socket.IO or database connections in cleanup

***

### Step 4: Copy Files to Node-Multihost

Copy your microserver directories to the node-multihost project:

```
node-multihost/
├── ./server/1-develrun-server/  # WebShell server files
│   ├── server.js                   # Standalone entry (not used by multi-host)
│   ├── server-webshell.js          # Modified with shouldStart check
│   ├── multihost-entry.js          # NEW - Integration script
│   └── webshell/                   # Manager classes
├── ./src/1-develrun-src/         # React frontend
├── ./public/1-develrun-public/   # Static assets
└── [repeat for other microservers]
```

***

### Step 5: Configure in `servers.config.json`

Add your microserver configuration to the `servers` array:

```json
{
  "id": 1,
  "name": "develrun",
  "description": "WebShell Terminal Application",
  "domains": ["devel.run", "localhost", "websocket-shell-react.onrender.com"],
  "paths": {
    "src": "1-develrun-src",
    "public": "1-develrun-public",
    "server": "1-develrun-server",
    "html": "index-webshell.html",
    "app": "App-Develrun.jsx",
    "main": "main.jsx"
  },
  "server": {
    "setupFunction": "setupWebshell",
    "file": "multihost-entry.js",
    "routes": ["/status", "/auth/validate"],
    "skipSPA": ["/assets/", "/api/", "/status", "/auth"],
    "features": {
      "socketio": true,
      "cors": true,
      "rateLimit": true,
      "authentication": true
    }
  },
  "database": null
}
```

**Configuration fields:**

- `setupFunction`: Name of the exported function in `multihost-entry.js`
- `file`: Always `"multihost-entry.js"` for integrated microservers
- `routes`: API routes that shouldn't serve the SPA
- `skipSPA`: Paths that should bypass the SPA catchall
- `features`: Document which features your microserver uses

---

## Testing Integration

### Standalone Mode (Development)
```bash
cd 1-develrun-server
node server.js
# Should start on its configured port (e.g., 3001)
```

### Multi-Host Mode (Production)
```bash
# From node-multihost root
npm run deploy
# or
node server.js

# Access via domain routing
http://localhost:3001  # Multi-host main port

# Or use module parameter for testing
http://localhost:7777/?module=develrun
```

### Expected Logs

You should see:

1. `[DYNAMIC-IMPORT] Processing: develrun`
2. `[DYNAMIC-IMPORT] ✅ Function 'setupWebshell' registered successfully`
3. `[MULTIHOST-ENTRY] Initialising WebShell for multi-host environment...`
4. `[WEBSHELL] Skipping server.listen() - managed by multi-host`
5. `[MICROSERVER SETUP] ✅ develrun configured successfully`

---

## Summary Checklist

For each new microserver integration:

- [ ] 1:    **Modify main class:** Add `shouldStart` check in `start()` method
- [ ] 2:    **Create integration script:** Copy and adapt `multihost-entry.js` template
- [ ] 3:    **Copy directories:** Move `./server`, `./src`, `./public` to node-multihost
- [ ] 4:    **Update JSON config:** Add microserver entry to `servers.config.json`
- [ ] 5:    **Test standalone:** Verify original `server.js` still works
- [ ] 6:    **Test multi-host:** Verify integration in node-multihost system

**Time required:** Approximately 5-10 minutes per microserver

---

## Troubleshooting

### Port Conflicts
> **PROBLEM:** `EADDRINUSE` errors

**SOLUTION:** Ensure `shouldStart: false` is being passed and the check is in place

### Module Not Found
> **PROBLEM:** `ERR_MODULE_NOT_FOUND` during import

**SOLUTION:** Verify file paths in `servers.config.json` match actual directory structure

### Socket.IO Not Working
> **PROBLEM:** WebSocket connections fail

**SOLUTION:** Ensure Socket.IO is initialised during `initialise()` not `start()`

### Routes Not Found
> **PROBLEM:** 404 errors on API routes

**SOLUTION:** Check `skipSPA` array in config includes your API paths

---

## Advanced: Custom Cleanup Logic

If your microserver has resources that need cleanup (database connections, timers, file handles), implement them in the `cleanup` function:

```javascript
cleanup: async () => {

    // Close Socket.IO
    if (instance.io) {

    await new Promise(resolve => instance.io.close(resolve));
    
    }
    
    
    // Close database connections
    if (instance.db) {
    
        await instance.db.close();
    
    }
    
    
    // Clear intervals/timeouts
    if (instance.keepAliveInterval) {
    
        clearInterval(instance.keepAliveInterval);
    }
    
    
    console.log('[MULTIHOST-ENTRY] All resources cleaned up');
}
```

---

## MAin Concept

1. **Minimal changes:** Only modify the `start()` method and create one new file
2. **Maintains standalone:** Original `server.js` continues to work for development
3. **Reusable pattern:** Same approach works for all microservers
4. **Clean separation:** Integration logic isolated in `multihost-entry.js`
5. **Easy maintenance:** Update standalone code without affecting multi-host integration
