// ============================================
// server.js - MultiHosts Main Entry Point
// ============================================
/**
 * Main entry point for microservers:
 *
 * - ./servers.config.json: Entire server & microservers params.
 * - ./server/ServerManager: Main orchestration and lifecycle management
 * - ./serverMicroserverManager: Dynamic module loading and microserver management
 * - ./server/HealthManager: Health monitoring and diagnostic endpoints
 * - ./server/ErrorHandler: Global error handling and graceful shutdown
 * - ./ServerKeepAlive: Keep-alive ping system
 *
 *
 * @author alexandrglm
 * @version 0.1.1
 */

import { ServerManager } from './server/ServerManager.js';

// ============================================
// MAIN APPLICATION BOOTSTRAP
// ============================================
/**
 *
 * startApplication() 
 * 
 * 1. Creates a ServerManager instance with configuration
 * 2. Initialises all system components
 * 3. Starts the HTTP server
 * 4. Handles any startup errors
 *
 * The entire system is now managed through the ServerManager,
 * which gives responsibilities to specialised manager classes.
 */

async function startApplication() {

    console.log('[APPLICATION] Starting dynamic multi-microserver system...');


    try {

        // ============================================
        // SERVER MANAGER INITIALISATION
        // ============================================
        // Create the main server manager with keep-alive configuration

        const serverManager = new ServerManager({
        
            // Keep-alive configuration (from servers.config.json in future)
                keepAliveConfig: {
                intervalMinutes: 4,
                enableLogging: true,
                includeStats: true,
                logPrefix: '[SERVER PING]'

            },


            // Server configuration : .env VARS || hardcoded values
            port: process.env.PORT || 3001,
            host: process.env.HOST || '0.0.0.0'
        });




        /* ============================================
         *  SYSTEM INITIALISATION WORKFLOW
         * ============================================
         *
         * 1. Middleware setup
         * 2. Configuration loading
         * 3. Microserver module loading
         * 4. Health endpoint setup
         * 5. Error handler setup
         * 
         */
         await serverManager.initialise();
         



        // ============================================
        // SERVER STARTUP
        // ============================================
        // Start the HTTP server with a callback for startup information
        
        await serverManager.start((port, host, stats) => {
            
            console.log('[APPLICATION] ✅ System startup completed successfully');
            console.log(`[APPLICATION] Server accessible at: http://${host}:${port}`);
            console.log(`[APPLICATION] Active microservers: ${stats.microservers.active}/${stats.microservers.total}`);
            console.log(`[APPLICATION] Environment: ${stats.server.environment}`);
        
        });

        console.log('[APPLICATION] System is now ready to handle requests');


    } catch (error) {
        
        // ============================================
        // STARTUP ERROR HANDLING
        // ============================================
        
        console.error('[APPLICATION] ❌ CRITICAL: System startup failed');
        console.error('[APPLICATION] Error:', error.message);
        console.error('[APPLICATION] Stack:', error.stack);

        
        // Provide helpful guidance for common startup issues
        if (error.message.includes('configuration')) {
        
            console.error('[APPLICATION] 💡 Check that servers.config.json exists and is valid');
        
        }

        if (error.message.includes('EADDRINUSE')) {
        
            console.error('[APPLICATION] 💡 Port is already in use. Check if another server is running');
        
        }


        if (error.message.includes('MODULE_NOT_FOUND')) {
        
            console.error('[APPLICATION] 💡 Check that all microserver files exist in the correct paths');
        
        }

        
        // Exit with error code to indicate failure
        console.error('[APPLICATION] System cannot continue, exiting...');
        process.exit(1);
    }
}

// ============================================
// APPLICATION ENTRY POINT
// ============================================
/**
 * Start the application immediately when this file is executed
 *

 */
startApplication();

