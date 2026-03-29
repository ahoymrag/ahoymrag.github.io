# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website for Alex Gonzalez, hosted on GitHub Pages at [alexgonzalez.ooo](http://alexgonzalez.ooo). It's a static HTML/CSS/JavaScript site with no build process—changes are deployed directly to the live site.

The site serves multiple purposes:
- **Portfolio showcase** (`portfolio/`) — professional work and creative projects
- **Active projects** (`projects/`) — ongoing development efforts
- **Experiments** (`experiments/`) — code explorations and prototypes
- **Content galleries** — photography, writing, teaching materials
- **Teaching portfolio** — credentials and teaching-related work

## Architecture & File Organization

### Directory Structure
- **Root HTML files** — Main entry points (`index.html`, `teaching.html`, `teaching-credentials.html`, `stem.html`)
- **`src/`** — Shared CSS, JavaScript utilities, and assets used across the site
  - `css/` — Global and section-specific stylesheets
  - `scripts/` — Lightweight JavaScript modules (lightbox, navigation)
  - `assets/` — Images, icons, and other media
- **`portfolio/`** — Portfolio section with its own internal structure
  - `src/` — Portfolio-specific stylesheets and components
  - `2024portfolio/`, `cvResume/`, etc. — Subsections
- **`projects/`** — Active projects, each as a subdirectory
- **`experiments/`** — Experimental ideas and code explorations
- **`gallery/`, `photography/`, `writing/`** — Content galleries

### Styling System
- **Design system**: `ag-design-system.css` — Core design tokens and component styles
- **Section-specific CSS**: Each major section (portfolio, teaching, VR, etc.) has its own stylesheet
- **Global CSS**: `src/css/super-global.css` — Site-wide utilities and resets
- **Responsive design**: Uses viewport meta tags and mobile-first CSS

The site uses Tailwind CSS (in dependencies) and PostCSS with Autoprefixer configured, but there's no build step—CSS is handwritten and included directly in HTML.

### JavaScript
- **Alpine.js** — Lightweight framework for adding interactivity without a build process
- **Custom modules**:
  - `lightbox-magic.js` — Image lightbox functionality
  - `global-nav.js` — Navigation behavior
- No framework build (React, Vue, Svelte config exists but not actively used)

## Common Development Tasks

### Viewing Changes
Since this is a static site, changes to HTML, CSS, or JavaScript are immediately visible when you refresh the browser. No build step is needed.

**Local testing:**
- Open HTML files directly in a browser, or
- Use a local server: `python -m http.server 8000` (or similar)

### Adding Content
1. **Create new HTML file** in the appropriate directory
2. **Link stylesheets** from `src/css/` or create section-specific CSS
3. **Use existing components** from `ag-design-system.css` for consistency
4. **Include Alpine.js** in the `<head>` if you need interactivity

### Updating Styles
- Modify existing CSS files directly (no compilation)
- Add new section-specific stylesheets as needed
- Keep global styles in `super-global.css` or section files

### Git Workflow
- Site auto-deploys to GitHub Pages on pushes to `main`
- Commit changes directly to `main` (changes are live immediately)
- No staging environment—test locally before committing

## Technology Stack

- **HTML5 / CSS3 / JavaScript** — Core technologies
- **Alpine.js** — Minimal JavaScript interactivity (no build step)
- **Tailwind CSS / PostCSS / Autoprefixer** — Configured but no build process
- **Plausible Analytics** — Lightweight analytics tracking
- **GitHub Pages** — Hosting and deployment

## Key Design Principles

1. **Static-first**: Minimize JavaScript; prefer HTML and CSS
2. **No build process**: Changes should be deployable directly
3. **Responsive design**: Mobile-first CSS approach
4. **Consistency**: Use design system classes from `ag-design-system.css`
5. **Performance**: Lightweight scripts and external dependencies (Alpine, Plausible)

## Notes for Future Development

- The `package.json` includes React Router and Cordova, but they're not currently used—these can be cleaned up if not needed
- If adding a build process (Tailwind compilation, minification), update this CLAUDE.md
- When adding new sections, follow the existing pattern: create a directory, add section-specific CSS, link from navigation
- Ensure all new pages include necessary meta tags (description, keywords) for SEO
- Links use relative paths—maintain directory structure consistency when adding new pages
