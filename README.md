# Ciurbesti House

Interactive house model editor and viewer for a centimeter-based building model.

Live site: https://snegrus.github.io/house3d/

## Main Ideas

- The house is modeled as structured data, not drawn manually.
- The source of truth is [`src/sampleHouse.ts`](./src/sampleHouse.ts).
- The app renders the same model in:
  - a 3D scene
  - 2D floor plans
  - editable JSON in the UI
- Geometry is intentionally simple and explicit:
  - walls are line segments with thickness and height
  - windows and doors are wall openings
  - pillars, platforms, stairs, and cars are box objects
  - spaces are floor polygons

## Core Concepts

### Units and Coordinates

- All dimensions are in `cm`.
- Floors have an `elevation`.
- Walls use `from` and `to` points in plan view.
- Opening `offset` is measured along the wall from `from`.
- Opening `baseHeight` is measured from the wall base, not world zero.

### Model Shape

The schema lives in [`src/model.ts`](./src/model.ts).

Main entities:

- `HouseModel`
- `Floor`
- `Wall`
- `WallOpening`
- `Space`
- `HouseObject`

### Structural Conventions

- `30 cm` walls are normalized against pillar faces.
- Some wall endpoints are trimmed during model normalization.
- Because of that, opening offsets in source sometimes need to account for trimming.
- Pillars are modeled as structural box objects generated from the structural pillar list.

### Rendering

- [`src/Scene3D.tsx`](./src/Scene3D.tsx) renders the 3D view and foundations.
- [`src/Plan2D.tsx`](./src/Plan2D.tsx) renders per-floor 2D plans with zoom and pan.
- [`src/sampleHouse.ts`](./src/sampleHouse.ts) contains the current building geometry and normalization logic.

## Local Development

Install and run:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## How To Prompt An Agent

This repo works best when prompts are precise about:

- wall ID, pillar ID, floor, or object ID
- dimensions in `cm`
- whether distances are from pillar centers or pillar faces
- whether offsets are from the wall `from` end or from a named pillar
- height, width, base offset, and total length
- whether the change is visual only or must update the source model

Good prompts usually ask the agent to:

- edit the model in `src/sampleHouse.ts`
- preserve normalization rules
- run validation/build after changes

Recommended phrasing:

```text
Add a window on w30, offset 120 cm from p6 toward p1, length 150 cm, base height 110 cm, height 120 cm. Update the model and verify it builds.
```

## Prompt Examples

### Openings

```text
Add a centered door on w2 with the same dimensions as the existing door. Update the source model and verify the build.
```

```text
Add a window on w13, 35 cm from the face of p15, width 60 cm, base height 170 cm, height 150 cm.
```

```text
Move the window from w13 to w12 but keep the same offset from p8 face.
```

### Walls and Axes

```text
Increase the distance between axes 4 and 5 so the outside distance between p19 and p18 is 420 cm. Update all affected walls, pillars, spaces, and centered openings.
```

```text
Shift axis 5 by 40 cm and keep all openings attached to the same wall faces.
```

### 2D / 3D UI

```text
Make the 2D plans section larger, stack floors in one column, and add independent zoom and pan for each plan.
```

```text
Make wheel zoom less sensitive and zoom toward the cursor in the 2D plans.
```

### Foundations and Structural Objects

```text
Restore the foundation under p13 and keep the other pillar foundation overrides unchanged.
```

```text
Add a garage platform object and center a vehicle box on it.
```

## Prompting Tips

- Say `from the face of the pillar` if you do not mean center-to-center.
- Say `centered on the wall` if you want the agent to compute the offset.
- If a wall is normalized against pillars, ask the agent to preserve the final face-based clearance.
- If you want a composite element but the schema is simple, ask for either:
  - a source-model approximation
  - or a schema/rendering extension

Example:

```text
Add a 3-part door assembly on w26: total width 170 cm, center panel 100 cm, sidelights on both sides, 30 cm from p16 face. If the schema cannot represent that as one opening, implement the closest structured-model approximation and explain it.
```

## Repo Notes

- The app stores the current edited model in local storage.
- Syncing from file resets the in-browser model back to the checked-in sample model.
- Validation rules are defined in [`src/model.ts`](./src/model.ts).

