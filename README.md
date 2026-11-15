# Yayati Nakhate — Built. Broken. Rebuilt.

A scroll-driven portfolio told through FPV goggles. Static site: no build step, no framework.

```
index.html        page shell (don't need to touch)
css/style.css     styles
js/app.js         renders the data file and runs the scroll journey (GSAP + ScrollTrigger)
js/hero-gl.js     WebGL depth-parallax hero and lens zoom
data/chapters.js  ALL CONTENT LIVES HERE  ← edit this
img/              photos
media/            video
```

## Publish

**GitHub Pages**: push this folder to the repo root (or `/docs`) → Settings → Pages → deploy from branch. Done. `.nojekyll` is already there.

**Vercel / Netlify**: drag the folder in, or connect the repo. No build command, output directory `/`.

## Preview locally

Just open `index.html` in a browser. (Fonts and GSAP load from CDNs, so you need to be online.)

## Adding content

Everything is in `data/chapters.js`. It is a plain JavaScript object; comments and trailing commas are fine.

### Add a photo to an existing chapter
Drop the file in `img/`, then add a line to the right block:

```js
{ src: "img/new-photo.jpg", ar: "4/5", chip: "worked", caption: "What this shows" }
```
- `ar` is the aspect ratio the photo is cropped to in the grid (`"1/1"`, `"4/5"`, `"16/9"`, `"3/2"`).
- `chip` is optional: `"tried"`, `"failed"`, `"worked"` or `"cost"`.

### Add more photos or videos behind a photo

Any photo (in a `strip`, `mosaic`, `bench`, …) can open a gallery. Add `gallery` to it:

```js
{ src: "img/hob-1.jpg", caption: "Bouldering", gallery: [
    { src: "img/boulder-2.jpg", caption: "Project at the gym" },
    { video: "media/boulder-1.mp4", poster: "img/boulder-1.jpg", caption: "First V5" }
] }
```

A small "+2 photos · ▶ 1 video" badge appears on the photo. Clicking it opens a viewer: swipe on a phone, drag with a mouse, or use the arrow buttons or ← → keys. Videos play with controls and stop when you move on. Keep clips short, H.264 `.mp4`, under ~10 MB.

### Add a video
Use a `video` block (muted, looping, lazy-loaded; a poster image shows until it plays):

```js
{ type: "video", theme: "butter", src: "media/clip.mp4", poster: "img/clip-poster.jpg",
  label: "FPV FEED · LADAKH",
  aside: [ { src: "img/a.jpg", ar: "4/5", caption: "…" } ] }
```
Keep clips short and small (under ~5 MB, 720p or less). Export with H.264, no audio.

### Add a whole chapter
Copy any object in `chapters[]` and change it. The important fields:

```js
{
  id: "newplace",            // unique, used for links
  num: "08",                 // shows in the HUD and on the waypoint
  title: "New Place",
  role: "What you did there",
  theme: "blue",             // blue | ink | orange | butter | cream
  learned: "learned: …",     // one-line HUD note
  cover: { src: "img/np-cover.jpg", alt: "…" },   // or null for a NO SIGNAL card
  story: ["Paragraph one.", "Paragraph two."],
  quote: "A handwritten line.",
  stats: [ { n: 121, label: "min flight time" } ],  // optional count-up numbers
  blocks: [ /* sections that follow the cover, see below */ ]
}
```

The **childhood chapter** (`chapters[0]`) is a placeholder: give it a `cover`, some `story` paragraphs and swap the `placeholder` block for a `strip` of photos.

### Block types

| type | what it is | key fields |
|---|---|---|
| `strip` | grid of photos with handwritten captions | `cols`, `items[]`, optional `title`, `intro`, `note`, `duo` |
| `columns` | two columns of other blocks | `ratio` (`"1fr 1.2fr"`), `left[]`, `right[]`, optional `h2` |
| `text` | heading + paragraphs | `h2`, `paras[]`, `script`, `aside {label,text}` |
| `figure` | one photo | `src`, `ar`, `chip`, `caption` |
| `mosaic` | 2-col mosaic, first item can be `tall: true` | `items[]` |
| `probs` | numbered problem list | `items[]` |
| `scrubber` | step-through photo sequence (chocolate printer) | `h2`, `lede`, `steps[{src,chip,text}]` |
| `projects` | hover cards (InsideFPV) | `items[{src,name,text}]` |
| `process` | numbered steps with a progress line | `items[{src,caption}]` |
| `dl` | definition list + a floating render | `items[{dt,dd}]`, `render` |
| `log` | the Ladakh failure log | `altitude`, `entries[{part,text}]`, `figure` |
| `bigquote` | word-by-word lit quote | `kicker`, `lede`, `quote`, `script` |
| `flips` | flip cards | `items[{did,ask}]` |
| `tags` | pill list | `title`, `lede`, `items[]` |
| `bench` | horizontal scroll strip (hobbies) | `items[{src,caption}]` |
| `video` | muted looping video + side photos | `src`, `poster`, `label`, `aside[]` |
| `stats` | count-up numbers | `items[{n,label}]` |
| `placeholder` | "footage not yet uploaded" card | `title`, `text` |
| `assembly` | a drone drawn like a CAD sketch that assembles as you scroll, beside up to three short lines | `title`, `steps[]` (three lines: first part, how parts mate, why this shape) |
| `numbers` | big count-up figures | `title`, `items[{n, unit, label}]` or `{text, label}` |
| `loop` | interactive ring of working steps (auto-advances) | `title`, `intro`, `steps[{name, text, tools[], example}]`, `script` |
| `research` | research interests, each linked to the chapters behind it | `title`, `lede`, `items[{name, question, evidence[{chapter, text}], learn}]` |
| `academics` | degree, CGPA, coursework, academic projects, certifications | `title`, `projects[{name, tools, text}]`; the rest comes from `applicant` |
| `model` | interactive 3D model (rotate, zoom, pan, view in AR on phones) | `src` (.glb), `poster`, `alt`, `caption`, optional `orbit` (e.g. `"30deg 70deg 110%"`) |

