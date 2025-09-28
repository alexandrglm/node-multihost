// ============================================
//  DYNAMIC MULTI-MICROSERVER MAIN SERVER WITH DYNAMIC IMPORTS
// ============================================
/*
 * This file is the main entry point for the multi-microserver system.
 * It reads configuration from servers.config.json and dynamically configures all microservers.
 *
 * KEY FEATURE: Module imports are completely dynamic based on the JSON.
 * There is no hardcoding of paths or function names - everything is read from the configuration.
 / / ============================================*/

import express from "express";
import http from "http";
import dotenv from "dotenv";


// HERE
import { setupDomainRouting } from './server/server-routing.js';

dotenv.config();

const app = express();
const server = http.createServer(app);


// ============================================
// BASIC MIDDLEWARES (GLOBALs)
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('dist'));

console.log('[SERVER] Basic middlewares configured');


// ============================================
// DYNAMIC DOMAIN ROUTING SETUP
// ============================================
// setupDomainRouting reads servers.config.json and configures routing automatically
//
// Returns the complete configuration so we can use it here
const config = setupDomainRouting(app);

if (!config || !config.servers) {

    console.error('[SERVER] CRITICAL: Failed to load server configuration');
    process.exit(1);

}

console.log(`[SERVER] Loaded configuration for ${config.servers.length} microservers`);

// ============================================
// DYNAMIC IMPORT SYSTEM - THE MAGIC HAPPENS HERE
// ============================================
// This system allows loading microserver modules dynamically without hardcoding
//
// Process explained step by step:
/**
 * STEP 1: Storage for dynamically loaded setup functions
 *
 * setupFunctions = {
 *
 *   'setupWebshell': function() { ... },    // Function loaded from server-webshell.js
 *   'setupServerDos': function() { ... },   // Function loaded from server-serverdos.js
 *
 *   // Future functions are automatically loaded here
 *
 * }
 */
const setupFunctions = {};

/**
 * STEP 2: Load each microserver dynamically from the JSON configuration
 *
 * For each server in config.servers:
 *
 * - Read serverConfig.server.setupFunction (e.g.: "setupWebshell")
 * - Read serverConfig.paths.server (e.g.: "1-develrun-src")
 * - Read serverConfig.server.file (e.g.: "server-webshell.js")
 * - Build path: "./server/1-develrun-src/server-webshell.js"
 * - Dynamically import the module
 * - Extract the setupWebshell function from the module
 * - Store it in setupFunctions['setupWebshell']
 */

