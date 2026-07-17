# English Coupon App

A browser-based English learning app for children. It currently includes an
**Alphabet Goal Challenge**, an **Alphabet Ninja** falling-letter game, and an
**A1 Listening Treasure Hunt** assessment.

## Requirements

- Node.js 20.19 or newer (Node.js 22.12+ is also supported)
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

The production files are written to `dist/`. To preview that build locally:

```bash
npm run preview
```

## Current functionality

- Responsive start screen and football-themed Activity 1
- Animated dog football player who kicks with the ball
- Three randomly selected letter goals per round
- Spoken English instructions using the browser's speech synthesis API
- Correct/incorrect feedback, animation, score, and progress display
- Completion screen after ten correct answers
- Text fallback when speech synthesis is unavailable
- Activity 2 with falling letters, spoken targets, scoring, lives, and increasing speed
- Activity 3 with eight A1 listening questions, replayable audio, and visual answers
- Final listening score and a printable-style completion coupon

## Project structure

```text
src/
  main.js                         App entry point and start screen
  style.css                       Global styles
  styles/                         Shared button and design styles
  activities/activity1/
    activity1.js                  Alphabet Goal game logic
    activity1.css                 Alphabet Goal presentation and animation
  activities/activity2/
    activity2.js                  Alphabet Ninja game logic
    activity2.css                 Falling letters and game presentation
  activities/activity3/
    activity3.js                  A1 listening assessment logic and questions
    activity3.css                 Treasure hunt and coupon presentation
```

## Deployment note

Vite's base path is configured as `/englishcoupon/` in `vite.config.js`. This is
appropriate when the deployed site is served from that subdirectory. Change the
base setting if the hosting location uses a different path.

## Browser notes

Speech voice and pronunciation vary by device and browser. Audio may require a
user interaction before playback, which is why the game begins after pressing
**Start Game**. If speech synthesis is not supported, the target letter is shown
as text so the activity remains usable.

## Planned work

Future work can add saved progress, teacher reports, and more question sets.
