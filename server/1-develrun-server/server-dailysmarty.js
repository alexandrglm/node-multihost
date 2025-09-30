import path from 'path';
import { fileURLToPath } from 'url';
import { DailySmartyAPI } from './dailysmarty/DailySmartyAPI.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function setupDailySmarty(app, server, options = {}) {
    
    console.log('[DAILYSMARTY] Initializing DailySmarty API submodule...');
    console.log('[DAILYSMARTY] Parent microserver:', options.parentConfig?.name || 'unknown');
    console.log('[DAILYSMARTY] __dirname:', __dirname);  // ← DEBUG

    // Path correcto: desde 1-develrun-server/ hacia dailysmarty/api/db.json
    const dbPath = path.join(__dirname, 'dailysmarty', 'api', 'db.json');
    console.log('[DAILYSMARTY] DB Path:', dbPath);  // ← DEBUG
    
    const dailySmartyAPI = new DailySmartyAPI(app, dbPath);
    dailySmartyAPI.setupRoutes();

    console.log('[DAILYSMARTY] DailySmarty API initialized successfully');

    return {
        getStats: () => dailySmartyAPI.getStats()
    };
}