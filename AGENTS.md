# AGENTS.md

## Project

Single-file browser Asteroids clone. No frameworks, no bundler, no dependencies.

- `index.html` — entry point, loads `game.js`
- `game.js` — all game logic (~420 lines, ES6 classes, strict mode)
- Canvas size: 800x600

## Run

Open `index.html` in a browser, or:
```
npx serve .
```

## Key conventions

- Language: UI text and comments are in **Spanish** (e.g. `NIVEL`, `PUNTAJE`, `ESPACIO PARA REINICIAR`).
- Everything is in a single global scope in `game.js` (no modules, no imports).
- Game states: `'playing'`, `'dead'`, `'gameover'` — check `state` before adding features.
- All entities use a `.dead` flag pattern for lifecycle; filter dead entities each frame.
- `wrap()` is used for toroidal world wrapping — reuse it for new moving objects.
- Canvas context (`ctx`) and dimensions (`W`, `H`) are module-level constants — use them directly.
