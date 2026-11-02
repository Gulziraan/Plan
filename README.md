# Hasan — Chapter 23 | Cinematic Edition

A responsive, static birthday storytelling website. This is a refinement of the existing project: the original five-senses chapters and letter experience remain, with a cinematic superhero visual direction and repaired navigation/interactions.

## Open
Open `index.html` in a modern browser. `Hasan-Birthday-Preview.html` is a standalone version with CSS and JavaScript embedded.

## Personalise
Edit `content.js`:
- `stats`, `abilities`, `passives`, `superpowers` — character dossier
- `notes`, `reasons`, `finalReason` — personal notes and letters
- `games` — mini-mission wording
- `senses` and `finalLetter` — five-senses chapters and final letter
- `media` — optional relative paths to image/audio assets

Use the in-page upload controls to add photos/audio for the current browser. Browser uploads are saved locally on that device and are not automatically included when you share the ZIP. For a shareable version, place files in `assets/` and use relative paths in `content.js`.

## Interactions
- Character stats and ability details open in a modal.
- The hammer interaction triggers a brief lightning flash and a personal message.
- Notes and envelopes reveal their copy.
- Four small missions unlock the achievement and transition.
- Five senses chapters can be opened in any order; progress is saved locally.
- The final page unlocks after all five senses chapters are marked complete.
- Uploaded media and progress are stored in this browser's localStorage.

## Typography
The site uses Barlow Condensed for display typography, DM Sans for interface text, Cormorant Garamond for editorial copy, and Parisienne for handwritten accents. Google Fonts are loaded when internet is available; system fallbacks are declared for offline use.

## Publish
Upload the complete folder to static hosting. No backend or build step is required.
