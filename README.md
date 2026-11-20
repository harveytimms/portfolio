# Harvey Timms · Engineering portfolio

Live site: https://harveytimms.github.io/portfolio/

A static site (no build step) styled as an engineering drawing set: each project is a "sheet" with a title block, key results, what I did, and numbered figures.

## Using it in an interview

- **Present mode:** press `P` or the Present button. `←` `→` (or Space, Page Up, Page Down) move between sheets, `Home` and `End` jump to the first and last, `F` goes full screen, `Esc` exits.
- **Photos:** click any photo to open it large. `←` `→` step through that project's photos.
- **Evidence index:** pick a skill to see which projects show it.

## Adding a photo

1. Prepare it (needs Pillow: `pip install pillow`):
   ```
   python3 tools/prepare_images.py path/to/original.jpg images/<project>/<name>.jpg
   ```
   This rotates it, resizes it to at most 1600 px, removes location data, and prints the `<figure>` snippet with the right width and height.
2. Paste the snippet into that project's `<div class="gallery">` in `index.html` and write the caption.
3. Delete the matching `<div class="want">` line in the same project.
4. Open the site with `#draft` on the end of the address to see which photos are still wanted.

Gallery layout: the first photo shows large and two photos sit side by side. Add a class to a `<figure>` when needed: `fit` for diagrams and plots, `portrait` for tall photos, `natural` to keep a photo's own shape, `small` for small images.

## Adding a project or role

Copy an existing `<article class="sheet slide">` in `index.html` and change:

- `id`: the link name, such as `ebike`
- `data-short`: short name for the Evidence index and Present mode
- `data-year`: year shown in the Evidence index
- `data-skills`: any of `lead team design analysis code build test pm commercial`

The Evidence index and Present mode pick it up automatically.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | All the content |
| `assets/site.css` | The design. Colours are tokens at the top, with dark mode below them |
| `assets/site.js` | Evidence index, photo viewer, Present mode, theme switch, draft view |
| `assets/fonts/` | Barlow, Barlow Condensed and IBM Plex Mono, self-hosted (SIL Open Font License, licences included) |
| `images/` | One folder per project. `og.jpg` is the preview image when the link is shared |
| `tools/prepare_images.py` | Photo preparation script |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## Preview on your computer

From this folder run `python3 -m http.server`, then open http://localhost:8000.

## Publishing

GitHub Pages deploys from `main`. Merging a pull request updates the live site within a few minutes.
