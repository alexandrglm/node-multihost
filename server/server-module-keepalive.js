// ============================================
// KEEPALIVE MODULE
// ============================================
export class ServerKeepAlive {
    constructor(config = {}) {
        this.config = {
            intervalMinutes: config.intervalMinutes || 4,
            enableLogging: config.enableLogging !== false, // CORREGIDO
            logPrefix: config.logPrefix || '[PING]',
            includeStats: config.includeStats !== false // CORREGIDO
        };
        
        this.interval = this.config.intervalMinutes * 60 * 1000;
        this.startTime = Date.now();
        this.pingCount = 0;
        this.pingInterval = null; // CORREGIDO: era pingIntervall
        this.isActive = false;
    }

    // MÉTODO FALTANTE
    start() {
        if (this.isActive) {
            console.log(`${this.config.logPrefix} Already running`);
            return;
        }

        this.isActive = true;
        this.pingInterval = setInterval(() => {
            this.ping();
        }, this.interval);

        console.log(`${this.config.logPrefix} Started - Every ${this.config.intervalMinutes} minutes`);
        
        this.ping();
    }

    ping() {

        this.pingCount++;

         // Ping a tu propia URL
        fetch('https://google.com')
            .then(() => console.log(`${this.config.logPrefix} External ping #${this.pingCount} - OK`))
            .catch(err => console.log(`${this.config.logPrefix} External ping failed:`, err.message));

        
        if (this.config.enableLogging) {
            const message = this.config.includeStats 
                ? this.getPingMessageWithStats()
                : this.getSimplePingMessage();
            
            console.log(message);
        }
    }

    getPingMessageWithStats() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        const memory = process.memoryUsage();
        
        return `${this.config.logPrefix} #${this.pingCount} | Uptime: ${uptime}s | Memory: ${Math.round(memory.heapUsed / 1024 / 1024)}MB | ${new Date().toISOString()}`;
    }

    getSimplePingMessage() {
        return `${this.config.logPrefix} Server alive #${this.pingCount} - ${new Date().toISOString()}`;
    }

    stop() {
        if (this.pingInterval) { 
            clearInterval(this.pingInterval);
            this.pingInterval = null;
            this.isActive = false;
            console.log(`${this.config.logPrefix} Stopped`);
        }
    }

    getStats() {
        const uptime = Math.floor((Date.now() - this.startTime) / 1000);
        
        return {
            isActive: this.isActive,
            pingCount: this.pingCount,
            intervalMinutes: this.config.intervalMinutes,
            uptimeSeconds: uptime,
            startTime: this.startTime
        };
    }
}