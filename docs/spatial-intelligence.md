# Home spatial intelligence and interactive Journey

The first Home workspace uses a procedural city that follows the OS theme: dark
graphite surfaces by default, with bright perception textures revealed on hover;
light mode restores the pale clay scene. The existing navbar,
About ID, window manager, Work Gallery, NAV.AI and Milo remain available. **Focus
scene** temporarily hides desktop windows and the gallery; **Return to desk**
restores their positions and content. Home has one workspace; AI Lab and Neural Core
tabs and their keyboard/swipe transitions have been removed. Their content apps
remain accessible through the command palette.

## Scene implementation

- `frontend/components/spatial/world.ts`: 28 building designs repeated across 25
  districts (700 buildings), with instanced windows, street markings, benches,
  planters and trees. Ground and roads extend beyond the supported camera views;
  there is no island edge. Dark surfaces use lighter graphite and facade detail.
- `routes.ts` and `traffic.ts`: a grid of roads spaced 66 m apart, continuous cubic
  junction curves, straight/left/right routes, junction reservations and a 24-second
  signal cycle. Seeded cruise variation, bounded acceleration/braking, following
  distance and pedestrian forecasts drive 40 vehicles and 32 pedestrians. Six
  vehicle models use rounded bodywork, curved glazing, separate tires and lamps. Heading,
  steering angle and acceleration come from this motion. Forecast hazards set a
  braking target; physical clearance is handled separately to avoid abrupt stops.
- `point-cloud.ts`: area-weighted surface samples across every eligible mesh,
  with a higher density in the central visible districts. Desktop uses 420,000
  static scene samples, mobile 220,000, plus ground and actor samples (about 531k/313k
  total). Small, stable particles preserve the geometry instead of displacing its shape.
  Samples are partitioned into 24 m tiles; only tiles intersecting the pointer
  cloud are drawn. The dense data stays available while most vertices remain off
  the GPU during a local reveal.
  Only Control & SLAM uses this cloud, overlaying height-colored scene landmarks.
  3D & Object now reveals natural RGB materials, with no point-cloud dissolution.
- `sensor-fans.ts`: animated forward lidar sectors follow every vehicle, including
  turns, with stronger wave visibility near the cursor.
- `control-vectors.ts`: velocity arrows, steering arcs and look-ahead route geometry
  follow the same vehicle state. Hover reveals the animated control layer.
- `materials.ts` and `shaders.ts`: a single geometry/material pipeline blends lit
  clay with analysis before the final output color conversion. Normals are world
  space. `surface-textures.ts` supplies small deterministic albedo rasters for
  concrete, asphalt and brick, combined with glazing, natural category colors and
  actual scene lighting/shadows. This is a procedural RGB-style material view,
  not imagery from a camera or an external photo collection. Texture sampling is
  restricted to the revealed RGB region, avoiding work in other modes.
- `scanner.ts`: two aspect-correct GPU render targets accumulate a continuous
  pointer segment and decay its history. A shared CSS-pixel grid/hash breaks up
  the frontier. Surface shading, cuboids and structure lines share this mask.
  A fourteen-pixel readback samples the same GPU mask for projected DOM labels.
  Segmentation expands the outer reveal radius by 8%, retaining its semantic
  colors and pixel frontier. A separate 84 px cursor core (52 px on mobile) blends
  blue/violet/magenta orientation shading into those surfaces. Its animated pixel
  frontier uses the same grid as the outer scan, with a gently changing dither.
  The core follows the cursor rather than accumulating along the outer trail.
- `scene-objects.ts`: tree/signal detection cuboids share one geometry and draw call.
  Building dimensions remain available for Milo navigation and occlusion, but
  never produce detection boxes or labels.
- `city-bridge.ts`: the companion projects real world coordinates through the live
  camera. Milo chooses visible roofs, wall anchors and sidewalks, follows parabolic
  jumps with rooftop clearance, and returns to the desktop floor. CLI windows are
  no longer perches. Most moves are short walks along a roof or sidewalk, with
  listening, grooming, stretching and occasional curled naps between them.
  `city-cat.ts`, `city-cat-rig.ts` and `voxel-geometry.ts` provide an articulated
  high-resolution voxel cat. Small real cubes form its body, paws, muzzle, ears,
  whiskers and eyes, with a tabby palette and baked corner occlusion. Hidden cube
  faces are omitted and exposed surfaces are batched per joint. The base cell is
  0.12 units on desktop and 0.16 on mobile, with finer facial features. A single
  instanced cube mesh forms its animated tapered tail, including the sleeping curl.
  Cubic edges remain visible while the joints move smoothly. City lighting and
  depth occlusion apply to the model.
  Entry/exit share a projected trajectory with the SVG companion, using a pixel
  dissolve plus SVG alpha blending. During the dissolve the model faces sideways
  to align its silhouette, then turns with its route. Drag, pet and chat remain
  accessible through the projected interaction layer.
