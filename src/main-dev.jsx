// ============================================
// main-dev.jsx - Development Module Loader
// ============================================
// This file handles dynamic module loading in development mode.
// It detects which microserver to load based on domain or URL parameters.
// ============================================

/**
 * Load server configuration from JSON
 * In development, this reads from the local servers.config.json file
 * In production, the configuration is injected by Vite build process
 */
const response = await fetch('/servers.config.json');
const config = await response.json();

/**
 * Parse URL parameters for module override
 * Allows testing different microservers in development using ?module=serverName
 */
const urlParams = new URLSearchParams(window.location.search);
const moduleOverride = urlParams.get('module');
const hostname = window.location.hostname;

/**
 * Determine target microserver based on:
 * 1. URL parameter override (for testing)
 * 2. Domain matching from configuration
 * 3. Default server fallback
 */
const targetServer = moduleOverride
? config.servers.find(s => s.name === moduleOverride)
: config.servers.find(s => s.domains.includes(hostname))
|| config.servers.find(s => s.name === config.default.serverName);

/**
 * Build dynamic import path from server configuration
 * Uses the microserver's configured source directory and main file
 */
const mainPath = `./${targetServer.paths.src}/${targetServer.paths.main}`;

/**
 * Dynamically import the target microserver's main entry point
 * @vite-ignore suppresses Vite's static analysis warning for dynamic imports
 */
import(/* @vite-ignore */ mainPath);