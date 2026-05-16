const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'site-config.json');
const GENERATED_POSTS_PATH = path.join(ROOT, 'config', 'generated-posts.json');
const GENERATED_DATA_PATH = path.join(ROOT, 'js', 'generated-data.js');

const TEXT_FILES_TO_SCAN = [
    'build.js',
    'README.md',
    'templates/home.html',
    'templates/category.html',
    'templates/post.html',
    'post.html'
];

const HTML_FILES_TO_SCAN = [
    'index.html',
    'book.html',
    'education.html',
    'life.html',
    'tech.html',
    'mindnotes.html',
    'games.html',
    'post.html',
    'templates/home.html',
    'templates/category.html',
    'templates/post.html'
];

const MOJIBAKE_PATTERNS = [
    /\?쎄/,
    /\?ㅻ/,
    /\?뱀/,
    /湲/,
    /蹂몃/,
    /諛곗/,
    /梨낆/,
    /쨌/
];

function readJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function decodeBuffer(buffer) {
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

function parseFrontMatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) return {};

    const attributes = {};
    match[1].split(/\r?\n/).forEach(line => {
        const metaMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (metaMatch) attributes[metaMatch[1]] = metaMatch[2].trim();
    });
    return attributes;
}

function fail(message) {
    console.error(`ERROR: ${message}`);
    process.exitCode = 1;
}

function readTextIfExists(relativePath) {
    const filePath = path.join(ROOT, relativePath);
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '') : '';
}

function validateNoMojibake() {
    TEXT_FILES_TO_SCAN.forEach(relativePath => {
        const content = readTextIfExists(relativePath);
        MOJIBAKE_PATTERNS.forEach(pattern => {
            if (pattern.test(content)) {
                fail(`${relativePath} contains likely mojibake text matching ${pattern}.`);
            }
        });
    });
}

function validateReferencedIconsExist() {
    HTML_FILES_TO_SCAN.forEach(relativePath => {
        const content = readTextIfExists(relativePath);
        const iconLinks = content.matchAll(/<link\b[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi);

        for (const match of iconLinks) {
            const href = match[1].split('?')[0];
            if (/^(https?:)?\/\//.test(href) || href.startsWith('data:')) continue;
            const iconPath = path.join(ROOT, href);
            if (!fs.existsSync(iconPath)) {
                fail(`${relativePath} references missing icon asset: ${href}`);
            }
        }
    });
}

function validateGeneratedDataIsMetadataOnly() {
    if (!fs.existsSync(GENERATED_DATA_PATH)) return;

    const content = fs.readFileSync(GENERATED_DATA_PATH, 'utf8');
    if (content.includes('__POST_MARKDOWN__') || content.includes('postMarkdown')) {
        fail('js/generated-data.js should not embed full Markdown post bodies.');
    }
}

function validatePostDataFiles() {
    if (!fs.existsSync(GENERATED_POSTS_PATH)) return;

    const generatedPosts = readJSON(GENERATED_POSTS_PATH);
    (generatedPosts.categories || []).forEach(category => {
        (category.posts || []).forEach(post => {
            if (!post.source || !post.link || !post.link.startsWith('post.html?src=')) return;
            if (!post.dataFile) {
                fail(`${post.source} is missing generated post dataFile.`);
                return;
            }

            const dataPath = path.join(ROOT, post.dataFile);
            if (!fs.existsSync(dataPath)) {
                fail(`${post.source} references missing post data file: ${post.dataFile}`);
                return;
            }

            const content = fs.readFileSync(dataPath, 'utf8');
            if (!content.includes(post.source) || !content.includes('__POST_DATA__')) {
                fail(`${post.dataFile} does not contain loadable post data for ${post.source}.`);
            }
        });
    });
}

function main() {
    const config = readJSON(CONFIG_PATH);

    if (!config.site?.name) fail('config.site.name is required.');
    if (!Array.isArray(config.categories) || config.categories.length === 0) {
        fail('config.categories must contain at least one category.');
        return;
    }

    config.categories.forEach(category => {
        ['id', 'title', 'description', 'image', 'file', 'dir'].forEach(field => {
            if (!category[field]) fail(`Category ${category.id || '(unknown)'} is missing ${field}.`);
        });

        const imagePath = path.join(ROOT, category.image || '');
        if (!fs.existsSync(imagePath)) fail(`Missing image for ${category.id}: ${category.image}`);

        const categoryPath = path.join(ROOT, category.dir || '');
        if (!fs.existsSync(categoryPath)) {
            fail(`Missing category directory for ${category.id}: ${category.dir}`);
            return;
        }

        fs.readdirSync(categoryPath)
            .filter(file => file.endsWith('.md'))
            .forEach(file => {
                const mdPath = path.join(categoryPath, file);
                const content = decodeBuffer(fs.readFileSync(mdPath));
                const frontMatter = parseFrontMatter(content);
                const label = `${category.dir}/${file}`;

                if (!frontMatter.title) fail(`${label} is missing front matter title.`);
                if (!frontMatter.date) fail(`${label} is missing front matter date.`);
                if (frontMatter.date && !/^\d{4}-\d{2}-\d{2}$/.test(frontMatter.date)) {
                    fail(`${label} has invalid date format: ${frontMatter.date}`);
                }
            });
    });

    validateNoMojibake();
    validateReferencedIconsExist();
    validateGeneratedDataIsMetadataOnly();
    validatePostDataFiles();

    if (!process.exitCode) {
        console.log('Validation completed successfully.');
    }
}

main();