- `city-car-play.ts` and `city-carry-path.ts`: Milo's street visit includes walking,
  then an occasional pounce on a slow car with a clear destination. Milo lowers
  its head, opens and closes its jaw on the roof, lifts the original car mesh,
  and walks a long road route containing a curved left or right turn. The car
  follows the articulated mouth's world-space grip each frame, including head
  bob and heading, while all four paws walk. Roof height comes from the actual
  car geometry. Milo then lowers the car, opens its jaw and leaves it on the
  reserved road position. The same traffic actor and route object resume from
  rest at that point. Other vehicles leave room for Milo and the reserved landing.
  Interrupted play eases the car onto the nearest traveled route position before
  traffic resumes, including when the cat is dragged or chat is opened.
  To get onto a building, Milo first
  crouches for about 650 ms, springs upward outside the facade, crosses above the
  ledge, and compresses its legs on landing. Vertical wall walking is removed;
  narrow alleys remain excluded. 2D roaming also favors walks and has a separate
  curled sleeping illustration, with occasional small hops after a crouch.
- `engine.ts`: one animation loop owns camera, simulation, render passes, ray
  picking, occlusion checks, projected 3D bounds, labels and inspector anchors.
  Pointer movement is mutable renderer state, rather than React render state.

About keeps its existing width and grows to its full content height. On short
desktop viewports it sits beside the launchers, keeping the complete bio and
actions visible above the Work Gallery without an internal scrollbar.

3D & Object, Sensor Fusion, Segmentation, Depth and Control & SLAM use the same scene
and camera. Depth uses the actual orthographic fragment depth with the camera's
near/far planes. Cuboids follow each actor's position and heading. Labels are
limited and checked against building occlusion. Picking raycasts the rendered
actor geometry and buildings. Inspector speed comes from simulated displacement;
nearest-neighbor distance and range from the junction are computed from positions.

The city is a **spatial simulation**. Segmentation uses known scene categories.
Lidar sectors and the SLAM-style landmark view visualize the synthetic scene;
they do not run physical sensor fusion or an odometry/localization estimator.
No model confidence or accuracy is fabricated.

## Controls

- Move/touch to scan; click an actor to inspect; drag empty desktop space to orbit.
- ISO / TOP / STREET, or `1` / `2` / `3` with the scene focused, switch cameras.
  All presets use an orthographic camera so transitions keep geometry aligned.
- Ctrl/Cmd + wheel zooms. Unmodified wheel keeps ordinary page scrolling.
- **My Research Area** replaces the engineering toolbar with one compact illustrated
  selector. The options are Segmentation (default) / 3D & Object / Depth / Sensor Fusion /
  Control & SLAM (a two-column button). The panel matches the file launcher's width.
  Sensor Fusion adds forward waves. Control & SLAM
  replaces detection boxes with vehicle velocity arrows: heading follows each
  vehicle, length is speed in m/s × 1.35 seconds, and stopped vehicles have no
  moving arrow. Arrows respect scene depth, follow dark/light mode and disappear
  when leaving Control & SLAM. Its single
  SVG illustration changes with the selected area; the reveal stays pointer-based.
  Raw Scan, Boxes, Labels and More controls are removed from the interface.
- Launcher and Research Area use approximately 66% opacity in dark mode, rising
  to 96% on hover or keyboard focus. Light mode follows the same readable behavior.
- Pause or Space on the focused scene stops traffic while scan/camera remain usable.
- Escape clears the selected actor. The subject selector is a keyboard alternative
  to ray picking.

## Tuning

`frontend/components/spatial/config.ts` is the tuning entry point:

