// Utility to replace post titles with the first H1 found in their markdown files
(function() {
    const cache = new Map();

    function decodeMarkdownBuffer(buffer) {
        const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
        const replacementCount = (utf8Text.match(/\uFFFD/g) || []).length;
        if (replacementCount > 0) {
            try {
                return new TextDecoder('euc-kr', { fatal: false }).decode(buffer);
            } catch (error) {
                return utf8Text;
            }
        }
        return utf8Text;
    }

    function parseFrontMatter(text) {
        if (typeof text !== 'string') {
            return { attributes: {}, body: '' };
        }

        const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
        if (!match) {
            return { attributes: {}, body: text };
        }

        const attributes = {};
        match[1].split(/\r?\n/).forEach(line => {
            const metaMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
            if (!metaMatch) return;

            const [, key, rawValue] = metaMatch;
            const value = rawValue.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
            attributes[key] = value;
        });

        return {
            attributes,
            body: text.slice(match[0].length)
        };
    }

    function extractTitleFromBody(text, fallback = '') {
        if (typeof text !== 'string') return fallback;

        const lines = text.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            const match = trimmed.match(/^#+\s*(.+?)\s*$/);
            if (!match) continue;

            const headingText = match[1].trim();
            const normalized = trimmed.replace(/^#+\s*/, '');
            const tokens = normalized.split(/\s+/).filter(Boolean);
            const isTagOnlyHeading = tokens.length > 1 && tokens.slice(1).every(token => token.startsWith('#'));
            if (isTagOnlyHeading) continue;

            return headingText;
        }

        return fallback;
    }

    function normalizeDate(value) {
        if (typeof value !== 'string') return '';
        const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
    }

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

    async function fetchMarkdownMeta(post) {
        if (!post || !post.link) return { title: post?.title || '', excerpt: post?.excerpt || '' };

        if (cache.has(post.link)) {
            return cache.get(post.link);
        }

        const mdPath = post.source || post.link.replace(/\.html?$/i, '.md');

        try {
            // Try to fetch the markdown content
            const response = await fetch(mdPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const text = decodeMarkdownBuffer(await response.arrayBuffer());
            const { attributes, body } = parseFrontMatter(text);
            const title = (attributes.title || '').trim() || extractTitleFromBody(body, post.title);
            const excerpt = extractFirstParagraph(body);
            const frontMatterDate = normalizeDate(attributes.date || '');
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

            const meta = { title, excerpt, date: frontMatterDate || post.date || '', resolvedLink };
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


