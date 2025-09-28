// ============================================
// server/server-routing.js - Dynamic Domain Routing from Configuration
// ============================================
// This file handles dynamic routing based on domains using the JSON configuration.
// Each microserver has its own complete configuration, allowing infinite scalability.
// ============================================

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function setupDomainRouting(app) {

    console.log('[ROUTING] Setting up dynamic domain-based routing...');

    // ============================================
    // LOAD SERVER CONFIGURATION FROM JSON
    // ============================================
    // Load configuration from servers.config.json in the project root
    // This JSON contains all configuration for all microservers
    // LOAD SERVER CONFIGURATION FROM JSON
    let config;
    try {
        
        // Try secret file first (production)-> Pending Fixes
        const secretPath = '/etc/secrets/servers.config.json';
        
        if (fs.existsSync(secretPath)) {
            const configData = fs.readFileSync(secretPath, 'utf8');
            config = JSON.parse(configData);
        
            console.log('[ROUTING] Configuration loaded from secret file');
        
        } else {
        
            // Fallback to local file (development)
            const configPath = path.join(__dirname, '../servers.config.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(configData);
        
            console.log('[ROUTING] Configuration loaded from local file');
        }
    } catch (error) {

        console.error('[ROUTING] CRITICAL: Failed to load servers.config.json:', error.message);
        console.error('[ROUTING] Make sure servers.config.json exists in project root');
        process.exit(1);
    }

    // ============================================
    // BUILD DOMAIN MAPPING FROM CONFIG
    // ============================================
    // Create domain mapping from array configuration
    // Each server can have multiple domains that point to the same microserver
    const domainMap = {};

    config.servers.forEach(server => {

        console.log(`[ROUTING] Processing server: ${server.name} (ID: ${server.id})`);

        server.domains.forEach(domain => {

            domainMap[domain] = server.name;
            console.log(`[ROUTING]   - Domain: ${domain} â†' ${server.name}`);
        });
    });

    // Configure default domain
    domainMap['default'] = config.default.serverName;
    console.log(`[ROUTING] Default server: ${config.default.serverName}`);




    // ============================================
    // DISPLAY LOADED CONFIGURATION
    // ============================================

    console.log('[ROUTING] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[ROUTING] Loaded server configurations:');
    config.servers.forEach(server => {
        console.log(`[ROUTING]   ${server.name}: ${server.domains.join(', ')}`);
        console.log(`[ROUTING]     → ${server.description}`);
        console.log(`[ROUTING]     → Setup: ${server.server.setupFunction}`);
        console.log(`[ROUTING]     → Routes: ${server.server.routes.join(', ') || 'none'}`);
        console.log(`[ROUTING]     → Features: Socket.IO=${server.server.features.socketio}, CORS=${server.server.features.cors}`);
    });
    console.log('[ROUTING] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');



    // ============================================
    // DOMAIN DETECTION MIDDLEWARE
    // ============================================
    // This middleware runs on each request to determine which microserver should handle the request
    app.use((req, res, next) => {

        // Extract domain without port
        const fullHost = req.get('host') || req.headers.host || 'localhost';
        const domain = fullHost.split(':')[0];

        // Determine which microserver should handle this request
        req.targetModule = domainMap[domain] || domainMap['default'];

        // Find complete server configuration
        req.serverConfig = config.servers.find(s => s.name === req.targetModule);

        // Add debug information to request for troubleshooting
        req.routingInfo = {
            fullHost,
            domain,
            targetModule: req.targetModule,
            availableDomains: Object.keys(domainMap).filter(d => d !== 'default'),
            serverDescription: req.serverConfig?.description,
            serverId: req.serverConfig?.id,
            serverFeatures: req.serverConfig?.server.features
        };

        // Routing log for debugging
        console.log(`[ROUTING] ${fullHost} (${domain}) â†' ${req.targetModule} (${req.serverConfig?.description})`);

        next();
    });


    // ============================================
    // SPA ROUTING CATCHALL
    // ============================================
    // This middleware handles Single Page Application routing
    // Serves the correct HTML based on microserver configuration
    app.use((req, res, next) => {

        // ============================================
        // SKIP ROUTING FOR SPECIFIC PATHS
        // ============================================
        // Get paths that should be handled by other middleware
        const serverConfig = config.servers.find(s => s.name === req.targetModule);

        if (!serverConfig) {
            console.error(`[ROUTING] CRITICAL: No configuration found for module: ${req.targetModule}`);
            return res.status(500).send('Server configuration error - microserver not found');
        }

        // Check if this route should skip the SPA catchall
        const shouldSkip = serverConfig.server.skipSPA.some(skipPath =>
        req.url.startsWith(skipPath)
        );

        if (shouldSkip) {
            console.log(`[ROUTING] Skipping SPA catchall for: ${req.url} (matches skipSPA rules)`);
            return next();
        }

        // ============================================
        // SERVE MICROSERVER-SPECIFIC HTML
        // ============================================
        // Build HTML file path from configuration
        const htmlFile = path.join(serverConfig.paths.public, serverConfig.paths.html);
        const fullHtmlPath = path.join(process.cwd(), 'dist', 'public', htmlFile);

        console.log(`[ROUTING] Serving SPA: ${htmlFile} for module: ${req.targetModule}`);
        console.log(`[ROUTING] Full path: ${fullHtmlPath}`);

        // Verify that the file exists
        if (!fs.existsSync(fullHtmlPath)) {
            console.error(`[ROUTING] ERROR: HTML file not found: ${fullHtmlPath}`);
            return res.status(404).send(`HTML file not found for microserver: ${req.targetModule}`);
        }

        // Serve the microserver HTML file
        res.sendFile(fullHtmlPath);
    });

    console.log('[ROUTING] âœ… Dynamic domain routing and SPA catchall installed successfully');

    // ============================================
    // RETURN CONFIGURATION FOR OTHER MODULES
    // ============================================
    // Return configuration so other modules can use it
    // This allows server.js to access configuration for dynamic setup
    return config;
}
