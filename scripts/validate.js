const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'config', 'site-config.json');

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

    if (!process.exitCode) {
        console.log('Validation completed successfully.');
    }
}

main();
