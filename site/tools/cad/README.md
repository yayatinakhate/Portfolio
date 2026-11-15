# STEP → .glb for the 3D viewer

Two steps: OpenCascade meshes the CAD file (keeping part colours), then glTF-Transform
scales it to metres, stands it upright, simplifies it and compresses it (meshopt).

```bash
python3 -m venv .venv && .venv/bin/pip install cadquery-ocp
npm install
.venv/bin/python step2gltf_occ.py "my part.step" raw.glb 1.2 0.5     # surface tolerance in mm, angle in rad
node post.mjs raw.glb ../../models/my-part.glb 0.5 0.0015              # keep ratio, max error
```

- Aim for under ~5 MB. Very dense bought-in parts (motors, cameras) are simplified harder automatically.
- Then add a `model` block (or a `model` on a `dl` block) in `data/chapters.js` pointing at `models/my-part.glb`.
- This folder isn't loaded by the site; it's only here so new models can be made the same way.
