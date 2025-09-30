// ============================================
// server-dailysmarty.js - DailySmarty API Setup
// ============================================
import path from 'path';
import { fileURLToPath } from 'url';

import { DailySmartyAPI } from './DailySmartyAPI.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function setupDailySmarty(app, server, options = {}) {

    console.log('[DAILYSMARTY] Initializing DailySmarty API...');

    // ============================================
    // API SETUP
    // ============================================
    const dbPath = path.join(__dirname, 'dailysmarty', 'api', 'db.json');
    const dailySmartyAPI = new DailySmartyAPI(app, dbPath);
    dailySmartyAPI.setupRoutes();

    console.log('[DAILYSMARTY] DailySmarty API initialized successfully');

    // ============================================
    // RETURN PUBLIC INTERFACE
    // ============================================
    return {
        getStats: () => dailySmartyAPI.getStats()
    };
}
