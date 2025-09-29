// ============================================
// MicroserverManager.js - Dynamic Microserver Module Management
// ============================================
/**
 * Manages the dynamic loading, setup, and lifecycle of microserver modules.
 *
 * This class handles:
 * - Dynamic module imports based on configuration
 * - Microserver instance management and registry
 * - Setup function execution with proper error handling
 * - Statistics collection and cleanup coordination
 *
 * Key Features:
 * - Configuration-driven module loading (no hardcoded paths)
 * - Graceful error handling for missing or broken modules
 * - Instance lifecycle management
 * - Statistics aggregation from all microservers
 *
 * Design Pattern: Registry + Factory Pattern
 * - Maintains a registry of loaded modules and instances
 * - Factory methods for creating and configuring microserver instances
 *
 * @author Your Team
 * @version 1.0.0
 */

export class MicroserverManager {
    /**
     * Initialises the MicroserverManager
     *
     * @param {ServerManager} serverManager - Reference to the main server manager
     */
    constructor(serverManager) {
        this.serverManager = serverManager;

        // Module registry - stores dynamically loaded setup functions
        // Key: function name (e.g., 'setupWebshell')
        // Value: actual function reference
        this.setupFunctions = new Map();

        // Instance registry - stores configured microserver instances
        // Key: microserver name (e.g., 'develrun')
        // Value: { instance, config, setupFunction }
        this.instances = new Map();

        // Loading state tracking
        this.isLoaded = false;
        this.loadedModuleCount = 0;
        this.failedModuleCount = 0;

        console.log('[MICROSERVER MANAGER] Initialised with registries');
    }

