/**
 * Site Configuration Module
 * Loads and manages site configuration from JSON file
 */
class SiteConfig {
    constructor() {
        this.config = null;
        this.loaded = false;
    }

    async load() {
        try {
            const [configResponse, postsResponse] = await Promise.all([
                fetch('config/site-config.json'),
                fetch('config/generated-posts.json')
            ]);

            this.config = await configResponse.json();
            const generatedPosts = postsResponse.ok ? await postsResponse.json() : { categories: [] };
            const postsByCategory = new Map(
                (generatedPosts.categories || []).map(category => [category.id, category.posts || []])
            );

            this.config.categories = (this.config.categories || []).map(category => ({
                ...category,
                posts: postsByCategory.get(category.id) || []
            }));
            this.loaded = true;
            return this.config;
        } catch (error) {
            console.error('Failed to load site configuration:', error);
            throw error;
        }
    }

    get() {
        if (!this.loaded) {
            throw new Error('Configuration not loaded. Call load() first.');
        }
        return this.config;
    }

    getCategory(categoryId) {
        return this.config.categories.find(cat => cat.id === categoryId);
    }

    getPagination() {
        return this.config.pagination;
    }
}

// Export for use in other modules
window.SiteConfig = SiteConfig;
