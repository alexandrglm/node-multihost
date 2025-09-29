// ============================================
// ErrorHandler.js - Centralised Error Handling and Process Management
// ============================================
/**
 * Manages error handling and shutdown procedures for the server system.
 *
 * This class handles:
 * 
 * - Global error event listeners (uncaught exceptions, unhandled rejections)
 * - Shutdown signal handling (SIGTERM, SIGINT)
 * - Error logging and reporting
 * - Process cleanup coordination
 *
 *
 * Design Pattern: Observer + Command Pattern
 * 
 * - Observes process events and errors
 * - Commands coordinated shutdown procedures
 *
 * @author Your Team
 * @version 1.0.0
 */

export class ErrorHandler {

    /**
     * Initialises the ErrorHandler
     *
     * @param {ServerManager} serverManager - Reference to the main server manager
     */
    constructor(serverManager) {
    
        this.serverManager = serverManager;
        this.isShuttingDown = false;
        this.setupTime = Date.now();

        console.log('[ERROR HANDLER] Initialised error handling system');
    }


    /**
     * Sets up global error handlers and process signal listeners
     *
     * Configures handlers for:
     *
     * - uncaughtException: Catches unhandled synchronous errors
     * - unhandledRejection: Catches unhandled Promise rejections
     * - SIGTERM: Graceful shutdown signal (used by process managers)
     * - SIGINT: Interrupt signal (Ctrl+C in terminal)
     *
     * These handlers prevent the application from crashing unexpectedly
     * and ensure proper cleanup when shutdown is requested.
     */
    setupHandlers() {
      
        console.log('[ERROR HANDLER] Setting up global error handlers...');

      
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => this.handleUncaughtException(error));

      
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => this.handleUnhandledRejection(reason, promise));

      
      
        // Handle graceful shutdown signals
        process.on('SIGTERM', () => this.handleShutdownSignal('SIGTERM'));
        process.on('SIGINT', () => this.handleShutdownSignal('SIGINT'));

      
        // Handle additional signals for comprehensive coverage
        process.on('SIGUSR2', () => this.handleShutdownSignal('SIGUSR2')); // nodemon restart


        console.log('[ERROR HANDLER] ✅ Global error handlers configured');
    }



    /**
     * Handles uncaught exceptions
     *
     * Uncaught exceptions are serious errors that can crash the application.
     * This handler:
     * 1. Logs detailed error information
     * 2. Attempts graceful shutdown if possible
     * 3. Exits the process to prevent undefined behaviour
     *
     * @param {Error} error - The uncaught exception
     */
    handleUncaughtException(error) {
    
        console.error('[ERROR HANDLER] ❌ CRITICAL: Uncaught Exception');
        console.error('[ERROR HANDLER] Error:', error.message);
        console.error('[ERROR HANDLER] Stack:', error.stack);
        console.error('[ERROR HANDLER] Name:', error.name);
        console.error('[ERROR HANDLER] Code:', error.code);

     
        // Log additional context if available
        if (error.errno) console.error('[ERROR HANDLER] Errno:', error.errno);
        if (error.syscall) console.error('[ERROR HANDLER] Syscall:', error.syscall);
        if (error.path) console.error('[ERROR HANDLER] Path:', error.path);

        // Attempt graceful shutdown, but with timeout
        this.emergencyShutdown('UNCAUGHT_EXCEPTION', error);
    }

    
    /**
     * Handles unhandled promise rejections
     *
     * Unhandled rejections occur when a Promise is rejected but no
     * .catch() handler is attached. This can lead to memory leaks
     * and unpredictable behaviour.
     *
     * @param {any} reason - The rejection reason
     * @param {Promise} promise - The promise that was rejected
     */
    handleUnhandledRejection(reason, promise) {
    
        console.error('[ERROR HANDLER] ❌ CRITICAL: Unhandled Promise Rejection');
        console.error('[ERROR HANDLER] Promise:', promise);
        console.error('[ERROR HANDLER] Reason:', reason);

        // Log stack trace if reason is an Error object
        if (reason instanceof Error) {
    
            console.error('[ERROR HANDLER] Stack:', reason.stack);
    
        }


        // Log additional context
        console.error('[ERROR HANDLER] Type:', typeof reason);
        console.error('[ERROR HANDLER] String representation:', String(reason));

        
        
        // In Node.js 15+, unhandled rejections will terminate the process
        // Handle this gracefully
        this.emergencyShutdown('UNHANDLED_REJECTION', reason);
    }



    /**
     * Handles shutdown signals from the operating system
     *
     * Shutdown signals are sent by:
     * - Process managers (PM2, systemd)
     * - Container orchestrators (Docker, Kubernetes)
     * - Manual termination (Ctrl+C)
     *
     * @param {string} signal - The signal name (SIGTERM, SIGINT, etc.)
     */
    async handleShutdownSignal(signal) {
    
        if (this.isShuttingDown) {
    
            console.log(`[ERROR HANDLER] Received ${signal} during shutdown, ignoring...`);
            return;
        }

        console.log(`[ERROR HANDLER] Received ${signal}, initiating graceful shutdown...`);

        try {
    
            await this.gracefulShutdown(signal);
        } catch (error) {
    
            console.error('[ERROR HANDLER] Error during graceful shutdown:', error.message);
            this.forceExit(1);
        }
    }

    
    /**
     * Performs graceful shutdown with proper cleanup
     *
     * Graceful shutdown ensures:
     * - All active connections are properly closed
     * - Microservices are cleanly shut down
     * - Resources are freed
     * - Data is persisted
     *
     * @param {string} signal - The shutdown signal or reason
     */
    async gracefulShutdown(signal) {
    
        this.isShuttingDown = true;

        console.log(`[ERROR HANDLER] Starting graceful shutdown (${signal})...`);

        try {
    
            // Set a timeout 30secs for graceful shutdown
            const shutdownTimeout = setTimeout(() => {
    
                console.error('[ERROR HANDLER] ⏰ Graceful shutdown timed out, forcing exit');
                this.forceExit(1);
    
            }, 30000);


            // Delegate shutdown to server manager
            await this.serverManager.gracefulShutdown(signal);


            // Clear timeout if shutdown completed successfully
            clearTimeout(shutdownTimeout);


            console.log('[ERROR HANDLER] ✅ Graceful shutdown completed successfully');
            
            this.forceExit(0);

        } catch (error) {
            
            console.error('[ERROR HANDLER] ❌ Error during graceful shutdown:', error.message);
            this.forceExit(1);
        
        }
    }





    /**
     * Emergency shutdown for critical errors
     *
     * Emergency shutdown is used when:
     * - Uncaught exceptions occur
     * - Unhandled rejections happen
     * - The system is in an unstable state
     *
     * @param {string} reason - The reason for emergency shutdown
     * @param {Error|any} error - The error that triggered the shutdown
     */
    async emergencyShutdown(reason, error) {
        
        if (this.isShuttingDown) {
        
            console.log('[ERROR HANDLER] Emergency shutdown already in progress');
            return;
        
        }

        this.isShuttingDown = true;

        console.error(`[ERROR HANDLER] ⚠️  EMERGENCY SHUTDOWN: ${reason}`);

        // Set aggressive 5secs timeout for emergency shutdown
        const emergencyTimeout = setTimeout(() => {
        
            console.error('[ERROR HANDLER] Emergency shutdown timed out, force killing process');
            process.exit(1);
        
        }, 5000); 


        try {
        
            // Attempt quick cleanup
            if (this.serverManager && typeof this.serverManager.gracefulShutdown === 'function') {
        
                await this.serverManager.gracefulShutdown(reason);
        
            }

            clearTimeout(emergencyTimeout);

        
        } catch (shutdownError) {
        
            console.error('[ERROR HANDLER] Error during emergency cleanup:', shutdownError.message);
        
        } finally {
        
        
            // Always exit after emergency shutdown
            console.error('[ERROR HANDLER] Process terminating due to critical error');
            process.exit(1);
        
        }
    }




    /**
     * Forces process exit with proper logging
     *
     * @param {number} code - Exit code (0 = success, 1 = error)
     */
    forceExit(code) {
    
        const exitType = code === 0 ? 'SUCCESS' : 'ERROR';
    
        console.log(`[ERROR HANDLER] Process exiting with code ${code} (${exitType})`);

        // Allow time for logs to flush
        setTimeout(() => {
    
            process.exit(code);
    
        }, 500);
    }

    
    /**
     * Logs detailed error information for debugging
     *
     * @param {Error} error - The error to log
     * @param {string} context - Additional context about where the error occurred
     */
    logError(error, context = 'Unknown') {
        
        console.error(`[ERROR HANDLER] Error in ${context}:`);
        console.error(`[ERROR HANDLER] Message: ${error.message}`);
        console.error(`[ERROR HANDLER] Name: ${error.name}`);

        if (error.stack) {
        
            console.error(`[ERROR HANDLER] Stack: ${error.stack}`);
        
        }

        
        if (error.code) {
        
            console.error(`[ERROR HANDLER] Code: ${error.code}`);
        
        }

        
        if (error.errno) {
        
            console.error(`[ERROR HANDLER] Errno: ${error.errno}`);
        
        }

        console.error(`[ERROR HANDLER] Timestamp: ${new Date().toISOString()}`);
    }




    /**
     * Returns error handler statistics
     *
     * @returns {Object} Error handler statistics and status
     */
    getStats() {
    
        return {
            setupTime: this.setupTime,
            isShuttingDown: this.isShuttingDown,
            uptime: Date.now() - this.setupTime,
            handlersConfigured: true,
            processId: process.pid,
            platform: process.platform,
            nodeVersion: process.version
        };
    }
}
