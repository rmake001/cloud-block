# CloudBlock skyscraper scene

Generate the Blender scene, portrait camera render, and app-ready building GLB
from the repository root:

```sh
blender --background --python blender/cloudblock_skyscraper.py
```

The script writes three files into this folder:

- `cloudblock_skyscraper.blend` — editable scene, framed through the portrait camera.
- `cloudblock_preview.png` — 720 × 1280 nighttime camera render.
- `cloudblock_building.glb` — building geometry and materials, excluding the camera,
  lights, and render-only fog.

Each apartment is one mesh named `Window_F01_U01` (floor 1, unit 1), with
`floor`, `unit`, and `interactive` custom properties. In Three.js, raycast the
window meshes and read these fields from `intersection.object.userData`.

Fog lives in the separate `CLOUDBLOCK | ATMOSPHERE (RENDER ONLY)` collection.
Keep that collection out of the GLB and recreate its clouds with app-side
atmospheric effects when integrating the building into Expo.
