# Readmuch's Blog

Exploring the intersection of knowledge and creativity

## 🚀 Features

- **Modular Architecture**: Clean separation of concerns with reusable components
- **Responsive Design**: Mobile-first approach with modern CSS Grid and Flexbox
- **Performance Optimized**: Lazy loading, preloading, and efficient asset management
- **SEO Friendly**: Proper meta tags, Open Graph, and Twitter Card support
- **Analytics Integration**: GoatCounter for privacy-friendly visitor tracking
- **Build Automation**: Automated page generation and asset optimization

## 📁 Project Structure

```
readmuch.github.io/
├── components/           # Reusable HTML components
│   ├── header.html      # Site header template
│   ├── footer.html      # Site footer with analytics
│   └── head.html        # Common head section
├── config/              # Configuration files
│   └── site-config.json # Site settings and content data
├── js/                  # JavaScript modules
│   ├── config.js        # Configuration loader
│   ├── pagination.js    # Pagination functionality
│   └── analytics.js     # Analytics and visitor tracking
├── styles/              # Modular CSS architecture
│   ├── base.css         # CSS custom properties and base styles
│   ├── components.css   # Reusable UI components
│   ├── layout.css       # Layout and responsive design
│   ├── main.css         # Main page styles (imports modules)
│   └── category.css     # Category page styles (imports modules)
├── images/              # Static assets
├── Book/                # Book category posts
├── Education/           # Education category posts
├── Life/                # Lifestyle category posts
├── Tech/                # Technology category posts
├── MindNotes/           # Mind Notes category posts
├── build.js             # Build automation script
├── package.json         # Project dependencies and scripts
└── README.md           # This file
```

## 🛠️ Development

### Prerequisites

- Node.js 14.0.0 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/readmuch/readmuch.github.io.git
cd readmuch.github.io
```

2. Install dependencies:
```bash
npm install
```

### Development Commands

- **Build all pages**: `npm run build`
- **Development mode with watch**: `npm run dev`
- **Start local server**: `npm run serve`
- **Build and serve**: `npm start`

### Adding New Content

1. **Add a new post**: Add your HTML file to the appropriate category folder
2. **Update configuration**: Add the post to `config/site-config.json`
3. **Rebuild**: Run `npm run build` to regenerate pages

### Adding New Categories

1. **Update configuration**: Add category data to `config/site-config.json`
2. **Add category image**: Place image in `images/` folder
3. **Rebuild**: Run `npm run build` to generate new category page

## 🎨 Customization

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

### Analytics

Update GoatCounter settings in `config/site-config.json`:

```json
{
  "analytics": {
    "goatcounter": {
      "id": "your-goatcounter-id",
      "url": "https://your-id.goatcounter.com"
    }
  }
}
```

## 📊 Analytics

This site uses [GoatCounter](https://www.goatcounter.com/) for privacy-friendly analytics:

- No cookies or personal data collection
- GDPR compliant
- Real-time visitor statistics
- Page view tracking

## 🔧 Build Process

The build script (`build.js`) automates:

- **Template Rendering**: Generates HTML from reusable components
- **Configuration Management**: Loads site settings from JSON
- **Asset Optimization**: Handles preloading and resource management
- **Page Generation**: Creates all pages from templates and data

## 📱 Responsive Design

- **Mobile-first**: Optimized for mobile devices
- **CSS Grid**: Modern layout system for desktop
- **Flexbox**: Flexible component layouts
- **Media Queries**: Breakpoints at 768px and 480px

## 🚀 Performance

- **Lazy Loading**: Images load only when needed
- **Preloading**: Critical assets loaded early
- **Minimal JavaScript**: Lightweight, modular JS
- **Optimized CSS**: Modular architecture with efficient selectors

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run build`
5. Submit a pull request

---

Built with ❤️ by Readmuch
