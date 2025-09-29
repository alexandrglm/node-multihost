// ============================================
// ServerManager.js - Main Server Orchestration Class
// ============================================
/**
 * Primary server management class that orchestrates the entire multi-microserver system.
 *
 * This class handles:
 * - Server configuration loading
 * - Express app setup and middleware configuration
 * - Microserver module loading and instantiation
 * - Server lifecycle management (start, stop, graceful shutdown)
 * - Health monitoring and statistics aggregation
 *
 * Design Pattern: Facade + Manager Pattern
 * - Provides a unified interface for complex server operations
 * - Delegates specific concerns to specialised managers
 *
 * @author Your Team
 * @version 1.0.0
 */


import express from "express";
import http from "http";
import dotenv from "dotenv";

import { setupDomainRouting } from './server-routing.js';
import { MicroserverManager } from './MicroserverManager.js';
import { HealthManager } from './HealthManager.js';
import { ErrorHandler } from './ErrorHandler.js';

// MODULES
import { ServerKeepAlive } from './server-module-keepalive.js';


export class ServerManager {

    /**
     * Initialises the ServerManager with configuration and dependencies
     *
     * @param {Object} options - Configuration options
     * @param {Object} options.keepAliveConfig - Keep-alive ping configuration
     * @param {number} options.port - Server port (defaults to env.PORT or 3001)
     * @param {string} options.host - Server host (defaults to env.HOST or '0.0.0.0')
     */

    constructor( options = {} ) {
        // Load environment variables first
        dotenv.config();

        // Core Express setup
        this.app = express();
        this.server = http.createServer(this.app);

        
        // Configuration management
        this.config = null;
        this.port = options.port || process.env.PORT || 3001;
        this.host = options.host || process.env.HOST || '0.0.0.0';

        
        // Specialised managers - delegation pattern
        this.microserverManager = new MicroserverManager(this);
        this.healthManager = new HealthManager(this);
        this.errorHandler = new ErrorHandler(this);

        
        // Keep-alive system
        this.keepAlive = new ServerKeepAlive(options.keepAliveConfig || {
            intervalMinutes: 4,
            enableLogging: true,
            includeStats: true,
            logPrefix: '[SERVER PING]'
        });

        // Server state tracking
        this.isInitialised = false;
        this.isRunning = false;
        this.startTime = null;

        console.log('[SERVER MANAGER] Initialised with delegation managers');
    }


    /**
     * Configures basic Express middleware and routing
     *
     * Sets up:
     * - JSON parsing middleware
     * - URL encoding middleware
     * - Static file serving for built assets
     * - Domain-based routing system
     *
     * This method is called early in the initialisation process,
     * before microserver-specific setup occurs.
     */
    
    setupMiddlewares() {
    
        console.log('[SERVER MANAGER] Configuring basic middlewares...');

    
    
        // Standard Express middleware stack
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static('dist'));