console.log('[SERVER] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('[SERVER] STARTING DYNAMIC IMPORT PROCESS');
console.log('[SERVER] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');


// ASYNC FUNC -> Loads each server modules
async function loadMicroserverModules() {
    
    // JSON iters
    for (const serverConfig of config.servers) {
        
        // STEP 2A: Extract server information from JSON
        const setupFunctionName = serverConfig.server.setupFunction;  // eg: "setupWebshell"
        const serverPath = serverConfig.paths.server;                 // eg: "1-develrun-src"
        const serverFile = serverConfig.server.file;                  // eg: "server-webshell.js"
        


        // STEP 2B: Build complete path of file to import
        const serverFilePath = `./server/${serverPath}/${serverFile}`;
        
        console.log(`[DYNAMIC-IMPORT] Processing: ${serverConfig.name}`);
        console.log(`[DYNAMIC-IMPORT]   - Setup Function: ${setupFunctionName}`);
        console.log(`[DYNAMIC-IMPORT]   - Server Path: ${serverPath}`);
        console.log(`[DYNAMIC-IMPORT]   - Server File: ${serverFile}`);
        console.log(`[DYNAMIC-IMPORT]   - Full Path: ${serverFilePath}`);
        


        try {
            // STEP 2C: DYNAMIC IMPORT
            /**
             * import() is a function that allows importing modules at runtime
             *
             * Unlike static import (import x from 'y'), which is resolved at compile time,
             * dynamic import() is resolved at runtime and returns a Promise
             *
             *
             * Syntax: import(modulePath)
             * - modulePath: string with the module path
             * - Returns: Promise that resolves to the imported module
             *
             *
             * The imported module contains all exports from the file:
             *
             * module = {
             *   setupWebshell: function() { ... },  // export function setupWebshell
             *   default: undefined,                  // if there's no export default
             *   // other exports...
             * }
             *
             */
            const importedModule = await import(serverFilePath);
            
            console.log(`[DYNAMIC-IMPORT]   ✅ Module imported successfully`);
            console.log(`[DYNAMIC-IMPORT]   - Available exports:`, Object.keys(importedModule));
            


            // STEP 2D: Extract the specific function from the imported module
            /**
             * The module can export multiple functions, but we need
             * the specific function defined in setupFunctionName (e.g.: "setupWebshell")
             *
             * importedModule[setupFunctionName] accesses the object property
             * that corresponds to the name of the function we want
             */
            const setupFunction = importedModule[setupFunctionName];
            


            // PASO 2E: Func Validating
            if (typeof setupFunction !== 'function') {

                throw new Error(`Function '${setupFunctionName}' not found in module or is not a function. Available: ${Object.keys(importedModule)}`);
            }
            

            // STEP 2F: Store the function in our registry
            /**
             * setupFunctions is our "registry" of dynamically loaded functions
             * The key is the function name (setupFunctionName)
             * The value is the actual function we can execute
             *
             * Later we can do: setupFunctions['setupWebshell'](app, server, options)
             */
            setupFunctions[setupFunctionName] = setupFunction;
            
            console.log(`[DYNAMIC-IMPORT]   ✅ Function '${setupFunctionName}' registered successfully`);
            


        } catch (importError) {


            // PASO 2G: import() error Handlers
            console.error(`[DYNAMIC-IMPORT]   ❌ Failed to import ${serverFilePath}:`);
            console.error(`[DYNAMIC-IMPORT]      Error: ${importError.message}`);
            console.error(`[DYNAMIC-IMPORT]      This microserver will be skipped`);
            
            // Additiona logging -
            if (importError.code === 'ERR_MODULE_NOT_FOUND') {
                console.error(`[DYNAMIC-IMPORT]      File not found. Check that the path is correct.`);
            }
            
            // Continue -> don't "process.exit"
            continue;
        }
    }
    
    console.log('[SERVER] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[SERVER] DYNAMIC IMPORT COMPLETED`);
    console.log(`[SERVER] Successfully loaded: ${Object.keys(setupFunctions).join(', ')}`);
    console.log(`[SERVER] Total functions available: ${Object.keys(setupFunctions).length}`);
    console.log('[SERVER] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// ============================================
// DYNAMIC MICROSERVER CONFIGURATION
// ============================================
// Storage for microserver instances (for stats, cleanup, etc.)
const microserverInstances = {};

/**
 * Function to configure microservers dynamically
 * This function uses the dynamically loaded functions to configure each microserver
 */
async function setupMicroservers() {

    console.log('[SERVER] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[SERVER] STARTING MICROSERVER SETUP PROCESS');
    console.log('[SERVER] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Configure each microserver dynamically based on the JSON configuration
    for (const serverConfig of config.servers) {
        console.log(`[SERVER] ━━━ Setting up microserver: ${serverConfig.name} (ID: ${serverConfig.id}) ━━━`);
        console.log(`[SERVER] Description: ${serverConfig.description}`);
        console.log(`[SERVER] Domains: ${serverConfig.domains.join(', ')}`);

        // STEP 3A: Get setup function name from configuration
        const setupFunctionName = serverConfig.server.setupFunction;  // e.g.: "setupWebshell"

        // STEP 3B: Look for the function in our loaded functions registry
        /**
         * setupFunctions is the object we populated in loadMicroserverModules()
         * Contains the actual functions we can execute
         * setupFunctions['setupWebshell'] gives us the setupWebshell function
         */
        const setupFunction = setupFunctions[setupFunctionName];

        // STEP 3C: Validate that the function exists
        if (!setupFunction) {
            console.error(`[SERVER] ❌ Setup function '${setupFunctionName}' not found for ${serverConfig.name}`);
            console.error(`[SERVER] Available functions: ${Object.keys(setupFunctions).join(', ')}`);
            console.error(`[SERVER] This microserver will be skipped`);
            continue;
        }

        console.log(`[SERVER] Using setup function: ${setupFunctionName}`);
        console.log(`[SERVER] Server features:`, serverConfig.server.features);

        try {
            // STEP 3D: Prepare options for the setup function
            /**
             * Each setup function (setupWebshell, setupServerDos, etc.)
             * expects certain parameters:
             *
             * @param {Express} app - The Express instance
             * @param {HTTP.Server} server - The HTTP server
             * @param {Object} options - Configuration options
             *
             * options contains:
             * - shouldStart: false (the main server handles listening)
             * - serverConfig: complete microserver configuration from JSON
             * - serverId: numeric server ID
             * - serverName: string server name
             */
            const setupOptions = {
                shouldStart: false,           // The main server handles listening
                serverConfig: serverConfig,   // Complete configuration from JSON
                serverId: serverConfig.id,    // Numeric ID
                serverName: serverConfig.name // String name
            };

            console.log(`[SERVER] Setup options prepared:`, {
                shouldStart: setupOptions.shouldStart,
                serverId: setupOptions.serverId,
                serverName: setupOptions.serverName,
                configKeys: Object.keys(setupOptions.serverConfig)
            });

            // STEP 3E: EXECUTE THE SETUP FUNCTION DYNAMICALLY
            /**
             * Here's where the magic happens:
             * setupFunction is the actual function (setupWebshell, setupServerDos, etc.)
             * that we imported dynamically
             *
             * We execute it with the standard parameters:
             * setupFunction(app, server, setupOptions)
             *
             * This function:
             * 1. Configures microserver-specific middleware
             * 2. Configures specific routes
             * 3. Initialises services (Socket.IO, databases, etc.)
             * 4. Returns an instance with useful methods (getStats, cleanup, etc.)
             */
            const microserverInstance = setupFunction(app, server, setupOptions);

            // STEP 3F: Store instance for future reference
            /**
             * We store the returned instance so we can:
             * - Get statistics (getStats)
             * - Do cleanup on shutdown
             * - Access microserver-specific services
             */
            microserverInstances[serverConfig.name] = {
                instance: microserverInstance,      // The instance returned by setupFunction
                config: serverConfig,               // Original configuration from JSON
                setupFunction: setupFunctionName    // Name of the function used
            };

            console.log(`[SERVER] ✅ ${serverConfig.name} configured successfully`);

            // Log specific routes if any
            if (serverConfig.server.routes.length > 0) {
                console.log(`[SERVER] Routes configured: ${serverConfig.server.routes.join(', ')}`);
            } else {
                console.log(`[SERVER] No specific routes configured`);
            }

        } catch (setupError) {
            // STEP 3G: Error handling during setup
            console.error(`[SERVER] ❌ Failed to setup ${serverConfig.name}:`);
            console.error(`[SERVER] Error: ${setupError.message}`);
            console.error(`[SERVER] Stack trace:`, setupError.stack);
        }
    }

    console.log(`[SERVER] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[SERVER] MICROSERVER SETUP COMPLETED`);
    console.log(`[SERVER] Active microservers: ${Object.keys(microserverInstances).length}/${config.servers.length}`);
    console.log(`[SERVER] Successfully configured: ${Object.keys(microserverInstances).join(', ')}`);
    console.log(`[SERVER] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

// ============================================
// DYNAMIC HEALTH CHECK ENDPOINT
// ============================================
// This endpoint provides health information for all configured microservers
app.get('/api/health', (req, res) => {

    // Basic server information
    const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',

        // Current request information
        currentRequest: {
            targetModule: req.targetModule,
            domain: req.routingInfo?.domain,
            fullHost: req.routingInfo?.fullHost,
            serverId: req.routingInfo?.serverId
        },

        // Microserver configuration
        microservers: {
            total: config.servers.length,
            active: Object.keys(microserverInstances).length,
        dynamicImports: Object.keys(setupFunctions).length,
        configured: config.servers.map(server => ({
            id: server.id,
            name: server.name,
            description: server.description,
            domains: server.domains,
            features: server.server.features,
            hasInstance: !!microserverInstances[server.name],
            setupFunction: server.server.setupFunction
        }))
        },

        // Specific stats from each microserver (if available)
        stats: {}
    };

    // Collect stats from each microserver that provides them
    Object.keys(microserverInstances).forEach(serverName => {
        const serverInstance = microserverInstances[serverName];

        try {
            // If the microserver has a getStats function, use it
            if (serverInstance.instance && serverInstance.instance.getStats) {
                healthData.stats[serverName] = serverInstance.instance.getStats();
            } else {
                healthData.stats[serverName] = { status: 'running', hasStats: false };
            }
        } catch (error) {
            healthData.stats[serverName] = { status: 'error', error: error.message };
        }
    });

    console.log(`[HEALTH] Health check request from ${req.routingInfo?.domain} → ${req.targetModule}`);

    res.json(healthData);
});


// ============================================
// DYNAMIC CONFIGURATION INFO ENDPOINT
// ============================================
// Debugging endpoint that shows the current configuration
app.get('/api/config', (req, res) => {

    // Only in development or if specific token is provided
    if (process.env.NODE_ENV === 'production' && !req.query.debug_token) {

        return res.status(403).json({ error: 'Access denied' });
    }

    res.json({

        loadedAt: new Date().toISOString(),
             servers: config.servers,
             default: config.default,
                 dynamicImports: {
                     loadedFunctions: Object.keys(setupFunctions),
             activeInstances: Object.keys(microserverInstances)
                 },
                 availableDomains: config.servers.flatMap(s => s.domains)
    });
});




// ============================================
// MAIN EXECUTION FLOW - ASYNC INITIALISATION
// ============================================
/**
 * Main function that orchestrates the entire initialisation process
 * Must be async because we use dynamic imports that return Promises
 */
async function startServer() {

    try {
        console.log('[SERVER] Starting dynamic server initialisation...');

        // STEP 1: Load all microserver modules dynamically
        await loadMicroserverModules();

        // STEP 2: Configure all microservers using the loaded functions
        await setupMicroservers();

        // STEP 3: Start the HTTP server
        const PORT = process.env.PORT || 3001;
        const HOST = process.env.HOST || '0.0.0.0';

        server.listen(PORT, HOST, () => {
            console.log(`
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        MULTIHOST INITIALISATION
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    🚀 Server: ${HOST}:${PORT}
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
    📊 Microservers: ${Object.keys(microserverInstances).length}/${config.servers.length} active
    🔧 Dynamic Imports: ${Object.keys(setupFunctions).length} functions loaded
    
    📍 CONFIGURED DOMAINS:
    ${config.servers.map(server => 
        `   • ${server.domains.join(', ')} → ${server.name} (${server.description})`
    ).join('\n    ')}
    
    🔧 LOADED SETUP FUNCTIONS:
    ${Object.entries(setupFunctions).map(([name, func]) => 
        `   • ${name}: ${typeof func}`
    ).join('\n    ')}
    
    📡 ENDPOINTS:
       • /api/health - System health check
       • /api/config - Configuration info (dev only)
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `);
        });
        
    } catch (error) {
        console.error('[SERVER] CRITICAL ERROR during server initialization:');
        console.error('[SERVER] Error:', error.message);
        console.error('[SERVER] Stack:', error.stack);
        process.exit(1);
    }
}



// ============================================
// GRACEFUL SHUTDOWN & DYNAMIC CLEANUP
// ============================================
// A proper shutdown handling that cleans up all dynamically loaded microservers
const gracefulShutdown = (signal) => {

    console.log(`[SERVER] Received ${signal}, shutting down gracefully...`);

    // Cleanup each microserver

    Object.entries(microserverInstances).forEach(([name, serverInstance]) => {

        try {

            // If the microserver has a cleanup function, execute it
            if (serverInstance.instance && serverInstance.instance.cleanup) {
                console.log(`[SERVER] Cleaning up ${name}...`);
                serverInstance.instance.cleanup();
            }

        } catch (error) {
            console.error(`[SERVER] Error cleaning up ${name}:`, error.message);
        }
    });

    server.close(() => {
        console.log('[SERVER] All microservers shut down successfully');
        process.exit(0);
    });
};

// ============================================
// ERROR HANDLING
// ============================================
process.on('uncaughtException', (error) => {

    console.error('[SERVER ERROR] Uncaught exception:', error.message);
    console.error(error.stack);

});

process.on('unhandledRejection', (reason, promise) => {

    console.error('[SERVER ERROR] Unhandled rejection at:', promise, 'reason:', reason);
});

// Signals for graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));




// ============================================
// START THE SERVER
// ============================================

startServer();