| Setting                                        | Default / use                                            |
| ---------------------------------------------- | -------------------------------------------------------- |
| `scanner.desktopRadius`, `mobileRadius`        | 218 / 126 CSS px                                         |
| `scanner.trailTau`                             | 0.68 seconds, exponential history decay                  |
| `scanner.pixelSize`, `edgeNoise`               | 4 CSS px / 0.2 frontier threshold variation              |
| `scanner.dampingSeconds`                       | 0.085 seconds for pointer following                      |
| `scanner.maskWidth`, `mobileMaskWidth`         | 512 / 256 pixels; height follows viewport aspect         |
| `palette`                                      | Normal orientation colors and clay background            |
| `presets`, `camera.transitionSeconds`          | Camera positions/targets/spans; 0.8-second response      |
| `camera.depthNear`, `depthFar`                 | Display range for actual camera depth                    |
| `world.vehicleCount`, `pedestrianCount`        | 40 vehicles / 32 pedestrians on a road graph             |
| `quality.desktopDpr`, `mobileDpr`, `mobileFps` | 1.5 / 1 / 30 fps rendering target                        |
| `quality.maxLabels`, `shadows`                 | Up to 14 labels; 1024px static architecture shadow atlas |

`motion.modeSeconds` controls the 0.22-second blend between analysis materials.
Mobile uses less facade detail, lower DPR, a wider camera span and touch scanning.
Reduced motion freezes actors, removes the trail and skips Journey ignition.
Rendering stops in a hidden tab. Resize/unmount disposes targets, geometry,
materials, observers and native listeners. A labeled SVG fallback and Retry 3D
control preserve the workspace if WebGL fails or its context is lost.

Unrevealed fragments skip analysis shading. Grid derivatives are computed outside
that branch so the noisy frontier still has well-defined anti-aliasing.
Architecture shadows are retained rather than recomputed each frame. Moving
actors receive those shadows but do not cast dynamic shadow maps. A mobile
rendering target is not a measured performance guarantee for every device.

## Journey

`journey-log.tsx` and `styles/journey.css` implement the portrait Journey CLI.
One continuous cubic trajectory descends through four nodes, starting near the
top without the previous large gap. The toolbar overlays the corner instead of
reserving a blank row. An illuminated head leaves a lit path behind it. A bounded
transparent canvas (`journey-wave.ts`) draws small shaded isometric voxel waves
along its recent trajectory; this avoids another WebGL context. Milestone lights
respond to the same path position. Auxiliary loops and alternate views are removed.
The 9:16 window keeps all four nodes visible with sequential arrivals and official
logos. Select a node for an accessible detail panel with a Work/Research link.
The introductory seed flies from the center to the first node, clipped inside the
Journey window. Skip, Replay, reduced motion and keyboard interaction remain.
Official supplied logo files are in `frontend/public/portfolio/logos/`.

## Local verification

```powershell
npm run dev
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

`frontend/tests/spatial.spec.ts` checks dark/light GPU output and bright hover,
distinct rendered research modes, actor identity
across cameras, pause/resume, and failure fallback. `journey.spec.ts` checks a single
descending path, all four stages at 9:16, expansion, official logo loading,
intro replay, voxel-wave canvas output, overlay containment and Milo's city
roaming/drag/chat lifecycle. A native GPU-pixel check verifies the 3D cat while
its SVG is hidden, then checks the return to 2D.
`traffic.spec.ts` simulates 90 seconds with the real actor population and checks
road containment, turns, steering and bounded acceleration through signal cycles.
It also checks car identity, a long route with a 90-degree turn, attachment to the
real articulated mouth, a reserved road landing and interruption recovery.
`milo-voxel.spec.ts` verifies real cube normals, interior-face removal, dense
colored geometry and bounded mesh counts. The two-layer hover test samples actual GPU pixels to
verify that the core changes while the surrounding semantic surface stays intact.
Existing integration tests cover desktop windows, NAV.AI, carousel, navigation,
theme, chat and mobile layouts. Browser review captures live WebGL images in
`.artifacts/spatial/`; they are inspection artifacts, not scene assets.

`/?spatialDebug=1` retains the drawing buffer for native canvas PNG verification.
GPU image comparisons use this flag to exclude DOM controls and Journey. Milo's
3D mesh remains part of the GPU image; exact comparisons use reduced motion.
Normal browsing avoids its additional buffer cost. The RGBA8 reveal
history includes a quantization correction so low-opacity residues decay completely.

Implementation references: [Three.js normals](https://threejs.org/docs/pages/MeshNormalMaterial.html),
[render targets](https://threejs.org/docs/pages/RenderTarget.html),
[ray casting](https://threejs.org/docs/pages/Raycaster.html), plus the owner-supplied
master spec, four reference frames, video and Journey HTML.
Voxel meshing follows the exposed-face approach described in the
[Three.js voxel geometry guide](https://threejs.org/manual/pages/voxel-geometry.html).
