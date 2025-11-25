// Utility to replace post titles with the first H1 found in their markdown files
(function() {
    const titleCache = new Map();

    async function fetchMarkdownTitle(post) {
        if (!post || !post.link) return post?.title || '';

        if (titleCache.has(post.link)) {
            return titleCache.get(post.link);
        }

        const mdPath = post.link.replace(/\.html?$/i, '.md');

        try {
            const response = await fetch(mdPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const text = await response.text();
            const match = text.match(/^\s*#\s+(.+?)\s*$/m);
            const title = match ? match[1].trim() : post.title;
            titleCache.set(post.link, title);
            return title;
        } catch (error) {
            console.error('Failed to load markdown title:', mdPath, error);
            titleCache.set(post.link, post.title);
            return post.title;
        }
    }

    async function loadPostsWithMarkdownTitles(posts) {
        if (!Array.isArray(posts)) {
            return [];
        }

        return Promise.all(
            posts.map(async post => ({
                ...post,
                title: await fetchMarkdownTitle(post)
            }))
        );
    }

    window.loadPostsWithMarkdownTitles = loadPostsWithMarkdownTitles;
})();
