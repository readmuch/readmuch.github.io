/**
 * Analytics Module
 * Handles visitor tracking and analytics display with improved error handling
 */
class Analytics {
    constructor(config) {
        this.config = config;
        this.visitorCountElement = document.getElementById('visitor-count');
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    init() {
        this.setupTracking();
        this.updateVisitorCount();
    }

    setupTracking() {
        // GoatCounter tracking is handled by the script tag in footer
        console.log('Analytics initialized');
        
        // Check if GoatCounter script is loaded
        if (typeof window.goatcounter === 'undefined') {
            console.warn('GoatCounter script not loaded. Check your configuration.');
        }
    }

    async updateVisitorCount() {
        if (!this.visitorCountElement) {
            console.error('Visitor count element not found');
            return;
        }

        try {
            const analytics = this.config.getAnalytics();
            const url = `${analytics.goatcounter.url}/counter/export.json`;
            
            console.log('Fetching visitor count from:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                // Add timeout
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Visitor count data:', data);
            
            if (data && typeof data.total === 'number') {
                const totalVisitors = data.total;
                this.visitorCountElement.textContent = `방문자 수: ${totalVisitors.toLocaleString()}`;
                this.retryCount = 0; // Reset retry count on success
            } else {
                throw new Error('Invalid data format received');
            }
        } catch (error) {
            console.error('Failed to update visitor count:', error);
            this.handleError(error);
        }
    }

    handleError(error) {
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            console.log(`Retrying visitor count fetch (${this.retryCount}/${this.maxRetries})...`);
            setTimeout(() => this.updateVisitorCount(), 2000 * this.retryCount); // Exponential backoff
        } else {
            this.showFallbackMessage(error);
        }
    }

    showFallbackMessage(error) {
        let message = '방문자 수: 확인 불가';
        
        // Provide more specific error messages
        if (error.name === 'AbortError') {
            message = '방문자 수: 시간 초과';
        } else if (error.message.includes('404')) {
            message = '방문자 수: 계정을 찾을 수 없음';
        } else if (error.message.includes('403')) {
            message = '방문자 수: 접근 권한 없음';
        } else if (error.message.includes('CORS')) {
            message = '방문자 수: 로컬 환경에서는 확인 불가';
        }
        
        this.visitorCountElement.textContent = message;
        
        // Add helpful debug info
        console.error('Visitor count error details:', {
            error: error.message,
            retryCount: this.retryCount,
            url: this.config.getAnalytics().goatcounter.url,
            timestamp: new Date().toISOString()
        });
    }

    // Method to manually refresh visitor count
    refresh() {
        this.retryCount = 0;
        this.updateVisitorCount();
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
