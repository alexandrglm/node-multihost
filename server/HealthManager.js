// ============================================
// HealthManager.js - Server Health Monitoring and Endpoints
// ============================================
/**
 * Manages health monitoring and diagnostic endpoints for the multi-microserver system.
 *
 * This class handles:
 * - Health check endpoint configuration
 * - Configuration information endpoint (dev mode)
 * - Statistics aggregation from all system components
 * - Health status reporting and diagnostics
 *
 * The health system provides:
 * - Real-time server status information
 * - Microserver-specific health data
 * - System resource usage monitoring
 * - Configuration debugging information
 *
 * Design Pattern: Observer + Aggregator Pattern
 * - Observes health status from various system components
 * - Aggregates and formats health information for consumption
 *
 * @author Your Team
 * @version 1.0.0
 */

export class HealthManager {
    /**
     * Initialises the HealthManager
     *
     * @param {ServerManager} serverManager - Reference to the main server manager
     */
    constructor(serverManager) {
       
        this.serverManager = serverManager;
        this.setupTime = Date.now();

        console.log('[HEALTH MANAGER] Initialised health monitoring system');
    }


    /**
     * Sets up health and diagnostic endpoints
     *
     * Configures two main endpoints:
     * 1. /api/health - Public health check endpoint
     * 2. /api/config - Development configuration endpoint
     *
     * These endpoints are essential for:
     * - Load balancer health checks
     * - Monitoring system integration
     * - Development debugging
     * - System diagnostics
     */
    setupEndpoints() {
    
        console.log('[HEALTH MANAGER] Setting up health monitoring endpoints...');

        const app = this.serverManager.getApp();


        // Main health check endpoint
        app.get('/api/health', (req, res) => this.handleHealthCheck(req, res));

        // Configuration debugging endpoint
        app.get('/api/config', (req, res) => this.handleConfigCheck(req, res));

        console.log('[HEALTH MANAGER] ✅ Health endpoints configured');
    }

    /**
     * Handles health check requests
     *
     * Provides comprehensive health information including:
     * - Basic server status and uptime
     * - Current request routing information
     * - Microserver configuration and status
     * - Individual microserver statistics
     * - System resource usage
     *
     * This endpoint is designed to be called by:
     * - Load balancers for health checking
     * - Monitoring systems for status collection
     * - Development tools for debugging
     *
     * @param {Express.Request} req - Express request object
     * @param {Express.Response} res - Express response object
     */
    handleHealthCheck(req, res) {
     
        try {
     
            const healthData = this.buildHealthResponse(req);

            // Log health check for monitoring
            console.log(`[HEALTH] Health check request from ${req.routingInfo?.domain} → ${req.targetModule}`);

            res.json(healthData);

     
        } catch (error) {
     
            console.error('[HEALTH] Error generating health response:', error.message);

            res.status(500).json({
     
                status: 'ERROR',
                timestamp: new Date().toISOString(),
                                 error: 'Health check failed',
                                 message: error.message
            });
        }
    }


    /**
     * Builds comprehensive health response data
     *
     * Aggregates information from multiple sources:
     * - Server manager statistics
     * - Microserver manager statistics
     * - Individual microserver health data
     * - System resource information
     * - Request routing context
     *
     * @param {Express.Request} req - Express request object
     * @returns {Object} Complete health response data
     */
    buildHealthResponse(req) {
    
        const config = this.serverManager.getConfig();
        const serverStats = this.serverManager.getStats();
        const microserverManager = this.serverManager.microserverManager;

        // Basic server information
        const healthData = {
    
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',

            // Current request context information
            currentRequest: {
                targetModule: req.targetModule,
                domain: req.routingInfo?.domain,
                fullHost: req.routingInfo?.fullHost,
                serverId: req.routingInfo?.serverId
            },

            // Server manager statistics
            server: serverStats.server,

            // Microserver configuration and status
            microservers: {
                total: config.servers.length,
                active: microserverManager.instances.size,
                dynamicImports: microserverManager.setupFunctions.size,
                configured: this.buildMicroserverConfigList(config.servers, microserverManager)
            },

            // Individual microserver statistics
            stats: microserverManager.getMicroserverStats(),

            // System resource information
            system: {
                memory: process.memoryUsage(),
                keepAlive: serverStats.keepAlive,
                pid: process.pid,
                platform: process.platform,
                nodeVersion: process.version
            }
        };

        return healthData;
    }



