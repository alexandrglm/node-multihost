// ============================================
// multihost-entry.js - WebShell Integration Script for Multi-Host
// ============================================
/**
 * This file serves as the integration layer between the standalone
 * WebShell server and the node-multihost system.
 *
 * Purpose:
 * - Adapts WebShellServer class to work in multi-host environment
 * - Prevents server.listen() and process handlers conflicts
 * - Provides multi-host compatible interface (cleanup, getStats)
 *
 * Usage:
 * - In standalone: Use server.js (original entry point)
 * - In multi-host: MicroserverManager imports this file
 */

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

    console.log('[MULTIHOST-ENTRY] Initializing WebShell for multi-host environment...');

    try {
        // Create WebShell instance with forced multi-host mode
        const webshell = new WebShellServer(app, server, {
            ...options,
            shouldStart: false  // Critical: prevent server.listen()
        });

        console.log('[MULTIHOST-ENTRY] WebShellServer instance created');

        // Initialize all components (managers, middleware, Socket.IO, routes)
        await webshell.initialise();

        console.log('[MULTIHOST-ENTRY] WebShell initialization complete');

        // DO NOT call webshell.start() - multi-host handles server.listen()

        // Return multi-host compatible interface
        return {
            /**
             * Cleanup function for graceful shutdown
             * Called by multi-host during shutdown process
             */
            cleanup: async () => {
                console.log('[MULTIHOST-ENTRY] Starting WebShell cleanup...');

                try {
                    // Close Socket.IO server
                    if (webshell.io) {
                        await new Promise((resolve) => {
                            webshell.io.close(() => {
                                console.log('[MULTIHOST-ENTRY] Socket.IO closed');
                                resolve();
                            });
                        });
                    }

                    // Clean up sessions
                    if (webshell.sessions) {
                        // Sessions will be cleaned by their own timeout mechanism
                        console.log('[MULTIHOST-ENTRY] Sessions cleanup delegated to SessionManager');
                    }

                    console.log('[MULTIHOST-ENTRY] WebShell cleanup complete');

                } catch (error) {
                    console.error('[MULTIHOST-ENTRY] Error during cleanup:', error.message);
                    throw error;
                }
            },

            /**
             * Get statistics from WebShell
             * Called by multi-host for health monitoring
             */
            getStats: () => {
                try {
                    const stats = webshell.getStats();

                    return {
                        ...stats,
                        mode: 'multi-host',
                        hasSocketIO: !!webshell.io,
                        managersActive: {
                            security: !!webshell.security,
                            auth: !!webshell.auth,
                            sessions: !!webshell.sessions,
                            executor: !!webshell.executor
                        }
                    };

                } catch (error) {
                    console.error('[MULTIHOST-ENTRY] Error getting stats:', error.message);
                    return {
                        error: error.message,
                        mode: 'multi-host'
                    };
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
        console.error('[MULTIHOST-ENTRY] Stack trace:', error.stack);
        throw error;
    }
}
