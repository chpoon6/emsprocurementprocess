# EMS Hardware Procurement Interactive App

Repository-ready package for the interactive EMS hardware procurement workflow.

## What changed

- Split the original single HTML file into a maintainable structure:
  - `index.html` for semantic page structure
  - `css/styles.css` for presentation
  - `js/data.js` for process, edge, owner, and role data
  - `js/app.js` for rendering and interaction logic
- Improved experience polish:
  - clearer page hierarchy and control labels
  - reset selection control
  - keyboard access for process nodes
  - skip link for accessibility
  - improved owner directory persistence
  - refined route label placement
- Cleaned code:
  - removed repeated inline owner-directory HTML from the base document
  - centralized owner role data
  - added HTML escaping before dynamic rendering
  - grouped rendering, interaction, filtering, and validation functions

## File structure

```text
ems-hardware-procurement-app-package/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   └── data.js
├── README.md
└── CHANGELOG.md
```

## How to run locally

Open `index.html` directly in a browser. No build step and no external dependencies are required.

For repository upload, commit the full folder. GitHub Pages, Azure Static Web Apps, or any static web host can serve it as-is.

## Notes for future maintenance

- Update process steps in `js/data.js` only.
- Keep visual styling in `css/styles.css`.
- Keep behavior and rendering logic in `js/app.js`.
- If adding new owner groups, add them to `ownerRoles` in `js/data.js` so the owner directory remains complete.