        console.log('[SERVER MANAGER] ✅ Basic middlewares configured');
    }

    
    /**
     * Loads server configuration and sets up domain routing
     *
     * This method:
     * 1. Calls setupDomainRouting which reads servers.config.json
     * 2. Configures domain-based routing middleware
     * 3. Stores configuration for use by other managers
     *
     * @returns {Promise<void>}
     * @throws {Error} If configuration loading fails
     */
    async loadConfiguration() {
    
    
        console.log('[SERVER MANAGER] Loading server configuration...');

        try {
    
            // setupDomainRouting reads servers.config.json and configures routing
            this.config = setupDomainRouting(this.app);

            if (!this.config || !this.config.servers) {
    
                throw new Error('Invalid configuration: missing servers.config.json!!!!');
    
            }

            console.log(`[SERVER MANAGER] ✅ Configuration loaded: ${this.config.servers.length} microservers`);

        } catch (error) {

            console.error('[SERVER MANAGER] ❌ Configuration loading failed:', error.message);
            throw error;

        }
    }


    /**
     * Complete server initialisation process
     *
     * Orchestrates the entire setup sequence:
     * 1. Basic middleware setup
     * 2. Configuration loading
     * 3. Microserver module loading and setup
     * 4. Health monitoring setup
     * 5. Error handling setup
     *
     * @returns {Promise<ServerManager>} Returns self for method chaining
     * @throws {Error} If any initialisation step fails
     */
    async initialise() {

        if (this.isInitialised) {

            console.log('[SERVER MANAGER] Already initialised, skipping...');
            return this;

        }

        console.log('[SERVER MANAGER] Starting complete initialisation...');

        try {


            // Step 1: Basic setup
            this.setupMiddlewares();

            // Step 2: Load configuration
            await this.loadConfiguration();

            // Step 3: Delegate microserver management
            await this.microserverManager.loadAllModules(this.config);
            await this.microserverManager.setupAllMicroservers(this.config);

            // Step 4: Setup health monitoring
            this.healthManager.setupEndpoints();

            // Step 5: Setup error handling
            this.errorHandler.setupHandlers();

            this.isInitialised = true;
            console.log('[SERVER MANAGER] ✅ Complete initialisation finished');

            return this;

        } catch (error) {
            
            console.error('[SERVER MANAGER] ❌ Initialisation failed:', error.message);
            throw error;
        
        }
    }

    
    /**
     * Starts the HTTP server and begins listening for connections
     *
     * @param {Function} callback - Optional callback function called when server starts
     * @returns {Promise<void>}
     */
    async start(callback) {
    
        if (!this.isInitialised) {
    
            throw new Error('Server must be initialised before starting');
    
        }

        if (this.isRunning) {
    
            console.log('[SERVER MANAGER] Server already running');
            return;
        }

        console.log('[SERVER MANAGER] Starting HTTP server...');

        return new Promise((resolve, reject) => {
    
            this.server.listen(this.port, this.host, (error) => {
    
                if (error) {
                    reject(error);
                    return;
                }

                this.isRunning = true;
                this.startTime = Date.now();

                // Start keep-alive system
                this.keepAlive.start();

                // Display startup information
                this.displayStartupInfo();

                // Execute callback if provided
                if (typeof callback === 'function') {
    
                    callback(this.port, this.host, this.getStats());
    
                }

                console.log('[SERVER MANAGER] ✅ Server started successfully');
                resolve();
            });
        });
    }



    /**
     * Displays comprehensive startup information to console
     *
     * Shows:
     * - Server connection details
     * - Environment information
     * - Microserver configuration
     * - Available endpoints
     * - Loaded setup functions
     */
    displayStartupInfo() {
    
        const stats = this.microserverManager.getStats();

        console.log(`
        ━━━━━━━━━━━━━━━━━━━━━━━━━━
        MULTIHOST INITIALISATION
        ━━━━━━━━━━━━━━━━━━━━━━━━━━

        🚀 Server: ${this.host}:${this.port}
        🌍 Environment: ${process.env.NODE_ENV || 'development'}
        📊 Microservers: ${stats.active}/${stats.total} active
        🔧 Dynamic Imports: ${stats.loadedFunctions} functions loaded

        🔍 CONFIGURED DOMAINS:
        ${this.config.servers.map(server =>
            `   • ${server.domains.join(', ')} → ${server.name} (${server.description})`
        ).join('\n    ')}

        🔧 LOADED SETUP FUNCTIONS:
        ${stats.setupFunctions.map(([name, type]) =>
            `   • ${name}: ${type}`
        ).join('\n    ')}

        📡 ENDPOINTS:
        • /api/health - System health check
        • /api/config - Configuration info (dev only)

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
    }

    /**
     * Gracefully shuts down the server
     *
     * Performs cleanup in proper order:
     * 1. Stop accepting new connections
     * 2. Stop keep-alive system
     * 3. Cleanup all microservers
     * 4. Close HTTP server
     *
     * @param {string} signal - The shutdown signal received
     * @returns {Promise<void>}
     */
    async gracefulShutdown(signal = 'UNKNOWN') {
        
        console.log(`[SERVER MANAGER] Received ${signal}, shutting down gracefully...`);

        try {
        
        
            // Stop keep-alive first
            this.keepAlive.stop();

            // Delegate microserver cleanup
            await this.microserverManager.cleanupAll();

            // Close HTTP server
            return new Promise((resolve) => {
        
                this.server.close(() => {
        
                    this.isRunning = false;
        
                    console.log('[SERVER MANAGER] ✅ Graceful shutdown completed');
                    resolve();
                });
            });

        } catch (error) {
            
            console.error('[SERVER MANAGER] ❌ Error during shutdown:', error.message);
            throw error;
        }
    }



    /**
     * Returns comprehensive server statistics
     *
     * @returns {Object} Server statistics including uptime, microserver stats, etc.
     */
    
    getStats() {
    
        const microserverStats = this.microserverManager.getStats();

        return {
    
            server: {
                isInitialised: this.isInitialised,
                isRunning: this.isRunning,
                uptime: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
                port: this.port,
                host: this.host,
                environment: process.env.NODE_ENV || 'development'
            },
            microservers: microserverStats,
            keepAlive: this.keepAlive.getStats(),
            memory: process.memoryUsage()
        };
    }

    
    /**
     * Provides access to the Express app instance
     * Used by managers that need to add routes or middleware
     *
     * @returns {Express} The Express application instance
     */
    getApp() {
    
        return this.app;
    
    }


    /**
     * Provides access to the HTTP server instance
     * Used by managers that need direct server access (e.g., Socket.IO)
     *
     * @returns {http.Server} The HTTP server instance
     */
    getServer() {
    
        return this.server;
    
    }

    /**
     * Provides access to the loaded configuration
     *
     * @returns {Object} The complete server configuration
     */
    getConfig() {
    
        return this.config;
    
    }
}