    /**
     * Dynamically loads all microserver modules based on configuration
     *
     * This method iterates through the server configuration and:
     * 1. Builds the file path for each microserver module
     * 2. Uses dynamic import() to load the module at runtime
     * 3. Extracts the specified setup function from the module
     * 4. Registers the function for later use
     *
     * Dynamic imports allow the system to be completely configuration-driven
     * without any hardcoded module paths or function names.
     *
     * @param {Object} config - Server configuration from servers.config.json
     * @returns {Promise<void>}
     * @throws {Error} If no modules could be loaded
     */
    async loadAllModules(config) {
        console.log('[MICROSERVER MANAGER] â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
        console.log('[MICROSERVER MANAGER] STARTING DYNAMIC IMPORT PROCESS');
        console.log('[MICROSERVER MANAGER] â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');

        this.loadedModuleCount = 0;
        this.failedModuleCount = 0;

        // Process each server configuration
        for (const serverConfig of config.servers) {
            await this.loadSingleModule(serverConfig);
        }

        // Validate that at least some modules loaded successfully
        if (this.loadedModuleCount === 0) {
            throw new Error('No microserver modules could be loaded');
        }

        this.isLoaded = true;

        console.log('[MICROSERVER MANAGER] â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
        console.log(`[MICROSERVER MANAGER] DYNAMIC IMPORT COMPLETED`);
        console.log(`[MICROSERVER MANAGER] Successfully loaded: ${Array.from(this.setupFunctions.keys()).join(', ')}`);
        console.log(`[MICROSERVER MANAGER] Total functions available: ${this.setupFunctions.size}`);
        console.log(`[MICROSERVER MANAGER] Success: ${this.loadedModuleCount}, Failed: ${this.failedModuleCount}`);
        console.log('[MICROSERVER MANAGER] â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
    }

    /**
     * Loads a single microserver module using dynamic import
     *
     * The loading process:
     * 1. Extract module information from server configuration
     * 2. Build the complete file path using configuration values
     * 3. Use dynamic import() to load the module
     * 4. Validate that the expected function exists in the module
     * 5. Register the function in the setup function registry
     *
     * @param {Object} serverConfig - Configuration for a single microserver
     * @returns {Promise<void>}
     */
    async loadSingleModule(serverConfig) {
        // Extract configuration values for this microserver
        const setupFunctionName = serverConfig.server.setupFunction;  // e.g., "setupWebshell"
        const serverPath = serverConfig.paths.server;                 // e.g., "1-develrun-server"
        const serverFile = serverConfig.server.file;                  // e.g., "server-webshell.js"

        // Build complete file path from configuration
        // Since MicroserverManager.js is inside server/, we need to go up one level
        // Path structure: ./{server-path}/{server-file}
        // E.g.: ../1-develrun-server/server-webshell.js
        const serverFilePath = `./${serverPath}/${serverFile}`;

        console.log(`[DYNAMIC-IMPORT] Processing: ${serverConfig.name}`);
        console.log(`[DYNAMIC-IMPORT]   - Setup Function: ${setupFunctionName}`);
        console.log(`[DYNAMIC-IMPORT]   - Server Path: ${serverPath}`);
        console.log(`[DYNAMIC-IMPORT]   - Server File: ${serverFile}`);
        console.log(`[DYNAMIC-IMPORT]   - Full Path: ${serverFilePath}`);

        try {
            // Dynamic import - loads module at runtime
            // Returns a Promise that resolves to the module's exports
            const importedModule = await import(serverFilePath);

            console.log(`[DYNAMIC-IMPORT]   âœ… Module imported successfully`);
            console.log(`[DYNAMIC-IMPORT]   - Available exports:`, Object.keys(importedModule));

            // Extract the specific setup function from the module
            const setupFunction = importedModule[setupFunctionName];

            // Validate that the function exists and is callable
            if (typeof setupFunction !== 'function') {
                throw new Error(
                    `Function '${setupFunctionName}' not found in module or is not a function. ` +
                    `Available: ${Object.keys(importedModule)}`
                );
            }

            // Register the function in our setup function registry
            this.setupFunctions.set(setupFunctionName, setupFunction);
            this.loadedModuleCount++;

            console.log(`[DYNAMIC-IMPORT]   âœ… Function '${setupFunctionName}' registered successfully`);

        } catch (importError) {
            this.failedModuleCount++;

            console.error(`[DYNAMIC-IMPORT]   âŒ Failed to import ${serverFilePath}:`);
            console.error(`[DYNAMIC-IMPORT]      Error: ${importError.message}`);
            console.error(`[DYNAMIC-IMPORT]      This microserver will be skipped`);

            // Provide specific guidance for common errors
            if (importError.code === 'ERR_MODULE_NOT_FOUND') {
                console.error(`[DYNAMIC-IMPORT]      File not found. Check that the path is correct.`);
            }
        }
    }

    /**
     * Sets up all loaded microserver instances
     *
     * This method:
     * 1. Iterates through server configurations
     * 2. Matches each configuration with its loaded setup function
     * 3. Executes the setup function with proper parameters
     * 4. Stores the resulting instance for lifecycle management
     *
     * @param {Object} config - Server configuration from servers.config.json
     * @returns {Promise<void>}
     */
    async setupAllMicroservers(config) {
        console.log('[MICROSERVER MANAGER] â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');
        console.log('[MICROSERVER MANAGER] STARTING MICROSERVER SETUP PROCESS');
        console.log('[MICROSERVER MANAGER] â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”');

        // Configure each microserver using the loaded setup functions
        for (const serverConfig of config.servers) {
            await this.setupSingleMicroserver(serverConfig);
        }

        console.log(`[MICROSERVER MANAGER] â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`);
        console.log(`[MICROSERVER MANAGER] MICROSERVER SETUP COMPLETED`);
        console.log(`[MICROSERVER MANAGER] Active microservers: ${this.instances.size}/${config.servers.length}`);
        console.log(`[MICROSERVER MANAGER] Successfully configured: ${Array.from(this.instances.keys()).join(', ')}`);
        console.log(`[MICROSERVER MANAGER] â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”`);
    }

    /**
     * Sets up a single microserver instance
     *
     * The setup process:
     * 1. Locate the setup function for this microserver
     * 2. Prepare configuration options for the setup function
     * 3. Execute the setup function with Express app and HTTP server
     * 4. Store the returned instance for lifecycle management
     *
     * @param {Object} serverConfig - Configuration for a single microserver
     * @returns {Promise<void>}
     */
    async setupSingleMicroserver(serverConfig) {
        console.log(`[MICROSERVER SETUP] â”â”â” Setting up microserver: ${serverConfig.name} (ID: ${serverConfig.id}) â”â”â”`);
        console.log(`[MICROSERVER SETUP] Description: ${serverConfig.description}`);
        console.log(`[MICROSERVER SETUP] Domains: ${serverConfig.domains.join(', ')}`);

        const setupFunctionName = serverConfig.server.setupFunction;

        // Locate the setup function in our registry
        const setupFunction = this.setupFunctions.get(setupFunctionName);

        if (!setupFunction) {
            console.error(`[MICROSERVER SETUP] âŒ Setup function '${setupFunctionName}' not found for ${serverConfig.name}`);
            console.error(`[MICROSERVER SETUP] Available functions: ${Array.from(this.setupFunctions.keys()).join(', ')}`);
            console.error(`[MICROSERVER SETUP] This microserver will be skipped`);
            return;
        }

        console.log(`[MICROSERVER SETUP] Using setup function: ${setupFunctionName}`);
        console.log(`[MICROSERVER SETUP] Server features:`, serverConfig.server.features);

        try {
            // Prepare standardised options for the setup function
            const setupOptions = this.createSetupOptions(serverConfig);

            console.log(`[MICROSERVER SETUP] Setup options prepared:`, {
                shouldStart: setupOptions.shouldStart,
                serverId: setupOptions.serverId,
                serverName: setupOptions.serverName,
                configKeys: Object.keys(setupOptions.serverConfig)
            });

            // Execute the setup function with Express app and HTTP server
            const microserverInstance = setupFunction(
                this.serverManager.getApp(),
                                                      this.serverManager.getServer(),
                                                      setupOptions
            );

            // Store the instance in our registry
            this.instances.set(serverConfig.name, {
                instance: microserverInstance,
                config: serverConfig,
                setupFunction: setupFunctionName
            });

            console.log(`[MICROSERVER SETUP] âœ… ${serverConfig.name} configured successfully`);

            // Log route configuration
            if (serverConfig.server.routes && serverConfig.server.routes.length > 0) {
                console.log(`[MICROSERVER SETUP] Routes configured: ${serverConfig.server.routes.join(', ')}`);
            } else {
                console.log(`[MICROSERVER SETUP] No specific routes configured`);
            }

        } catch (setupError) {
            console.error(`[MICROSERVER SETUP] âŒ Failed to setup ${serverConfig.name}:`);
            console.error(`[MICROSERVER SETUP] Error: ${setupError.message}`);
            console.error(`[MICROSERVER SETUP] Stack trace:`, setupError.stack);
        }
    }

    /**
     * Creates standardised setup options for microserver setup functions
     *
     * All setup functions receive the same parameter structure:
     * - shouldStart: false (main server handles listening)
     * - serverConfig: complete configuration from JSON
     * - serverId: numeric server ID
     * - serverName: string server name
     *
     * @param {Object} serverConfig - Configuration for a single microserver
     * @returns {Object} Standardised setup options
     */
    createSetupOptions(serverConfig) {
        return {
            shouldStart: false,           // Main server handles listening
            serverConfig: serverConfig,   // Complete configuration from JSON
            serverId: serverConfig.id,    // Numeric ID
            serverName: serverConfig.name // String name
        };
    }

    /**
     * Gracefully cleans up all microserver instances
     *
     * Calls the cleanup method on each microserver instance if available.
     * Used during server shutdown to ensure proper resource cleanup.
     *
     * @returns {Promise<void>}
     */
    async cleanupAll() {
        console.log('[MICROSERVER MANAGER] Cleaning up all microserver instances...');

        const cleanupPromises = [];

        for (const [name, serverInstance] of this.instances) {
            try {
                // If the microserver has a cleanup function, execute it
                if (serverInstance.instance && typeof serverInstance.instance.cleanup === 'function') {
                    console.log(`[MICROSERVER MANAGER] Cleaning up ${name}...`);
                    cleanupPromises.push(serverInstance.instance.cleanup());
                }
            } catch (error) {
                console.error(`[MICROSERVER MANAGER] Error cleaning up ${name}:`, error.message);
            }
        }

        // Wait for all cleanup operations to complete
        await Promise.allSettled(cleanupPromises);

        console.log('[MICROSERVER MANAGER] âœ… All microserver cleanup completed');
    }

    /**
     * Retrieves statistics from all microserver instances
     *
     * @returns {Object} Aggregated statistics from all microservers
     */
    getMicroserverStats() {
        const stats = {};

        for (const [serverName, serverInstance] of this.instances) {
            try {
                // If the microserver has a getStats function, use it
                if (serverInstance.instance && typeof serverInstance.instance.getStats === 'function') {
                    stats[serverName] = serverInstance.instance.getStats();
                } else {
                    stats[serverName] = { status: 'running', hasStats: false };
                }
            } catch (error) {
                stats[serverName] = { status: 'error', error: error.message };
            }
        }

        return stats;
    }

    /**
     * Returns comprehensive manager statistics
     *
     * @returns {Object} Complete statistics about the microserver manager
     */
    getStats() {
        return {
            total: this.setupFunctions.size,
            active: this.instances.size,
            loadedFunctions: this.loadedModuleCount,
            failedLoads: this.failedModuleCount,
            isLoaded: this.isLoaded,
            setupFunctions: Array.from(this.setupFunctions.entries()).map(([name, func]) => [name, typeof func]),
            activeInstances: Array.from(this.instances.keys()),
            microserverStats: this.getMicroserverStats()
        };
    }

    /**
     * Checks if a specific microserver is loaded and active
     *
     * @param {string} serverName - Name of the microserver to check
     * @returns {boolean} True if the microserver is active
     */
    isActive(serverName) {
        return this.instances.has(serverName);
    }

    /**
     * Gets a specific microserver instance
     *
     * @param {string} serverName - Name of the microserver
     * @returns {Object|null} The microserver instance or null if not found
     */
    getInstance(serverName) {
        const entry = this.instances.get(serverName);
        return entry ? entry.instance : null;
    }
}
