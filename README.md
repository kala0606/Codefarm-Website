# CODEFARM — Computational Art & Digital Fabrication Residency

A brutalist, generative website for Codefarm residency featuring interactive triangulated navigation and Game of Life + Delaunay triangulation animations.

## Features

- **Generative Logo**: Animated Game of Life simulation with Delaunay triangulation and smooth morphing
- **Interactive Navigation**: Click navigation items to trigger organic triangulated mesh expansions that reveal content sections
- **RGB Gradient Accents**: Glowing RGB gradient lines that cycle through the spectrum
- **Application Form**: Integrated Google Sheets form submission system
- **Brutalist Design**: Black and white aesthetic with geometric typography

## Tech Stack

- Vanilla JavaScript
- p5.js for canvas rendering
- Delaunator library for triangulation
- Google Apps Script for form submissions
- Fira Code font

## Setup

1. Clone the repository
2. Open `index.html` in a browser or serve with a local server:
   ```bash
   python3 -m http.server 8888
   ```
3. For form submissions, set up Google Sheets integration (see `GOOGLE_SHEETS_SETUP.md`)

## Project Structure

```
Codefarm-Website/
├── index.html              # Main website
├── css/
│   └── style.css          # Brutalist styling
├── js/
│   ├── main.js            # Navigation and interactions
│   ├── triangulate.js     # Game of Life + Delaunay engine
│   └── form.js            # Form submission handler
├── img/                    # Content images
├── logo/                   # Original generative logo project
├── google-apps-script.js    # Google Sheets integration
└── GOOGLE_SHEETS_SETUP.md  # Setup instructions
```

## Configuration

### Google Sheets Integration

1. Follow instructions in `GOOGLE_SHEETS_SETUP.md`
2. Update `index.html` with your Google Apps Script Web App URL (line ~352)
3. Update `google-apps-script.js` with your Spreadsheet ID (line ~18)

## License

© 2026 Codefarm
