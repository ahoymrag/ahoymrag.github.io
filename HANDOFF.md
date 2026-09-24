# Agent Handoff & Session History

**Repository:** `ahoymrag/ahoymrag.github.io`  
**Live Site:** [alexgonzalez.ooo](http://alexgonzalez.ooo)  
**Last Updated:** September 23, 2026  
**Audience:** Incoming AI Agents (Codex, Antigravity, Claude, etc.) and Human Collaborators

---

## 1. Executive Summary of Recent Work

In this session, we executed a major visual and content overhaul across the portfolio website, establishing the **Elm City Motion (ECM)** aesthetic site-wide, integrating new Behind-the-Scenes (BTS) photography, curating project pages, and cleaning up UI elements per direct user feedback.

### Key Accomplishments:
1. **Established the Elm City Motion B&W Aesthetic**:
   - Converted batches of raw production and venue photography into high-contrast monochrome (panchromatic tone curve, 1.15x-1.18x contrast, 1.1x sharpness).
   - Created fixed background layers (`.ecm-bg-layer`) with dark linear gradients and procedural SVG film grain noise overlays (`.ecm-grain-overlay`).
   - Integrated smooth auto-rotation timers (with `prefers-reduced-motion` safety checks) on the Homepage, Portfolio Gateway, and 2026 Showcase.
2. **Curated *Creatures in the Tall Grass* Project Page**:
   - Stripped all coffee / Koffee? / Elm City Motion references from `creatures-in-the-tall-grass.html` so it remains exclusively focused on the film production.
   - Removed **all** `<figcaption>` captions from both the film stills grid and the behind-the-scenes grid.
   - Built an interactive hero switcher with 9 clickable pills (`01 Marsh Road` through `09 Trail`).
   - Built a responsive CSS grid (`detail.css`) for 9 BTS figures with an alternating 2-up and 3-up rhythm that stacks cleanly to single-column on mobile screens.
3. **Explicit Photo Curation & Removal**:
   - Removed the NYC street photo featuring a girl, luggage cart, and U-Haul trailer outside The Michelangelo hotel (`citg-bts-05-uhaul-prep.jpg`) across all pages, arrays, and directories.
4. **Local Development & Preview Environment**:
   - Maintained an active local HTTP server (`python3 -m http.server 8000 --bind 127.0.0.1`).
   - Built an interactive Tailwind-based iframe preview tool (`site_preview.html`).

---

## 2. Active Image Pools & File Structure

All production assets are static and stored directly in the repository:

### A. *Creatures in the Tall Grass* BTS Photography (9 Active Images)
Location: `portfolio/2025-2026portfolio/portfolio-content/creatures-bts/` and `src/assets/creatures-bts/`

| Filename | Description | Active In |
|---|---|---|
| `citg-bts-01-desk-rig.jpg` | RED Komodo camera rig with feather creature puppet on desk | CITG page, 2026 Showcase, Site backgrounds |
| `citg-bts-02-marsh-road.jpg` | Shoulder rig looking down Branford marsh road with 2 actors | CITG page (default hero), 2026 Showcase, Backgrounds |
| `citg-bts-03-tripod-field.jpg` | Camera on tripod positioned in tall marsh grass | CITG page, 2026 Showcase, Backgrounds |
| `citg-bts-04-crew-pizza.jpg` | Alex and collaborator during screenplay review with pizza | CITG page, 2026 Showcase, Backgrounds |
| `citg-bts-06-field-walk.jpg` | Alex trekking through meadow field with production pack | CITG page, 2026 Showcase, Backgrounds |
| `citg-bts-07-attic-rafters.jpg` | Attic rafter location setup with work light & crew | CITG page, 2026 Showcase, Backgrounds |
| `citg-bts-08-interior-camera.jpg` | Operating camera rig on slider shooting interior window scene | CITG page, 2026 Showcase, Backgrounds |
| `citg-bts-09-woods-thumbsup.jpg` | Alex giving thumbs up in woods canopy | CITG page, 2026 Showcase, Backgrounds |
| `citg-bts-10-field-trail.jpg` | Alex on meadow trail overlooking production valley | CITG page, 2026 Showcase, Backgrounds |

> **PERMANENT EXCLUSION**: `citg-bts-05-uhaul-prep.jpg` (girl + luggage cart + pickup truck / trailer in NYC) was explicitly rejected by the user. **DO NOT re-add this image to any rotation or gallery.**

### B. Elm City / Koffee? Stills (5 Active Images)
Location: `portfolio/2025-2026portfolio/portfolio-content/creatures-bts/` and `src/assets/creatures-bts/`

| Filename | Description | Active In |
|---|---|---|
| `ecm-koffee-01-interior.jpg` | Cafe interior seating, tables, and chalkboard | Site background pools ONLY |
| `ecm-koffee-02-counter.jpg` | Espresso counter, pastry display, and menu boards | Site background pools ONLY |
| `ecm-koffee-03-espresso.jpg` | Commercial espresso machine group head extraction | Site background pools ONLY |
| `ecm-koffee-04-cup.jpg` | Close-up of coffee cup & saucer on table | Site background pools ONLY |
| `ecm-koffee-05-sticker.jpg` | Koffee? vintage bumper sticker / logo decal | Site background pools ONLY |

> **IMPORTANT**: These 5 coffee images belong **ONLY** in general site background rotations (`index.html`, `portfolio/portfolio-index.html`, `portfolio/2025-2026portfolio/index.html`). They must **NEVER** be placed on the *Creatures in the Tall Grass* project page (`creatures-in-the-tall-grass.html`).

### C. Alex Gonzalez Portraits (2 Active Images)
Location: `portfolio/2025-2026portfolio/portfolio-content/creatures-bts/` and `src/assets/creatures-bts/`

| Filename | Description | Active In |
|---|---|---|
| `ag-portrait-beach.jpg` | Alex standing in the sunset tide on the beach holding shoes | Site background pools ONLY |
| `ag-portrait-childhood.jpg` | Young Alex as a toddler in space pajamas and purple overalls | Site background pools ONLY |

### D. Film Stills (6 PNG Stills)
Location: `portfolio/2025-2026portfolio/portfolio-content/creatures-stills/`
- `CREATURES-STILL-A-1.png` through `CREATURES-STILL-A-6.png`

---

## 3. Page Architecture & State

### 1. `index.html` (Homepage)
- **Background Layer**: `#ecm-bg` (`.ecm-bg-layer`) and `.ecm-grain-overlay`.
- **Image Pool**: Array of 16 images (9 CITG BTS + 5 Coffee + 2 Portraits).
- **Behavior**: Picks a random background on load, transitions smoothly every 10 seconds if `prefers-reduced-motion` is false.
- **Components**: Welcome overlay / modal, Curriculum panel, link to FPS Forest World, portfolio links.

### 2. `portfolio/portfolio-index.html` (Portfolio Gateway)
- **Background Layer**: `#ecm-bg` (`.ecm-bg-layer`) and `.ecm-grain-overlay`.
- **Image Pool**: Array of 16 images (9 CITG BTS + 5 Coffee + 2 Portraits).
- **Behavior**: Random background on load, cycles every 10 seconds.
- **Navigation**: Year links for `2026`, `2024-2025`, and `2023 and Before`.

### 3. `portfolio/2025-2026portfolio/index.html` (2026 Showcase Index)
- **Background Layer**: `#ecm-bg` with cycling script (14 images).
- **Film Stills Section (`#film-stills`)**: Interactive modal grid with buttons for the 6 film stills and 9 CITG BTS photos. Clicking opens high-res modal (`#gallery-modal`).
- **Thumbnail Badges**: Dedicated CSS classes for logos (`cpc-app-logo`, `prompt-logo`, `pathr-logo`, `ahoy-logo-thumb`).

### 4. `portfolio/2025-2026portfolio/creatures-in-the-tall-grass.html` (Creatures Project Page)
- **Hero Section**: Fixed background initialized to `citg-bts-02-marsh-road.jpg`.
- **Pill Switcher**: 9 buttons (`01 Marsh Road` to `09 Trail`). Clicking switches hero background dynamically and toggles the `.is-active` class.
- **Grids**:
  - `#stills`: 6 film stills, strictly captionless (`<figure><img ...></figure>`).
  - `#bts`: 9 production stills, strictly captionless (`<figure><img ...></figure>`).
- **No Coffee**: Contains zero coffee or Elm City Motion text/images.

### 5. `portfolio/2025-2026portfolio/detail.css` (Detail Stylesheet)
- Defines `.film-page`, `.ecm-bg-layer`, `.ecm-grain-overlay`, `.bg-pills`, and `.bg-pill`.
- `.bts-grid` rules:
  - Figures 1, 2, 6, 7, 8, 9: `grid-column: span 6;` (2 across).
  - Figures 3, 4, 5: `grid-column: span 4;` (3 across).
  - Media query `@media (max-width: 700px)`: All figures collapse to `grid-column: span 12;`.

---

## 4. Strict Conventions for Future Agents

1. **Static-First & Zero Build Process**:
   - There is no Webpack, Vite, or Gulp build step. Edit HTML, CSS, and JS files directly.
   - Do not add build scripts or package bundlers without explicit user approval.
2. **Zero Captions on Film Grids**:
   - The user requested complete removal of captions (`<figcaption>`) from film stills and BTS grids. Keep these elements purely visual.
3. **Black and White Film Aesthetic**:
   - Any new photograph introduced to background pools or film sections must be converted to B&W with punchy contrast and film grain compatibility.
4. **Strict Isolation of Client / Project Work**:
   - Project pages (such as *Creatures in the Tall Grass*) must stay focused on their subject matter. Do not leak unrelated client images (like coffee shop stills) into narrative film pages.
5. **Local Testing & Server Commands**:
   - Use `python3 -m http.server 8000 --bind 127.0.0.1` for local testing.
   - Do NOT run system `open` or browser launching commands directly in sandboxed environments as they return error `-54`. Instead, provide the local URL (`http://127.0.0.1:8000/`) and use iframe-based preview widgets.
6. **Git Workflow**:
   - Commits go directly to `main` for deployment via GitHub Pages. Always verify changes locally before pushing.

---

## 5. Potential Future Work & Open Ideas

- **FPS Forest World Integration**: `src/scripts/fps-world/` contains the Three.js 3D forest experience. Future iterations may bridge web portfolio navigation with in-game portals.
- **Mobile Touch Refinements**: Continue monitoring grid and pill wrap behaviors across small mobile viewports (e.g., iPhone SE at 375px width).
- **Lightbox / Zoom Enhancement**: The 2026 showcase has a gallery modal; a lightweight pinch-to-zoom or swipe lightbox for mobile users could be explored if requested.