    /**
     * Builds microserver configuration list with status information
     *
     * Creates a comprehensive list of all configured microservers
     * including their configuration and current status.
     *
     * @param {Array} servers - Server configuration array
     * @param {MicroserverManager} microserverManager - Microserver manager instance
     * @returns {Array} Array of microserver configuration objects
     */
    buildMicroserverConfigList(servers, microserverManager) {
    
        return servers.map(server => ({
    
            id: server.id,
            name: server.name,
            description: server.description,
            domains: server.domains,
            features: server.server.features,
            hasInstance: microserverManager.isActive(server.name),
            setupFunction: server.server.setupFunction,
            routes: server.server.routes || [],
            status: microserverManager.isActive(server.name) ? 'active' : 'inactive'
        }));
    }


    /**
     * Handles configuration debugging requests
     *
     * Provides detailed configuration information for development and debugging.
     * Access is restricted in production unless a debug token is provided.
     *
     * This endpoint shows:
     * - Complete server configuration
     * - Dynamic import status
     * - Available domains and routing
     * - System debugging information
     *
     * @param {Express.Request} req - Express request object
     * @param {Express.Response} res - Express response object
     */
    handleConfigCheck(req, res) {
    
        try {
    
            // Security check for production environments
            if (process.env.NODE_ENV === 'production' && !req.query.debug_token) {
    
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Configuration endpoint requires debug_token in production'
                });
            }

            const configData = this.buildConfigResponse();

            console.log(`[HEALTH] Configuration request from ${req.routingInfo?.domain}`);

            res.json(configData);

        } catch (error) {
    
            console.error('[HEALTH] Error generating config response:', error.message);

            res.status(500).json({
                error: 'Configuration check failed',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }


    /**
     * Builds comprehensive configuration response data
     *
     * Provides detailed debugging information about the system configuration
     * and current state. Used for development and troubleshooting.
     *
     * @returns {Object} Complete configuration response data
     */
    buildConfigResponse() {
    
        const config = this.serverManager.getConfig();
        const microserverManager = this.serverManager.microserverManager;

        return {
            loadedAt: new Date().toISOString(),
            setupTime: this.setupTime,

            // Complete server configuration
            servers: config.servers,
            default: config.default,
            global: config.global,

            // Dynamic import information
            dynamicImports: {

                loadedFunctions: Array.from(microserverManager.setupFunctions.keys()),
                activeInstances: Array.from(microserverManager.instances.keys()),
                
                loadStats: {
                
                    successful: microserverManager.loadedModuleCount,
                    failed: microserverManager.failedModuleCount,
                    total: microserverManager.loadedModuleCount + microserverManager.failedModuleCount
                
                }
            },

            
            // Domain and routing information
            routing: {
            
                availableDomains: config.servers.flatMap(s => s.domains),
            
                defaultServer: config.default.serverName,
            
                serverDomainMapping: this.buildDomainMapping(config.servers)
            },

            
            
            // System state information
            systemState: {
            
                isInitialised: this.serverManager.isInitialised,
                isRunning: this.serverManager.isRunning,
                port: this.serverManager.port,
                host: this.serverManager.host,
                environment: process.env.NODE_ENV || 'development'
            }
        };
    }





    /**
     * Builds domain to server mapping for debugging
     *
     * Creates a clear mapping of which domains point to which microservers.
     * Useful for troubleshooting routing issues.
     *
     * @param {Array} servers - Server configuration array
     * @returns {Object} Domain to server mapping
     */
    buildDomainMapping(servers) {
    
        const mapping = {};

        servers.forEach(server => {
    
            server.domains.forEach(domain => {
    
                mapping[domain] = {
                    serverName: server.name,
                    serverId: server.id,
                    description: server.description
                };
    
            });
        });

        return mapping;
    }

    
    
    /**
     * Returns health manager statistics
     *
     * @returns {Object} Health manager statistics
     */
    getStats() {
    
        return {
            setupTime: this.setupTime,
            uptime: Date.now() - this.setupTime,
            endpointsConfigured: true
        };
    }
}
