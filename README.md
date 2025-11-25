# Readmuch's Blog

Exploring the intersection of knowledge and creativity

## Features
- Modular architecture with reusable components
- Responsive design using modern CSS Grid and Flexbox
- Performance optimizations with lazy loading and preloading
- SEO-friendly metadata (Open Graph, Twitter Cards)
- Build automation for generating pages

## Project Structure
- components/: shared HTML pieces (`header.html`, `footer.html`, `head.html`)
- config/: configuration files (`site-config.json`)
- js/: client-side modules (`config.js`, `pagination.js`)
- styles/: modular CSS (`base.css`, `components.css`, `layout.css`, `main.css`, `category.css`)
- images/: static assets
- Book/, Education/, Life/, Tech/, MindNotes/: category posts
- build.js: build automation script
- package.json: project dependencies and scripts
- README.md: project overview

## Development

### Prerequisites
- Node.js 14.0.0 or higher
- npm or yarn

### Installation
```bash
git clone https://github.com/readmuch/readmuch.github.io.git
cd readmuch.github.io
npm install
```

### Development Commands
- Build all pages: `npm run build`
- Development mode with watch: `npm run dev`
- Start local server: `npm run serve`
- Build and serve: `npm start`

### Adding New Content
1. Add your HTML file to the appropriate category folder.
2. Add the post entry to `config/site-config.json`.
3. Run `npm run build` to regenerate pages.

### Adding New Categories
1. Add category data to `config/site-config.json`.
2. Place the category image in `images/`.
3. Run `npm run build` to generate the new category page.

## Customization

### Colors and Theme
Edit CSS custom properties in `styles/base.css`:

```css
:root {
    --background-color: #1e1e1e;
    --accent-color: #4a9eff;
    --text-color: #ffffff;
    /* ... more variables */
}
```

## Build Process
The build script (`build.js`) automates:
- Template rendering from reusable components
- Configuration management via JSON
- Asset preloading setup
- Page generation for all categories

## Responsive Design
- Mobile-first layout
- CSS Grid for desktop layouts
- Flexbox for flexible components
- Media queries at 768px and 480px breakpoints

## Performance
- Lazy-loaded images
- Preloaded critical assets
- Lightweight, modular JavaScript
- Optimized, modular CSS

## License
MIT License - see LICENSE for details

## Contributing
1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test with `npm run build`.
5. Submit a pull request.

---

Built with love by Readmuch