A `dl` block can also take a `model` (Stingray does); it shows the `render` image until the `.glb` exists.

Every block accepts `theme` to set its background colour, and most accept `kicker`, a small label shown above the section (used to echo the three chapter-00 questions). Prose fields accept HTML (`<br>`, `<a>`, `<em>`).

## Theme

Dark "flight log" theme: tinted near-black base, one signal orange used sparingly, and status colours that always mean the same thing (tried = amber, failed = red, worked = green). Each chapter/block's `theme` picks a dark variant: `ink` base, `blue` night, `orange` ember, `butter` amber-dark, `cream` graphite. Colours live as tokens at the top of `css/style.css`.

## For admissions readers

`applicant` at the top of `data/chapters.js` holds the degree, CGPA, research interests, coursework, certifications and leadership. It feeds the intro, the flight plan's brief and the "On paper" block. Each chapter can list `methods` (shown on its cover under the result). Keep these in step with the resume.

## Flight plan, skip, results

Reviewers can press **Skip intro** on the opening screen or open the **Flight plan** (opening screen and top of the HUD) to jump to any chapter. Each chapter's optional `result` field shows on its cover and in the flight plan; keep it to one line with a concrete outcome.

## Links

`person.linkedin` and `person.resume` in `data/chapters.js` feed the buttons in the hero and the finale. Put the resume PDF at `docs/Yayati-Nakhate-Resume.pdf` (or change the path). Set either to `null` to hide its button.

## Photos from Drive

The Drive photos are not part of the published site. They are kept outside it, in `not-published/drive/` with a review sheet `not-published/photos.html`. To use one, copy it into `img/` and reference it from `data/chapters.js`.

## 3D models

Put models in `models/` as **glTF binary (`.glb`)**, ideally under 5 MB.

- **Blender**: File → Export → glTF 2.0 → Format "glTF Binary (.glb)", tick "Apply Modifiers", and under Geometry turn on Compression (Draco).
- **SolidWorks / CATIA / Fusion 360**: export STEP and convert it with the scripts in `tools/cad/` (see its README). That's how `models/stingray.glb` and `models/vtol.glb` were made.
- To shrink an existing file: `npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress webp`.

The viewer (Google's `<model-viewer>`) loads only when a visitor scrolls near the model. Controls stay off until they press **Explore in 3D**, so scrolling the page never gets captured by the model. If the file is missing, the still image shows instead.

## The hero

The hero is the goggles photo, cel-shaded live in a WebGL shader (flat colour bands, ink edges, boosted colour) with a depth-parallax so it moves like a 2.5D illustration. Tune the look with `hero.toon` (`levels`, `edge`, `saturation`, `strength`). `hero.slim` makes the figure look narrower by that fraction, so 0.10 is 10% (0 leaves the photo as taken, 0.25 is the maximum); `hero.figure` sets the region it applies to. On scroll the camera flies like a drone across the photo to the goggles, passes through the faceplate, turns 180° inside to face the two screens, and dives into one; the exit plays it backwards.


`hero.image` is the goggles photo. `hero.lens` is where the lens sits in the photo (0–1 across, 0–1 down); the scroll zoom dives into that point. `hero.figure` shapes the procedural depth map (centre x, centre y, radius x, radius y). If you ever generate a real depth map (e.g. with Depth Anything or Marigold), save it as a greyscale image, white = near, and set `hero.depth: "img/goggles-depth.png"`.

## HUD

`hud.transitVideos` is the list of clips that play behind the HUD while flying to each chapter: chapter n gets clip n, wrapping round, so add or reorder clips to change the sequence. Keep each 4–8 s, 720p, H.264, no audio (~3 MB), and save its first frame as a `.jpg` with the same name next to it so clip changes never flash. The current clips come from the Surat fields flight and three GoPro hill flights, all checked frame by frame so no people appear.


`hud.callsign`, `hud.link`, battery voltage range and the total "flight time" the timer counts to are in `hud`. `enterText` / `exitText` are the words flashed when you put the goggles on and take them off.

## Accessibility and performance

- `prefers-reduced-motion` turns off pinning, the zoom and the parallax; the page becomes a plain scroll with the same content. Add `?reduce` to the URL to see (or share) that version on any device.
- All photos below the fold lazy-load; the video only loads when its section is near the viewport and pauses off-screen.
- Works without WebGL (falls back to a CSS-zoomed image) and without JavaScript the content is still in the data file, but the page needs JS to render.
