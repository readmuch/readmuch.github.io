/**
 * Analytics Module
 * Handles visitor tracking and analytics display
 */
class Analytics {
    constructor(config) {
        this.config = config;
        this.visitorCountElement = document.getElementById('visitor-count');
    }

    init() {
        this.setupTracking();
        this.updateVisitorCount();
    }

    setupTracking() {
        // GoatCounter tracking is handled by the script tag in footer
        // This method can be extended for additional tracking
        console.log('Analytics initialized');
    }

    async updateVisitorCount() {
        if (!this.visitorCountElement) return;

        try {
            const analytics = this.config.getAnalytics();
            const response = await fetch(`${analytics.goatcounter.url}/counter/export.json`);
            const data = await response.json();
            
            const totalVisitors = data.total;
            this.visitorCountElement.textContent = `방문자 수: ${totalVisitors.toLocaleString()}`;
        } catch (error) {
            console.error('Failed to update visitor count:', error);
            this.visitorCountElement.textContent = '방문자 수: 확인 불가';
        }
    }

    // Utility method for debouncing
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Export for use in other modules
window.Analytics = Analytics;
