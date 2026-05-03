// Backward-compatible shim.
// Post metadata is generated at build time in config/generated-posts.json.
(function() {
    async function loadPostsWithMarkdownMeta(posts) {
        return Array.isArray(posts) ? posts : [];
    }

    async function loadPostsWithMarkdownTitles(posts) {
        return loadPostsWithMarkdownMeta(posts);
    }

    window.loadPostsWithMarkdownMeta = loadPostsWithMarkdownMeta;
    window.loadPostsWithMarkdownTitles = loadPostsWithMarkdownTitles;
})();
