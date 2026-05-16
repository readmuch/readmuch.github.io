/**
 * Static build script for Readmuch.
 *
 * Source of truth:
 * - config/site-config.json: site and category metadata
 * - category folders: Markdown posts
 * - templates/*.html: generated page templates
 *
 * Generated:
 * - config/generated-posts.json
 * - js/generated-data.js
 * - post-data/*.js
 * - index.html, post.html, and category HTML pages
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONFIG_PATH = path.join(ROOT, 'config', 'site-config.json');
const GENERATED_POSTS_PATH = path.join(ROOT, 'config', 'generated-posts.json');
const GENERATED_DATA_PATH = path.join(ROOT, 'js', 'generated-data.js');
const POST_DATA_DIR = path.join(ROOT, 'post-data');
const TEMPLATE_DIR = path.join(ROOT, 'templates');

const DEFAULT_CATEGORY_DIRS = {
    book: 'Book',
    education: 'Education',
    life: 'Life',
    tech: 'Tech',
    mindnotes: 'MindNotes',
    games: 'Games'
};

const CATEGORY_EDITORIAL = {
    book: {
        kicker: 'Bookshelf',
        headline: '읽고 남긴 생각의 서가',
        deck: '책에서 건져 올린 문장과 질문을 오래 다시 볼 수 있게 정리합니다.'
    },
    education: {
        kicker: 'Learning Desk',
        headline: '배우고 설명하기 위한 노트',
        deck: '복잡한 개념을 다시 이해하고, 나중에 누군가에게 설명하기 쉽게 엮습니다.'
    },
    life: {
        kicker: 'Daily Practice',
        headline: '일상에서 반복해도 좋은 것들',
        deck: '요리, 루틴, 생활의 작은 기술을 실용적인 기록으로 모읍니다.'
    },
    tech: {
        kicker: 'Technology Review',
        headline: 'AI, 금융, 도구에 관한 관찰',
        deck: '기술의 변화를 일과 사고, 시장의 언어로 차분히 읽어봅니다.'
    },
    mindnotes: {
        kicker: 'Mind Notes',
        headline: '생각, 관계, 성장에 관한 기록',
        deck: '마음에 오래 남은 질문과 관계, 리더십, 태도에 관한 메모입니다.'
    },
    games: {
        kicker: 'Learning Games',
        headline: 'Playful practice for young learners',
        deck: 'Bright, friendly web games that turn repetition into small wins.'
    }
};

class BlogBuilder {
    constructor() {
        this.config = null;
        this.generatedPosts = { categories: [] };
        this.postMarkdown = new Map();
        this.templates = {};
        this.assetVersion = 'dev';
    }

    async init() {
        this.config = this.readJSON(CONFIG_PATH);
        this.normalizeCategoryConfig();
        this.postMarkdown = new Map();
        this.generatedPosts = this.discoverPosts();
        this.assetVersion = this.computeAssetVersion();
        this.loadTemplates();
    }

    readJSON(filePath) {
        const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
        return JSON.parse(content);
    }

    writeJSON(filePath, value) {
        fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    }

    loadTemplates() {
        ['home.html', 'category.html', 'post.html'].forEach(file => {
            this.templates[file] = fs.readFileSync(path.join(TEMPLATE_DIR, file), 'utf8');
        });
    }

    normalizeCategoryConfig() {
        this.config.categories = (this.config.categories || []).map(category => {
            const { posts, ...rest } = category;
            return {
                ...rest,
                dir: rest.dir || DEFAULT_CATEGORY_DIRS[rest.id] || rest.title
            };
        });
    }

    decodeBuffer(buffer) {
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

    parseFrontMatter(content) {
        if (typeof content !== 'string') {
            return { attributes: {}, body: '' };
        }

        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
        if (!match) {
            return { attributes: {}, body: content };
        }

        const attributes = {};
        match[1].split(/\r?\n/).forEach(line => {
            const metaMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
            if (!metaMatch) return;

            const [, key, rawValue] = metaMatch;
            attributes[key] = rawValue.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
        });

        return {
            attributes,
            body: content.slice(match[0].length)
        };
    }

    normalizeDate(value) {
        if (typeof value !== 'string') return '';
        const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
    }

    normalizeTags(value) {
        if (Array.isArray(value)) return value;
        if (typeof value !== 'string') return [];
        return value
            .replace(/^\[/, '')
            .replace(/\]$/, '')
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean);
    }

    extractFirstParagraph(content) {
        const lines = String(content || '').split(/\r?\n/);
        const collecting = [];

        for (const line of lines) {
            if (/^\s*#/.test(line)) continue;
            if (line.trim() === '') {
                if (collecting.length > 0) break;
                continue;
            }
            collecting.push(line.trim());
            if (collecting.join(' ').length >= 200) break;
        }

        const paragraph = collecting.join(' ');
        if (!paragraph) return '';
        return paragraph.length > 220 ? `${paragraph.slice(0, 220).trim()}...` : paragraph;
    }

    sourceDataFile(source) {
        const hash = crypto.createHash('sha1').update(source).digest('hex').slice(0, 16);
        return `post-data/${hash}.js`;
    }

    discoverPosts() {
        const categories = this.config.categories.map(category => {
            const categoryPath = path.join(ROOT, category.dir);
            const posts = fs.existsSync(categoryPath)
                ? fs.readdirSync(categoryPath)
                    .filter(file => file.endsWith('.md'))
                    .sort((a, b) => a.localeCompare(b))
                    .map(file => this.readPost(category, file))
                : [];

            posts.sort((a, b) => {
                const dateCompare = new Date(b.date || 0) - new Date(a.date || 0);
                return dateCompare || a.source.localeCompare(b.source);
            });

            return {
                id: category.id,
                posts
            };
        });

        return { generatedAt: new Date().toISOString(), categories };
    }

    readPost(category, file) {
        const source = `${category.dir}/${file}`;
        const fullPath = path.join(ROOT, category.dir, file);
        const markdown = this.decodeBuffer(fs.readFileSync(fullPath));
        const { attributes, body } = this.parseFrontMatter(markdown);
        const title = (attributes.title || '').trim() || path.basename(file, '.md');
        const date = this.normalizeDate(attributes.date || file.slice(0, 10));
        const excerpt = (attributes.excerpt || '').trim() || this.extractFirstParagraph(body);
        const tags = this.normalizeTags(attributes.tags || '');
        const dataFile = this.sourceDataFile(source);

        this.postMarkdown.set(source, markdown);

        return {
            title,
            excerpt,
            date,
            tags,
            source,
            dataFile,
            link: (attributes.link || '').trim() || `post.html?src=${encodeURIComponent(source)}`
        };
    }

    computeAssetVersion() {
        const hash = crypto.createHash('sha1');
        const files = [
            'styles/base.css',
            'styles/components.css',
            'styles/layout.css',
            'styles/category.css',
            'js/config.js',
            'js/pagination.js',
            'js/postTitleLoader.js'
        ];

        files.forEach(file => {
            const filePath = path.join(ROOT, file);
            if (fs.existsSync(filePath)) {
                hash.update(file);
                hash.update(fs.readFileSync(filePath));
            }
        });

        return hash.digest('hex').slice(0, 10);
    }

    writeGeneratedData() {
        const payload = {
            siteConfig: this.config,
            generatedPosts: this.generatedPosts
        };
        const serialized = JSON.stringify(payload, null, 2).replace(/<\/script/gi, '<\\/script');
        const content = `// Generated by build.js. Do not edit by hand.\n(function() {\n    const data = ${serialized};\n    window.__SITE_CONFIG__ = data.siteConfig;\n    window.__GENERATED_POSTS__ = data.generatedPosts;\n})();\n`;

        fs.writeFileSync(GENERATED_DATA_PATH, content, 'utf8');
    }

    writePostDataFiles() {
        fs.mkdirSync(POST_DATA_DIR, { recursive: true });
        const expected = new Set();

        this.generatedPosts.categories.forEach(category => {
            category.posts.forEach(post => {
                const relativePath = post.dataFile;
                const filePath = path.join(ROOT, relativePath);
                expected.add(path.resolve(filePath));

                const payload = {
                    source: post.source,
                    markdown: this.postMarkdown.get(post.source) || ''
                };
                const serialized = JSON.stringify(payload).replace(/<\/script/gi, '<\\/script');
                const content = `// Generated by build.js. Do not edit by hand.\nwindow.__POST_DATA__ = window.__POST_DATA__ || {};\nwindow.__POST_DATA__[${JSON.stringify(post.source)}] = ${serialized};\n`;
                fs.writeFileSync(filePath, content, 'utf8');
            });
        });

        fs.readdirSync(POST_DATA_DIR)
            .filter(file => file.endsWith('.js'))
            .forEach(file => {
                const filePath = path.resolve(path.join(POST_DATA_DIR, file));
                if (!expected.has(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
    }

    getPostsForCategory(categoryId) {
        return this.generatedPosts.categories.find(category => category.id === categoryId)?.posts || [];
    }

    getAllPosts() {
        return this.config.categories.flatMap(category =>
            this.getPostsForCategory(category.id).map(post => ({
                ...post,
                badge: category.title
            }))
        ).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }

    renderTemplate(name, data) {
        return this.templates[name].replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_, key) => {
            return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : '';
        });
    }

    renderCategoryNav(activeId = '') {
        const homeClass = activeId === 'home' ? ' active' : '';
        const categoryLinks = this.config.categories.map(category =>
            `<a class="tab${category.id === activeId ? ' active' : ''}" href="${category.file}">${category.title}</a>`
        ).join('\n            ');

        return `<a class="tab${homeClass}" href="index.html">All Posts</a>\n            ${categoryLinks}`;
    }

    renderHomeBento() {
        return this.config.categories.map((category, index) => {
            const modifier = index === 0 ? ' bento-tile--large' : index === this.config.categories.length - 1 ? ' bento-tile--wide' : '';
            const latest = this.getPostsForCategory(category.id)[0];
            const subtitle = latest?.title || category.description;
            return `
                <a class="bento-tile${modifier}" href="${category.file}">
                    <img src="${category.image}" alt="" loading="${index === 0 ? 'eager' : 'lazy'}">
                    <span>${category.title}</span>
                    <strong>${subtitle}</strong>
                </a>`;
        }).join('');
    }

    renderShelfLinks(activeId) {
        return this.config.categories
            .filter(category => category.id !== activeId)
            .map(category => `
                <a class="shelf-link" href="${category.file}">
                    <span>${category.title}</span>
                    <strong>${category.description}</strong>
                </a>`)
            .join('');
    }

    generateIndexPage() {
        const allPosts = this.getAllPosts();
        const latest = allPosts[0] || {};
        const html = this.renderTemplate('home.html', {
            ASSET_VERSION: this.assetVersion,
            SITE_NAME: this.config.site.name,
            SITE_SHORT_NAME: this.config.site.shortName || this.config.site.name,
            SITE_DESCRIPTION: this.config.site.description,
            SITE_URL: this.config.site.url,
            SITE_YEAR: this.config.site.year,
            NAV: this.renderCategoryNav('home'),
            BENTO_TILES: this.renderHomeBento(),
            FEATURED_BADGE: latest.badge || 'Latest note',
            FEATURED_TITLE: latest.title || 'No posts yet',
            FEATURED_EXCERPT: latest.excerpt || 'Add a Markdown post to begin.',
            FEATURED_DATE: latest.date || '',
            FEATURED_LINK: latest.link || '#',
            ARCHIVE_COUNT: `${allPosts.length} notes across ${this.config.categories.length} shelves`
        });

        fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');
        console.log('Generated index.html');
    }

    generateCategoryPage(category) {
        const posts = this.getPostsForCategory(category.id);
        const latest = posts[0] || {};
        const editorial = CATEGORY_EDITORIAL[category.id] || {
            kicker: category.title,
            headline: category.title,
            deck: category.description
        };

        const html = this.renderTemplate('category.html', {
            ASSET_VERSION: this.assetVersion,
            SITE_NAME: this.config.site.name,
            SITE_SHORT_NAME: this.config.site.shortName || this.config.site.name,
            SITE_DESCRIPTION: this.config.site.description,
            SITE_URL: this.config.site.url,
            SITE_YEAR: this.config.site.year,
            CATEGORY_ID: category.id,
            CATEGORY_TITLE: category.title,
            CATEGORY_DESCRIPTION: category.description,
            CATEGORY_FILE: category.file,
            CATEGORY_IMAGE: category.image,
            CATEGORY_KICKER: editorial.kicker,
            CATEGORY_HEADLINE: editorial.headline,
            CATEGORY_DECK: editorial.deck,
            CATEGORY_STATS: `${posts.length} articles - Latest update ${latest.date || 'No date'}`,
            CATEGORY_ARCHIVE_COUNT: `${posts.length} notes in this section`,
            NAV: this.renderCategoryNav(category.id),
            SHELF_LINKS: this.renderShelfLinks(category.id),
            FEATURED_TITLE: latest.title || 'No posts yet',
            FEATURED_EXCERPT: latest.excerpt || 'Add a Markdown post to begin.',
            FEATURED_DATE: latest.date || '',
            FEATURED_LINK: latest.link || '#'
        });

        fs.writeFileSync(path.join(ROOT, category.file), html, 'utf8');
        console.log(`Generated ${category.file}`);
    }

    generatePostPage() {
        const html = this.renderTemplate('post.html', {
            ASSET_VERSION: this.assetVersion,
            SITE_NAME: this.config.site.name,
            SITE_SHORT_NAME: this.config.site.shortName || this.config.site.name,
            SITE_DESCRIPTION: this.config.site.description,
            SITE_URL: this.config.site.url,
            SITE_YEAR: this.config.site.year,
            NAV: this.renderCategoryNav('')
        });

        fs.writeFileSync(path.join(ROOT, 'post.html'), html, 'utf8');
        console.log('Generated post.html');
    }

    generateAllPages() {
        console.log('Starting build process...');
        this.writeJSON(GENERATED_POSTS_PATH, this.generatedPosts);
        this.writeGeneratedData();
        this.writePostDataFiles();
        this.generateIndexPage();
        this.config.categories.forEach(category => this.generateCategoryPage(category));
        this.generatePostPage();
        console.log('Build completed successfully.');
    }

    watch() {
        console.log('Watching for changes...');
        ['config/site-config.json', 'templates', 'styles', 'js', 'post-data', ...this.config.categories.map(c => c.dir)]
            .filter(watchPath => fs.existsSync(path.join(ROOT, watchPath)))
            .forEach(watchPath => {
                fs.watch(path.join(ROOT, watchPath), { recursive: true }, () => {
                    this.init()
                        .then(() => this.generateAllPages())
                        .catch(error => console.error(error));
                });
            });
    }
}

const args = process.argv.slice(2);
const builder = new BlogBuilder();

async function main() {
    await builder.init();
    builder.generateAllPages();

    if (args.includes('--watch') || args.includes('-w')) {
        builder.watch();
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}

module.exports = BlogBuilder;
