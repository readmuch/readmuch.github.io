// Utility to replace post titles with the first H1 found in their markdown files
(function() {
    const cache = new Map();
    let fileDatesPromise = null;

    function extractFirstParagraph(text) {
        const lines = text.split(/\r?\n/);
        let collecting = [];
        for (const line of lines) {
            if (/^\s*#/.test(line)) continue; // skip headings
            if (line.trim() === '') {
                if (collecting.length > 0) break;
                continue;
            }
            collecting.push(line.trim());
            if (collecting.join(' ').length >= 200) break;
        }
        const paragraph = collecting.join(' ');
        if (!paragraph) return '';
        return paragraph.length > 220 ? paragraph.slice(0, 220).trim() + '...' : paragraph;
    }

    function extractDate(text) {
        const match = text.match(/\b(20\d{2}|19\d{2})[./-](\d{1,2})[./-](\d{1,2})\b/);
        if (match) {
            const [year, month, day] = [match[1], match[2].padStart(2, '0'), match[3].padStart(2, '0')];
            return `${year}-${month}-${day}`;
        }
        return '';
    }

    async function loadFileDates() {
        if (fileDatesPromise) return fileDatesPromise;
        fileDatesPromise = fetch('config/file-dates.json')
            .then(res => res.ok ? res.json() : {})
            .catch(() => ({}));
        return fileDatesPromise;
    }

    async function fetchMarkdownMeta(post) {
        if (!post || !post.link) return { title: post?.title || '', excerpt: post?.excerpt || '' };

        if (cache.has(post.link)) {
            return cache.get(post.link);
        }

        const mdPath = post.link.replace(/\.html?$/i, '.md');

        try {
            const fileDates = await loadFileDates();
            // Try to fetch the markdown content
            const response = await fetch(mdPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const text = await response.text();
            const titleMatch = text.match(/^\s*#\s+(.+?)\s*$/m);
            const title = titleMatch ? titleMatch[1].trim() : post.title;
            const excerpt = extractFirstParagraph(text);
            const detectedDate = extractDate(text);
            const creationDate = fileDates[mdPath] || '';
            // Determine whether a standalone HTML exists for this post; if not, point to post.html loader
            let resolvedLink = post.link;
            try {
                const headResp = await fetch(post.link, { method: 'HEAD' });
                if (!headResp.ok) {
                    resolvedLink = `post.html?src=${encodeURIComponent(mdPath)}`;
                }
            } catch (e) {
                // HEAD might fail due to server restrictions; fallback to attempting GET
                try {
                    const getResp = await fetch(post.link, { method: 'GET' });
                    if (!getResp.ok) {
                        resolvedLink = `post.html?src=${encodeURIComponent(mdPath)}`;
                    }
                } catch (e2) {
                    resolvedLink = `post.html?src=${encodeURIComponent(mdPath)}`;
                }
            }

            const meta = { title, excerpt, date: creationDate || detectedDate || post.date || '', resolvedLink };
            cache.set(post.link, meta);
            return meta;
        } catch (error) {
            console.error('Failed to load markdown meta:', mdPath, error);
            const fallback = { title: post.title, excerpt: post.excerpt || '', date: post.date || '' };
            cache.set(post.link, fallback);
            return fallback;
        }
    }

    async function loadPostsWithMarkdownMeta(posts, defaults = {}) {
        if (!Array.isArray(posts)) {
            return [];
        }

        return Promise.all(
            posts.map(async post => {
                const meta = await fetchMarkdownMeta(post);
                return {
                    ...post,
                    title: meta.title,
                    excerpt: post.excerpt || meta.excerpt || '',
                    date: post.date || meta.date || '',
                    badge: post.badge || defaults.badge || '',
                    link: meta.resolvedLink || post.link
                };
            })
        );
    }

    // Backward compatibility: returns only titles
    async function loadPostsWithMarkdownTitles(posts) {
        const withMeta = await loadPostsWithMarkdownMeta(posts);
        return withMeta.map(p => ({ ...p }));
    }

    window.loadPostsWithMarkdownMeta = loadPostsWithMarkdownMeta;
    window.loadPostsWithMarkdownTitles = loadPostsWithMarkdownTitles;
})();


