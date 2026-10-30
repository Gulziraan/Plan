# Hasan — Chapter 23

A responsive, static birthday storytelling website. No backend, build step, framework, or third-party runtime dependency is required.

## Run locally

Open `index.html` in a modern browser, or serve this folder with any static server. The standalone `Hasan-Birthday-Preview.html` version can also be opened directly; it contains the HTML, CSS, content configuration and JavaScript in one file.

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Personalise the content

- `content.js` — all editable content: character profile and attributes, special abilities, passive skills, weakness and superpower, personal notes, reasons envelopes, mini-game choices/reactions, quiz questions, memory captions and messages, five-senses copy, media paths, and final letter.
- `styles.css` — original visual design plus new character dossier, envelope, mission and achievement styles.
- `app.js` — navigation, modals, progress, envelope opening, mini-games, uploads and existing five-senses interactions.
- `index.html` — page structure.

All demo values and sample reactions are replaceable placeholders. No personal biography or shared relationship memories have been invented.

## New interactive content

1. Character dossier: RPG-style Level 23 profile, rarity/class, animated attributes, abilities, passives, weakness and signature power.
2. What makes you special: seven revealable notes.
3. Reasons I love you: six envelopes plus a seventh final envelope unlocked after opening the first six.
4. Four missions: choose a superpower, a three-question personality quiz, a three-pair memory match, and a short secret challenge.
5. One of a kind: achievement unlocks after all four missions and the final love-note envelope are completed, then leads into the existing five-senses chapters.

## Add photographs and audio

Use the upload controls inside the website, or place files in an `assets/` folder and set their relative paths in `content.js`. The memory match image placeholders are configured under `games.memories` using each item's `image` property. Browser uploads are stored in localStorage for this browser/device only; use static files in `assets/` for a shareable published version.

Suggested static asset names:

- `assets/hasan-cover.jpg` — welcome cover portrait
- `assets/hasan-portrait.jpg` — profile portrait
- `assets/us-01.jpg`, `assets/us-02.jpg`, `assets/us-03.jpg` — sight chapter
- `assets/memory-01.jpg`, `assets/memory-02.jpg`, `assets/memory-03.jpg` — memory-match photos
- `assets/our-song.mp3` — sound chapter
- `assets/perfume.jpg` — scent chapter
- `assets/favourite-photo.jpg` — final page

## Progress and reset

Existing five-senses progress remains under `hasan-chapter-23-progress`; the new envelope and mission completions use the same progress store. Uploaded files are stored separately under `hasan-chapter-23-assets`. “Start over” clears progress and game selections but keeps uploaded media.

## Publish

Upload the complete folder to any static hosting provider (for example GitHub Pages, Netlify, or Cloudflare Pages). Set the publish/root directory to this folder. No environment variables or server-side services are needed.
