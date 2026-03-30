# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website for Alex Gonzalez, hosted on GitHub Pages at [alexgonzalez.ooo](http://alexgonzalez.ooo). It's a static HTML/CSS/JavaScript site with no build process—changes are deployed directly to the live site.

The site serves multiple purposes:
- **Portfolio showcase** (`portfolio/`) — professional work and creative projects
- **Active projects** (`projects/`) — ongoing development efforts
- **Experiments** (`experiments/`) — code explorations and prototypes
- **FPS Forest World** (`src/scripts/fps-world/`) — Interactive 3D exploration game (Three.js + Web Audio)
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

**Static Pages:**
- **Alpine.js** — Lightweight framework for adding interactivity without a build process
- **Custom modules**:
  - `lightbox-magic.js` — Image lightbox functionality
  - `global-nav.js` — Navigation behavior

**Interactive 3D (FPS World):**
The FPS Forest World (`src/scripts/fps-world/`) is a modular Three.js application with ES6 imports:
- **`world.js`** (32KB) — Main game loop, movement physics, audio synthesis, UI integration
- **`particles.js`** — Particle system for visual effects (bokeh background + floating dust)
- **`portals.js`** — Portal mechanics and proximity detection

Key architecture patterns:
- **ES6 module system** — Uses `import/export` with Three.js
- **Single animation loop** — `requestAnimationFrame` at ~60fps with capped delta time (50ms max)
- **Particle tracking** — Separate `activeParticles` array (capped at 200) to avoid O(n) scene filtering
- **Defensive error handling** — Try-catch around audio, delta validation, canvas size checks, WebGL context loss handling
- **Web Audio API** — Synthesized sounds (no audio files): jump chirp, landing tone, sprint whoosh, slide sound
- **Physics simulation** — Gravity, jump mechanics, double-jump, slide (camera height interpolation)
- **Failure fallback** — Graceful degradation if WebGL unavailable or loading fails

Loading flow: Hidden by default → WebGL check → Initialize (100% progress) → Show Start button → User click locks pointer → Game begins

No framework build (React, Vue, Svelte config exists but not actively used)

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

### Working with the FPS World
When modifying `src/scripts/fps-world/`:

1. **Local testing** — Open `index.html` in browser (use `python -m http.server 8000` for CORS)
2. **Module imports** — Always verify Three.js imports after updates (e.g., `PointerLockControls` path)
3. **Memory safety** — Keep particle count capped (MAX_PARTICLES = 200) to prevent bloat
4. **Physics tuning** — Constants at top: GRAVITY=25, JUMP_POWER=15, SPRINT_MULTIPLIER=1.5, SLIDE_SPEED_MULTIPLIER=2.0
5. **Audio synthesis** — Use Web Audio API (no external files). Test across browsers (iOS has audio restrictions)
6. **Error handling** — New features should validate inputs and handle failures gracefully (see `showFallbackError()`)

### Git Workflow
- Site auto-deploys to GitHub Pages on pushes to `main`
- Commit changes directly to `main` (changes are live immediately)
- No staging environment—test locally before committing
- The FPS World loads asynchronously, so game failures don't break the main site

## Technology Stack

**Portfolio & Static Pages:**
- **HTML5 / CSS3 / JavaScript** — Core technologies
- **Alpine.js** — Minimal JavaScript interactivity (no build step)
- **Tailwind CSS / PostCSS / Autoprefixer** — Configured but no build process
- **Plausible Analytics** — Lightweight analytics tracking
- **GitHub Pages** — Hosting and deployment

**FPS Forest World:**
- **Three.js** (r168) — 3D graphics and scene management
- **Web Audio API** — Synthesized sound effects
- **ES6 Modules** — Code organization (imported directly in `<script type="module">`)

## Key Design Principles

1. **Static-first**: Minimize JavaScript; prefer HTML and CSS
2. **No build process**: Changes should be deployable directly
3. **Responsive design**: Mobile-first CSS approach
4. **Consistency**: Use design system classes from `ag-design-system.css`
5. **Performance**: Lightweight scripts and external dependencies (Alpine, Plausible)
6. **Graceful degradation**: FPS World doesn't load on incompatible browsers; main site still works

## Performance & Reliability Patterns

**FPS World specifics:**
- **Particle capping** — Hard limit of 200 active particles prevents memory bloat from repeated gameplay
- **Efficient animation loop** — Delta time validated to prevent physics breakage on frame stutters
- **Resource cleanup** — All geometries/materials disposed on exit to prevent memory leaks
- **Context loss handling** — Gracefully handles WebGL context loss (GPU driver issues)
- **Audio error handling** — Web Audio failures don't crash the game; sounds degrade silently
- **Canvas validation** — Minimum dimensions (320x240) prevent edge case crashes

**Error patterns:**
- Try-catch around audio synthesis (browser policies vary)
- Null checks for DOM elements before manipulation
- Graceful fallback UI if game initialization fails
- Console warnings instead of silent failures

**Module loading:**
- FPS World loads as `<script type="module">` in main HTML
- WebGL check happens before initialization
- Failed loads show friendly error dialog with Retry button
- Doesn't break main site navigation if game fails

## Notes for Future Development

**General:**
- The `package.json` includes React Router and Cordova, but they're not currently used—these can be cleaned up if not needed
- If adding a build process (Tailwind compilation, minification), update this CLAUDE.md
- When adding new sections, follow the existing pattern: create a directory, add section-specific CSS, link from navigation
- Ensure all new pages include necessary meta tags (description, keywords) for SEO
- Links use relative paths—maintain directory structure consistency when adding new pages

**FPS World enhancements:**
- Physics constants are at the top of `world.js` for easy tuning
- New audio sounds should follow the existing synthesis pattern (no external audio files)
- Particle emitters must check `activeParticles.length` against `MAX_PARTICLES` before adding
- Performance-critical code: particle animation loop (every frame), delta time validation, scene cleanup on exit
- If adding new Three.js features: validate WebGL support, test context loss scenarios, implement proper resource disposal
- Mobile: FPS World intentionally disables on mobile (touch + pointer lock + camera controls don't work well)
- Browser compatibility: Test audio in Safari (requires user gesture), check WebGL context on older GPUs
