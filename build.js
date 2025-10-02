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

    async init() {
        // Load configuration
        const configPath = path.join(__dirname, 'config', 'site-config.json');
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Load templates
        await this.loadTemplates();
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
        const headData = {
            description: this.config.site.description,
            keywords: 'Book, Education, Technology, Life, Mindnotes',
            ogTitle: this.config.site.name,
            ogDescription: this.config.site.description,
            ogUrl: this.config.site.url,
            twitterTitle: this.config.site.name,
            twitterDescription: this.config.site.description,
            pageTitle: this.config.site.name,
            cssFile: 'styles/main.css',
            preloadImages: this.config.categories.map(cat => cat.image)
        };

        const headerData = {
            title: this.config.site.name,
            subtitle: this.config.site.description,
            showBackLink: false
        };

        const head = this.renderTemplate('head', headData);
        const header = this.renderTemplate('header', headerData);
        const footer = this.renderTemplate('footer', {});

        // Generate category cards
        const categoryCards = this.config.categories.map(category => `
        <article class="card">
            <a href="${category.file}" aria-label="${category.title} Category">
                <img src="${category.image}" alt="${category.alt}" loading="lazy" width="300" height="220" decoding="async">
                <span>${category.title}</span>
            </a>
        </article>`).join('\n        ');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    ${head}
</head>
<body>
    ${header}
    <main class="container" role="main" aria-label="Blog Categories">
        ${categoryCards}
    </main>
    ${footer}
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

        const headData = {
            description: category.description,
            keywords: `${category.title}, Blog, Readmuch`,
            ogTitle: `${category.title} Category - ${this.config.site.name}`,
            ogDescription: category.description,
            ogUrl: `${this.config.site.url}/${category.file}`,
            twitterTitle: `${category.title} Category - ${this.config.site.name}`,
            twitterDescription: category.description,
            pageTitle: `${category.title} Category - ${this.config.site.name}`,
            cssFile: 'styles/category.css',
            preloadImages: []
        };

        const headerData = {
            title: `${category.title} Category`,
            subtitle: category.description,
            showBackLink: true
        };

        const head = this.renderTemplate('head', headData);
        const header = this.renderTemplate('header', headerData);
        const footer = this.renderTemplate('footer', {});

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    ${head}
</head>
<body>
    ${header}
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
    ${footer}
    <script src="js/config.js"></script>
    <script src="js/pagination.js"></script>
    <script>
        // Initialize category page
        (async function() {
            const config = new SiteConfig();
            await config.load();
            
            const category = config.getCategory('${categoryId}');
            const pagination = new Pagination('postList', category.posts, ${this.config.pagination.postsPerPage});
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
