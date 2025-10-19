const https = require('https');

/**
 * Keep-alive service to prevent Render from spinning down
 * Pings the server every 14 minutes (840 seconds)
 */
class KeepAliveService {
  constructor() {
    this.interval = null;
    this.url = process.env.KEEP_ALIVE_URL;
    this.intervalMs = parseInt(process.env.KEEP_ALIVE_INTERVAL) || 840000; // 14 minutes
  }

  start() {
    if (!this.url) {
      console.log('Keep-alive disabled: No KEEP_ALIVE_URL provided');
      return;
    }

    console.log(`Starting keep-alive service: ${this.url} every ${this.intervalMs}ms`);
    
    this.interval = setInterval(() => {
      this.ping();
    }, this.intervalMs);

    // Initial ping
    this.ping();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('Keep-alive service stopped');
    }
  }

  ping() {
    const startTime = Date.now();
    
    https.get(this.url, (res) => {
      const duration = Date.now() - startTime;
      console.log(`Keep-alive ping successful: ${res.statusCode} (${duration}ms)`);
    }).on('error', (err) => {
      console.error('Keep-alive ping failed:', err.message);
    });
  }
}

module.exports = KeepAliveService;
