# Hasan — Chapter 23

A responsive, static birthday storytelling website. No backend, build step, framework, or third-party runtime dependency is required.

## Run locally

Open `index.html` in a modern browser, or serve this folder with any static server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Personalise the content

- `content.js` — all names, sample copy, profile traits, note cards, five chapter descriptions, sample memories, media paths, and the final letter text.
- `styles.css` — visual design, colours, typography, responsive breakpoints, and motion.
- `app.js` — interactions, local progress, uploads, and navigation.

The sample comments and values are placeholders. Replace them with your real memories and observations; no biography or shared relationship memories have been invented.

## Add photographs and audio

You can use the upload controls inside the site. Images and audio are saved in this browser's localStorage for this device/browser only. To prepare a shareable public version, the recommended approach is to place optimised image/audio files in `assets/` and reference them from your content; browser-local uploads are not automatically shared with another device.

To use files from `assets/`, set their relative paths in `content.js` under `media` (for example `hero: 'assets/hasan-cover.jpg'`). The `sight` array contains the three gallery image paths.

Suggested static asset names:

- `assets/hasan-cover.jpg` — welcome cover portrait
- `assets/hasan-portrait.jpg` — profile portrait
- `assets/us-01.jpg`, `assets/us-02.jpg`, `assets/us-03.jpg` — sight chapter
- `assets/our-song.mp3` — sound chapter
- `assets/perfume.jpg` — scent chapter
- `assets/favourite-photo.jpg` — final page

## Progress and reset

Completed sense chapters are stored in localStorage under `hasan-chapter-23-progress`. Uploaded files are stored separately under `hasan-chapter-23-assets`. “Start over” clears only the chapter progress; it keeps uploaded media.

## Publish

Upload the complete folder to any static hosting provider (for example GitHub Pages, Netlify, or Cloudflare Pages). Set the publish/root directory to this folder. No environment variables or server-side services are needed.

## Notes

- The final letter body is intentionally a placeholder in the HTML so the author can write the real message.
- Sample character-stat percentages are visual demo values; edit or remove them in `content.js`.
- Uploads through the page are local to the browser. For sharing with Hasan, use static files in `assets/` before publishing.
