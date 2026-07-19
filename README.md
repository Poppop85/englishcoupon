# Luksong Baka

A simple, mobile-friendly jumping game inspired by the traditional Filipino
game Luksong Baka. The player completes ten successful jumps and receives one
randomly selected inspirational message on the finishing screen.

## Requirements

- Node.js 20.19 or newer
- npm
- A modern browser with JavaScript enabled

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite. The development server automatically
reloads the page when source files change.

## Build for production

```bash
npm run build
```

The production files are written to `dist/`. To preview the build locally:

```bash
npm run preview
```

## Current functionality

- Automatic obstacle movement
- Large touch-friendly jump button
- Space and Up Arrow keyboard controls
- Jump animation and collision detection
- Clear success and retry feedback
- Ten successful jumps to finish
- One random inspirational message on completion
- Responsive layout for phones and desktop browsers

## Project structure

```text
src/
  main.js                         App entry point
  style.css                       Global styles
  styles/                         Shared button styles
  activities/activity4/
    activity4.js                  Luksong Baka game logic and messages
    activity4.css                 Game presentation and animation
```

## Deployment note

Vite's base path is configured in `vite.config.js`. Update it if the deployed
site uses a different subdirectory.
