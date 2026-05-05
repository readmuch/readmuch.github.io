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
            const embeddedConfig = window.__SITE_CONFIG__ || null;
            const embeddedPosts = window.__GENERATED_POSTS__ || null;

            if (embeddedConfig) {
                this.config = embeddedConfig;
            } else {
                const configResponse = await fetch('config/site-config.json');
                this.config = await configResponse.json();
            }

            let generatedPosts = embeddedPosts;
            if (!generatedPosts) {
                try {
                    const postsResponse = await fetch('config/generated-posts.json');
                    generatedPosts = postsResponse.ok ? await postsResponse.json() : { categories: [] };
                } catch (error) {
                    generatedPosts = { categories: [] };
                }
            }

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
