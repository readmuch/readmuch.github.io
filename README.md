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
- Build all pages: `node build.js`
- Alternative build command: `npm run build`
- Development mode with watch: `npm run dev`
- Start local server: `npm run serve`
- Build and serve: `npm start`

### 신규 MD 작성 규칙
신규 포스팅을 만들 때는 아래 규칙을 지켜주세요.

1. 파일은 카테고리 폴더(`Book`, `Education`, `Life`, `Tech`, `MindNotes`) 안에 생성합니다.
2. 파일명은 반드시 `YYYY-MM-DD_파일이름.md` 형식으로 작성합니다.
3. 파일 맨 위에는 반드시 front matter를 넣고, `title`, `date`, `tags`를 직접 입력합니다.
4. `date`는 반드시 `YYYY-MM-DD` 형식으로 입력합니다.
5. `tags`는 배열 형식으로 입력합니다. 예: `tags: [ai, 커리어]`
6. 본문 제목이 있더라도 목록/정렬/메타데이터 기준은 front matter 값이므로, 수정이 필요하면 front matter를 수정합니다.
7. 새 글을 추가하거나 메타데이터를 바꾼 뒤에는 반드시 `node build.js`를 실행합니다.

예시:
```md
---
title: OpenAI 입사에서 배운 6가지
date: 2026-01-11
tags: [ai, 커리어]
---

# OpenAI 입사에서 배운 6가지

본문...
```

주의사항:
- 공개 링크는 MD 파일명을 기준으로 생성되므로, 파일명을 바꾸면 링크도 함께 바뀝니다.
- 기존 글의 링크를 유지해야 한다면 파일명 변경은 신중하게 진행해야 합니다.
- `npm run build`가 PowerShell 환경에서 막히면 `node build.js`를 사용하면 됩니다.

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
- Category post discovery from Markdown files
- Configuration synchronization via JSON
- Post date parsing from Markdown front matter
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
