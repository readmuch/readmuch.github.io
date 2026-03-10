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
    }

    readJSON(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        // Remove BOM if present (UTF-8 BOM is \uFEFF)
        const cleanContent = content.replace(/^\uFEFF/, '');
        return JSON.parse(cleanContent);
    }

    async init() {
        // Auto-generate site-config.json from markdown files if needed
        this.autoGenerateConfig();
        
        // Load configuration
        const configPath = path.join(__dirname, 'config', 'site-config.json');
        this.config = this.readJSON(configPath);
        
        // Load templates
        await this.loadTemplates();
    }

    autoGenerateConfig() {
        const configPath = path.join(__dirname, 'config', 'site-config.json');
        const datesPath = path.join(__dirname, 'config', 'file-dates.json');
        
        let config = this.readJSON(configPath);
        let fileDates = this.readJSON(datesPath);
        
        // Categories to scan for markdown files
        const categoryDirs = [
            { dir: 'Book', id: 'book' },
            { dir: 'Education', id: 'education' },
            { dir: 'Life', id: 'life' },
            { dir: 'Tech', id: 'tech' },
            { dir: 'MindNotes', id: 'mindnotes' }
        ];

        let newPostsAdded = false;

        categoryDirs.forEach(({ dir, id }) => {
            const categoryPath = path.join(__dirname, dir);
            const category = config.categories.find(cat => cat.id === id);
            
            if (!category) return;

            // Get all markdown files in the category directory
            const files = fs.readdirSync(categoryPath)
                .filter(file => file.endsWith('.md'))
                .map(file => {
                    const mdPath = path.join(categoryPath, file);
                    const mdContent = fs.readFileSync(mdPath, 'utf8');
                    
                    // Extract title from H1
                    const titleMatch = mdContent.match(/^\s*#\s+(.+?)\s*$/m);
                    const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '');
                    
                    // Extract date from markdown content
                    const dateMatch = mdContent.match(/\b(20\d{2}|19\d{2})[./-](\d{1,2})[./-](\d{1,2})\b/);
                    let date = '';
                    if (dateMatch) {
                        const [year, month, day] = [dateMatch[1], dateMatch[2].padStart(2, '0'), dateMatch[3].padStart(2, '0')];
                        date = `${year}-${month}-${day}`;
                    }
                    
                    // Create HTML filename (remove .md and add .html)
                    const htmlFile = file.replace('.md', '.html');
                    const mdKey = `${dir}/${file}`;
                    
                    return {
                        title: title,
                        link: `${dir}/${htmlFile}`,
                        basename: htmlFile,
                        mdKey: mdKey,
                        date: date
                    };
                });

            // Merge with existing posts (update existing, add new ones)
            const existingPosts = category.posts || [];
            const existingBasenames = new Set(existingPosts.map(p => p.link.split('/')[1]));
            
            const newPosts = files.filter(f => !existingBasenames.has(f.basename));
            
            if (newPosts.length > 0) {
                console.log(`📝 Found ${newPosts.length} new post(s) in ${dir}/: ${newPosts.map(p => p.title).join(', ')}`);
                
                // Add new posts to config
                category.posts = [...existingPosts, ...newPosts];
                
                // Add dates to file-dates.json
                newPosts.forEach(post => {
                    const defaultDate = new Date().toISOString().split('T')[0];
                    fileDates[post.mdKey] = post.date || defaultDate;
                });
                
                newPostsAdded = true;
            }
        });

        // Save updated config and dates
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        if (newPostsAdded) {
            fs.writeFileSync(datesPath, JSON.stringify(fileDates, null, 2));
            console.log('📅 Updated file-dates.json with new post dates');
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

        // Simple template rendering
        for (const [key, value] of Object.entries(data)) {
            const placeholder = `{{${key}}}`;
            template = template.replace(new RegExp(placeholder, 'g'), value);
        }

        // Handle arrays (like preloadImages)
        if (data.preloadImages && Array.isArray(data.preloadImages)) {
            const preloadPlaceholder = '{{#each preloadImages}}\n<link rel="preload" href="{{this}}" as="image">\n{{/each}}';
            const preloadHtml = data.preloadImages.map(img => 
                `<link rel="preload" href="${img}" as="image">`
            ).join('\n    ');
            template = template.replace(preloadPlaceholder, preloadHtml);
        }

        // Handle conditional blocks
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
    <link rel="stylesheet" href="styles/category.css">
</head>
<body>
    <header>
        <div class="brand-block">
            <a href="index.html" class="brand-title">${this.config.site.shortName || this.config.site.name}</a>
            <span class="brand-subtitle">${this.config.site.description}</span>
        </div>
        <nav class="tab-nav" aria-label="Categories">
            <a class="tab" href="index.html">All Posts</a>
            ${this.config.categories.map(cat => `<a class="tab" href="${cat.file}">${cat.title}</a>`).join('\n            ')}
        </nav>
        <div class="header-actions">
            <label for="postSearch" class="sr-only">Search posts</label>
            <input type="search" id="postSearch" class="search-input" placeholder="Search posts" aria-label="Search posts">
        </div>
    </header>
    <main class="container category-container" role="main">
        <h2>All Posts</h2>
        <ul id="postList" role="list">
            <!-- Posts will be injected here dynamically -->
        </ul>
        <nav class="pagination" role="navigation" aria-label="Pagination">
            <!-- Pagination will be rendered here by JavaScript -->
        </nav>
    </main>
    
    <footer>
        <p>&copy; ${this.config.site.year} ${this.config.site.name}. All rights reserved.</p>
    </footer>
    <script src="js/postTitleLoader.js"></script>
    <script src="js/config.js"></script>
    <script src="js/pagination.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', async function() {
            try {
                if (typeof SiteConfig !== 'function' || typeof Pagination !== 'function' || typeof loadPostsWithMarkdownMeta !== 'function') {
                    throw new Error('SiteConfig, Pagination, loadPostsWithMarkdownMeta 확인이 필요합니다.');
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
                const pagination = new Pagination('postList', sorted, paginationOptions.postsPerPage, paginationOptions);

                const searchInput = document.getElementById('postSearch');
                if (searchInput) {
                    searchInput.addEventListener('input', (event) => {
                        pagination.setFilter(event.target.value);
                    });
                }
            } catch (error) {
                document.getElementById('postList').innerHTML = '<li>Error loading posts.</li>';
                console.error('Failed to initialize home page:', error);
            }
        });
    </script>
</body>
</html>`;

        fs.writeFileSync('index.html', html);
        console.log('✅ Generated index.html');
    }

    generateCategoryPage(categoryId) {
        const category = this.config.categories.find(cat => cat.id === categoryId);
        if (!category) {
            throw new Error(`Category ${categoryId} not found`);
        }

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${category.description}">
    <meta name="keywords" content="${category.title}, Blog, Readmuch">
    <meta name="theme-color" content="#1e1e1e">
    <meta name="color-scheme" content="dark">

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

    <!-- Font loading -->
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- External CSS -->
    <link rel="stylesheet" href="styles/category.css">

</head>
<body>
    <header>
        <h1>${category.title} Category</h1>
        <p>${category.description}</p>
        
        <a href="index.html" aria-label="Back to Home">Back to Home</a>
        
    </header>

    <main class="category-container" role="main">
        <h2>${category.title} List</h2>
        <ul id="postList" class="post-list" role="list">
            <!-- ${category.title} items will be injected here dynamically -->
        </ul>
        <nav class="pagination" role="navigation" aria-label="Pagination">
            <button id="prevBtn" disabled aria-label="Previous page">Previous</button>
            <button id="nextBtn" aria-label="Next page">Next</button>
        </nav>
    </main>
    <footer>
        <p>&copy; ${this.config.site.year} ${this.config.site.name}. All rights reserved.</p>
    </footer>

    <script src="js/postTitleLoader.js"></script>
    <script src="js/config.js"></script>
    <script src="js/pagination.js"></script>
    <script>
        // Initialize category page
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
                const pagination = new Pagination('postList', sorted, paginationOptions.postsPerPage, paginationOptions);
            } catch (error) {
                document.getElementById('postList').innerHTML = '<li>Error loading posts.</li>';
                console.error('Failed to initialize category page:', error);
            }
        })();
    </script>
</body>
</html>`;

        fs.writeFileSync(category.file, html);
        console.log(`✅ Generated ${category.file}`);
    }

    generateAllPages() {
        console.log('🚀 Starting build process...');
        
        // Generate index page
        this.generateIndexPage();
        
        // Generate category pages
        this.config.categories.forEach(category => {
            this.generateCategoryPage(category.id);
        });
        
        console.log('🎉 Build completed successfully!');
    }

    watch() {
        console.log('👀 Watching for changes...');
        
        const watchPaths = [
            'config/site-config.json',
            'components/',
            'styles/',
            'js/'
        ];

        watchPaths.forEach(path => {
            fs.watch(path, { recursive: true }, (eventType, filename) => {
                console.log(`📝 Detected change in ${filename}`);
                this.generateAllPages();
            });
        });
    }
}

// CLI interface
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
