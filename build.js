/**
 * Build Script for Readmuch's Blog
 * Automates page generation and asset optimization
 */

const fs = require('fs');
const path = require('path');

class BlogBuilder {
    constructor() {
        this.config = null;
        this.templates = {};
        this.assetVersion = '20260503-search';
    }

    getPublicHtmlFile(markdownFile) {
        if (typeof markdownFile !== 'string') return '';
        return markdownFile.replace(/\.md$/, '.html');
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
            const value = rawValue.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
            attributes[key] = value;
        });

        return {
            attributes,
            body: content.slice(match[0].length)
        };
    }

    extractFirstParagraph(content) {
        if (typeof content !== 'string') return '';

        const lines = content.split(/\r?\n/);
        let collecting = [];
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

    normalizeDate(dateString) {
        if (typeof dateString !== 'string') return '';
        const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
    }

    extractDateFromMarkdown(content) {
        const { attributes } = this.parseFrontMatter(content);
        return this.normalizeDate(attributes.date || '');
    }

    stableStringify(value) {
        return JSON.stringify(value, null, 2);
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

    readJSON(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const cleanContent = content.replace(/^\uFEFF/, '');
        return JSON.parse(cleanContent);
    }

    async init() {
        this.autoGenerateConfig();

        const configPath = path.join(__dirname, 'config', 'site-config.json');
        this.config = this.readJSON(configPath);

        await this.loadTemplates();
    }

    autoGenerateConfig() {
        const configPath = path.join(__dirname, 'config', 'site-config.json');
        const config = this.readJSON(configPath);

        const categoryDirs = [
            { dir: 'Book', id: 'book' },
            { dir: 'Education', id: 'education' },
            { dir: 'Life', id: 'life' },
            { dir: 'Tech', id: 'tech' },
            { dir: 'MindNotes', id: 'mindnotes' }
        ];

        categoryDirs.forEach(({ dir, id }) => {
            const categoryPath = path.join(__dirname, dir);
            const category = config.categories.find(cat => cat.id === id);

            if (!category || !fs.existsSync(categoryPath)) return;

            const files = fs.readdirSync(categoryPath)
                .filter(file => file.endsWith('.md'))
                .map(file => {
                    const mdPath = path.join(categoryPath, file);
                    const mdContent = this.decodeBuffer(fs.readFileSync(mdPath));
                    const { attributes, body } = this.parseFrontMatter(mdContent);
                    const title = (attributes.title || '').trim();
                    const excerpt = this.extractFirstParagraph(body);
                    const date = this.extractDateFromMarkdown(mdContent);
                    const tags = typeof attributes.tags === 'string' ? attributes.tags : '[]';
                    const htmlFile = this.getPublicHtmlFile(file);

                    return {
                        title,
                        excerpt,
                        date,
                        tags,
                        source: `${dir}/${file}`,
                        link: `${dir}/${htmlFile}`,
                        basename: htmlFile
                    };
                });

            const filesByBasename = new Map(files.map(file => [file.basename, file]));
            const existingPosts = Array.isArray(category.posts) ? category.posts : [];
            const normalizedPosts = [];
            const seen = new Set();

            existingPosts.forEach(post => {
                if (!post || typeof post.link !== 'string') return;
                const basename = post.link.split('/')[1];
                if (!basename || seen.has(basename) || !filesByBasename.has(basename)) return;

                const normalized = filesByBasename.get(basename);
                normalizedPosts.push({
                    title: normalized.title,
                    excerpt: normalized.excerpt,
                    date: normalized.date,
                    tags: normalized.tags,
                    source: normalized.source,
                    link: normalized.link
                });
                seen.add(basename);
            });

            files
                .filter(file => !seen.has(file.basename))
                .sort((a, b) => a.basename.localeCompare(b.basename))
                .forEach(file => {
                    normalizedPosts.push({
                        title: file.title,
                        excerpt: file.excerpt,
                        date: file.date,
                        tags: file.tags,
                        source: file.source,
                        link: file.link
                    });
                });

            category.posts = normalizedPosts;
        });

        const nextConfigString = this.stableStringify(config);
        const currentConfigString = fs.readFileSync(configPath, 'utf8').replace(/^\uFEFF/, '');
        if (currentConfigString !== nextConfigString) {
            fs.writeFileSync(configPath, nextConfigString);
        }
    }

    async loadTemplates() {
        const templatesDir = path.join(__dirname, 'components');
        const templateFiles = fs.readdirSync(templatesDir);

        for (const file of templateFiles) {
            if (file.endsWith('.html')) {
                const name = path.basename(file, '.html');
                const content = fs.readFileSync(path.join(templatesDir, file), 'utf8');
                this.templates[name] = content;
            }
        }
    }

    renderTemplate(templateName, data) {
        let template = this.templates[templateName];
        if (!template) {
            throw new Error(`Template ${templateName} not found`);
        }

        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            template = template.replace(new RegExp(placeholder, 'g'), value);
        }

        if (data.preloadImages && Array.isArray(data.preloadImages)) {
            const preloadPlaceholder = '{{#each preloadImages}}\n<link rel="preload" href="{{this}}" as="image">\n{{/each}}';
            const preloadHtml = data.preloadImages.map(img =>
                `<link rel="preload" href="${img}" as="image">`
            ).join('\n    ');
            template = template.replace(preloadPlaceholder, preloadHtml);
        }

        if (data.showBackLink) {
            template = template.replace('{{#if showBackLink}}', '');
            template = template.replace('{{/if}}', '');
        } else {
            template = template.replace(/{{#if showBackLink}}[\s\S]*?{{\/if}}/g, '');
        }

        return template;
    }

    generateIndexPage() {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${this.config.site.description}">
    <meta name="keywords" content="Book, Education, Technology, Life, Mindnotes">
    <meta name="theme-color" content="#f8f8f8">
    <meta name="color-scheme" content="light">
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${this.config.site.name}">
    <meta property="og:description" content="${this.config.site.description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${this.config.site.url}">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${this.config.site.name}">
    <meta name="twitter:description" content="${this.config.site.description}">
    
    <title>${this.config.site.name}</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="images/favicon.png">
    
    <!-- Preload critical assets -->
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" as="style">
    <link rel="preload" href="images/book.jpg" as="image">
    <link rel="preload" href="images/education.jpg" as="image">
    <link rel="preload" href="images/life.jpg" as="image">
    <link rel="preload" href="images/tech.jpg" as="image">
    <link rel="preload" href="images/mindnotes.jpg" as="image">
    
    <!-- Font loading -->
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- External CSS -->
    <link rel="stylesheet" href="styles/category.css?v=${this.assetVersion}">
</head>
<body class="home-page">
    <header class="site-header">
        <div class="brand-block">
            <a href="index.html" class="brand-title">${this.config.site.shortName || this.config.site.name}</a>
            <span class="brand-subtitle">${this.config.site.description}</span>
        </div>
        <nav class="tab-nav" aria-label="Categories">
            <a class="tab active" href="index.html">All Posts</a>
            ${this.config.categories.map(cat => `<a class="tab" href="${cat.file}">${cat.title}</a>`).join('\n            ')}
        </nav>
        <div class="header-actions">
            <label for="postSearch" class="sr-only">Search posts</label>
            <input type="search" id="postSearch" class="search-input" placeholder="Search posts" aria-label="Search posts">
        </div>
    </header>

    <main class="container category-container home-shell" role="main">
        <section class="home-hero" aria-labelledby="homeHeroTitle">
            <div class="home-hero__copy">
                <span class="section-kicker">Reading notes, essays, and useful fragments</span>
                <h1 id="homeHeroTitle">A personal library for ideas worth returning to.</h1>
                <p>Books, technology, learning, recipes, and small observations collected into one readable archive.</p>
                <div class="home-hero__actions">
                    <a class="primary-link" href="#postList">Browse latest</a>
                    <a class="secondary-link" href="book.html">Read books</a>
                </div>
            </div>
            <article class="featured-card" id="featuredPost" aria-live="polite">
                <span class="featured-card__label">Latest note</span>
                <h2>Loading latest post...</h2>
                <p>Finding the newest entry in the archive.</p>
            </article>
        </section>

        <section class="category-bento" aria-labelledby="categoryBentoTitle">
            <div class="section-heading">
                <span class="section-kicker">Explore by shelf</span>
                <h2 id="categoryBentoTitle">Five rooms in the archive</h2>
            </div>
            <div class="bento-grid" id="categoryBento">
                <a class="bento-tile bento-tile--large" href="book.html">
                    <img src="images/book.jpg" alt="" loading="eager">
                    <span>Book</span>
                    <strong>Longer reflections from reading.</strong>
                </a>
                <a class="bento-tile" href="tech.html">
                    <img src="images/tech.jpg" alt="" loading="lazy">
                    <span>Technology</span>
                    <strong>AI, finance, and modern tools.</strong>
                </a>
                <a class="bento-tile" href="life.html">
                    <img src="images/life.jpg" alt="" loading="lazy">
                    <span>Lifestyle</span>
                    <strong>Recipes and daily routines.</strong>
                </a>
                <a class="bento-tile" href="education.html">
                    <img src="images/education.jpg" alt="" loading="lazy">
                    <span>Education</span>
                    <strong>Learning notes and explanations.</strong>
                </a>
                <a class="bento-tile bento-tile--wide" href="mindnotes.html">
                    <img src="images/mindnotes.jpg" alt="" loading="lazy">
                    <span>Mind Notes</span>
                    <strong>Questions, leadership, and inner work.</strong>
                </a>
            </div>
        </section>

        <section class="latest-section" aria-labelledby="latestPostsTitle">
            <div class="section-heading section-heading--inline">
                <div>
                    <span class="section-kicker">Recently added</span>
                    <h2 id="latestPostsTitle">All Posts</h2>
                </div>
                <p id="archiveCount">Loading archive...</p>
            </div>
        <ul id="postList" role="list">
            <!-- Posts will be injected here dynamically -->
        </ul>
        <nav class="pagination" role="navigation" aria-label="Pagination">
            <!-- Pagination will be rendered here by JavaScript -->
        </nav>
        </section>
    </main>
    
    <footer>
        <p>&copy; ${this.config.site.year} ${this.config.site.name}. All rights reserved.</p>
    </footer>
    <script src="js/postTitleLoader.js?v=${this.assetVersion}"></script>
    <script src="js/config.js?v=${this.assetVersion}"></script>
    <script src="js/pagination.js?v=${this.assetVersion}"></script>
    <script>
        document.addEventListener('DOMContentLoaded', async function() {
            try {
                if (typeof SiteConfig !== 'function' || typeof Pagination !== 'function' || typeof loadPostsWithMarkdownMeta !== 'function') {
                    throw new Error('SiteConfig, Pagination, and loadPostsWithMarkdownMeta are required.');
                }
                const config = new SiteConfig();
                await config.load();
                const allCategories = config.get().categories || [];
                const flattened = allCategories.flatMap(cat =>
                    (cat.posts || []).map(post => ({
                        ...post,
                        badge: cat.title || cat.id || ''
                    }))
                );
                const paginationOptions = config.getPagination();
                const postsWithMeta = await loadPostsWithMarkdownMeta(flattened);
                const sorted = postsWithMeta.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                renderHomeSummary(sorted, allCategories);
                const pagination = new Pagination('postList', sorted, paginationOptions.postsPerPage, paginationOptions);

                const searchInput = document.getElementById('postSearch');
                if (searchInput) {
                    if (searchInput.value.trim() !== '') {
                        pagination.setFilter(searchInput.value);
                    }
                    searchInput.addEventListener('input', (event) => {
                        pagination.setFilter(event.target.value);
                    });
                }
            } catch (error) {
                document.getElementById('postList').innerHTML = '<li>Error loading posts.</li>';
                console.error('Failed to initialize home page:', error);
            }
        });

        function renderHomeSummary(posts, categories) {
            const featured = document.getElementById('featuredPost');
            const archiveCount = document.getElementById('archiveCount');
            const latest = posts[0];

            if (archiveCount) {
                archiveCount.textContent = \`\${posts.length} notes across \${categories.length} shelves\`;
            }

            if (!featured || !latest) return;

            featured.innerHTML = '';

            const label = document.createElement('span');
            label.className = 'featured-card__label';
            label.textContent = latest.badge || 'Latest note';

            const title = document.createElement('a');
            title.className = 'featured-card__title';
            title.href = latest.link;
            title.textContent = latest.title;

            const excerpt = document.createElement('p');
            excerpt.textContent = latest.excerpt || 'Open the latest note in the archive.';

            const meta = document.createElement('div');
            meta.className = 'featured-card__meta';
            meta.textContent = latest.date || '';

            featured.append(label, title, excerpt, meta);
        }
    </script>
</body>
</html>`;

        fs.writeFileSync('index.html', html);
        console.log('Generated index.html');
    }

    generateCategoryPage(categoryId) {
        const category = this.config.categories.find(cat => cat.id === categoryId);
        if (!category) {
            throw new Error(`Category ${categoryId} not found`);
        }

        const editorial = {
            book: {
                kicker: 'Bookshelf',
                headline: '읽고 남긴 생각의 서가',
                deck: '책에서 건져 올린 문장과 질문을 오래 다시 볼 수 있게 정리합니다.'
            },
            education: {
                kicker: 'Learning Desk',
                headline: '배움과 설명을 위한 노트',
                deck: '복잡한 개념을 다시 이해하고, 나중의 나에게 설명하기 쉽게 남깁니다.'
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
            }
        };
        const categoryEditorial = editorial[categoryId] || {
            kicker: category.title,
            headline: category.title,
            deck: category.description
        };
        const categoryNav = this.config.categories.map(cat =>
            `<a class="tab${cat.id === categoryId ? ' active' : ''}" href="${cat.file}">${cat.title}</a>`
        ).join('\n            ');
        const shelfLinks = this.config.categories
            .filter(cat => cat.id !== categoryId)
            .map(cat => `
                <a class="shelf-link" href="${cat.file}">
                    <span>${cat.title}</span>
                    <strong>${cat.description}</strong>
                </a>`)
            .join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${category.description}">
    <meta name="keywords" content="${category.title}, Blog, Readmuch">
    <meta name="theme-color" content="#f5f1ea">
    <meta name="color-scheme" content="light">

    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${category.title} Category - ${this.config.site.name}">
    <meta property="og:description" content="${category.description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${this.config.site.url}/${category.file}">

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${category.title} Category - ${this.config.site.name}">
    <meta name="twitter:description" content="${category.description}">

    <title>${category.title} Category - ${this.config.site.name}</title>

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="images/favicon.png">

    <!-- Preload critical assets -->
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" as="style">
    <link rel="preload" href="${category.image}" as="image">

    <!-- Font loading -->
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- External CSS -->
    <link rel="stylesheet" href="styles/category.css?v=${this.assetVersion}">

</head>
<body class="category-page category-page--${categoryId}">
    <header class="site-header">
        <div class="brand-block">
            <a href="index.html" class="brand-title">${this.config.site.shortName || this.config.site.name}</a>
            <span class="brand-subtitle">${this.config.site.description}</span>
        </div>
        <nav class="tab-nav" aria-label="Categories">
            <a class="tab" href="index.html">All Posts</a>
            ${categoryNav}
        </nav>
        <div class="header-actions">
            <label for="postSearch" class="sr-only">Search posts</label>
            <input type="search" id="postSearch" class="search-input" placeholder="Search ${category.title}" aria-label="Search ${category.title} posts">
        </div>
    </header>

    <main class="category-container category-shell" role="main">
        <section class="category-hero" aria-labelledby="categoryHeroTitle">
            <div class="category-hero__image" aria-hidden="true">
                <img src="${category.image}" alt="">
            </div>
            <div class="category-hero__copy">
                <span class="section-kicker">${categoryEditorial.kicker}</span>
                <h1 id="categoryHeroTitle">${categoryEditorial.headline}</h1>
                <p>${categoryEditorial.deck}</p>
                <div class="category-hero__meta" id="categoryStats">Loading section notes...</div>
            </div>
        </section>

        <section class="category-feature" aria-labelledby="featuredCategoryTitle">
            <div class="section-heading">
                <span class="section-kicker">Featured article</span>
                <h2 id="featuredCategoryTitle">Editor's pick</h2>
            </div>
            <article class="category-feature__card" id="featuredCategoryPost" aria-live="polite">
                <span class="featured-card__label">${category.title}</span>
                <h3>Loading featured post...</h3>
                <p>Finding the latest note from this section.</p>
            </article>
        </section>

        <section class="category-archive" aria-labelledby="categoryArchiveTitle">
            <div class="section-heading section-heading--inline">
                <div>
                    <span class="section-kicker">Archive</span>
                    <h2 id="categoryArchiveTitle">${category.title} Articles</h2>
                </div>
                <p id="categoryArchiveCount">Loading archive...</p>
            </div>
            <ul id="postList" class="post-list" role="list">
                <!-- ${category.title} items will be injected here dynamically -->
            </ul>
            <nav class="pagination" role="navigation" aria-label="Pagination">
                <button id="prevBtn" disabled aria-label="Previous page">Previous</button>
                <button id="nextBtn" aria-label="Next page">Next</button>
            </nav>
        </section>

        <section class="more-shelves" aria-labelledby="moreShelvesTitle">
            <div class="section-heading">
                <span class="section-kicker">More shelves</span>
                <h2 id="moreShelvesTitle">다른 섹션 보기</h2>
            </div>
            <div class="shelf-link-grid">
                ${shelfLinks}
            </div>
        </section>
    </main>
    <footer>
        <p>&copy; ${this.config.site.year} ${this.config.site.name}. All rights reserved.</p>
    </footer>

    <script src="js/postTitleLoader.js?v=${this.assetVersion}"></script>
    <script src="js/config.js?v=${this.assetVersion}"></script>
    <script src="js/pagination.js?v=${this.assetVersion}"></script>
    <script>
        (async function() {
            try {
                if (typeof SiteConfig !== 'function' || typeof Pagination !== 'function' || typeof loadPostsWithMarkdownMeta !== 'function') {
                    throw new Error('Required functions not found');
                }
                
                const config = new SiteConfig();
                await config.load();
                
                const category = config.getCategory('${categoryId}');
                if (!category || !category.posts) {
                    throw new Error('Category or posts not found');
                }
                
                const paginationOptions = config.getPagination();
                const postsWithMeta = await loadPostsWithMarkdownMeta(category.posts);
                const sorted = postsWithMeta.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                renderCategorySummary(sorted, category);
                const pagination = new Pagination('postList', sorted, paginationOptions.postsPerPage, paginationOptions);

                const searchInput = document.getElementById('postSearch');
                if (searchInput) {
                    if (searchInput.value.trim() !== '') {
                        pagination.setFilter(searchInput.value);
                    }
                    searchInput.addEventListener('input', (event) => {
                        pagination.setFilter(event.target.value);
                    });
                }
            } catch (error) {
                document.getElementById('postList').innerHTML = '<li>Error loading posts.</li>';
                console.error('Failed to initialize category page:', error);
            }
        })();

        function renderCategorySummary(posts, category) {
            const stats = document.getElementById('categoryStats');
            const archiveCount = document.getElementById('categoryArchiveCount');
            const featured = document.getElementById('featuredCategoryPost');
            const latest = posts[0];
            const latestDate = latest && latest.date ? latest.date : 'No date';

            if (stats) {
                stats.textContent = \`\${posts.length} articles · Latest update \${latestDate}\`;
            }
            if (archiveCount) {
                archiveCount.textContent = \`\${posts.length} notes in this section\`;
            }
            if (!featured || !latest) return;

            featured.innerHTML = '';

            const label = document.createElement('span');
            label.className = 'featured-card__label';
            label.textContent = category.title || 'Featured';

            const title = document.createElement('a');
            title.className = 'category-feature__title';
            title.href = latest.link;
            title.textContent = latest.title;

            const excerpt = document.createElement('p');
            excerpt.textContent = latest.excerpt || 'Open the latest note in this section.';

            const meta = document.createElement('div');
            meta.className = 'featured-card__meta';
            meta.textContent = latest.date || '';

            featured.append(label, title, excerpt, meta);
        }
    </script>
</body>
</html>`;

        fs.writeFileSync(category.file, html);
        console.log(`Generated ${category.file}`);
    }

    generateAllPages() {
        console.log('Starting build process...');

        this.generateIndexPage();

        this.config.categories.forEach(category => {
            this.generateCategoryPage(category.id);
        });

        console.log('Build completed successfully.');
    }

    watch() {
        console.log('Watching for changes...');

        const watchPaths = [
            'config/site-config.json',
            'components/',
            'styles/',
            'js/'
        ];

        watchPaths.forEach(watchPath => {
            fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
                console.log(`Detected change in ${filename}`);
                this.generateAllPages();
            });
        });
    }
}

const args = process.argv.slice(2);
const builder = new BlogBuilder();

async function main() {
    await builder.init();

    if (args.includes('--watch') || args.includes('-w')) {
        builder.generateAllPages();
        builder.watch();
    } else {
        builder.generateAllPages();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = BlogBuilder;
