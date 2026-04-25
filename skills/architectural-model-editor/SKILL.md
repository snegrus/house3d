---
name: architectural-model-editor
description: Use when editing a structured house or building model with walls, floors, pillars, stairs, windows, doors, platforms, foundations, and elevations. Best for geometry changes that must preserve consistency, such as moving walls, adding openings, generating pillars at intersections, trimming walls to pillar faces, resizing stairs, or keeping objects inside containing spaces.
---

# Architectural Model Editor

Edit the model in its structured source of truth. Prefer deterministic geometry updates over rendering-only fixes.

## Use this skill for

- Adding, moving, resizing, or deleting walls
- Adjusting wall heights, base elevations, and foundation behavior
- Adding or modifying windows and doors on walls
- Generating, renaming, or resizing pillars
- Trimming walls so they connect to pillars without overlap
- Adding or adjusting stairs, landings, and platforms
- Keeping objects inside rooms, garages, or other containing areas
- Normalizing a model after several geometry edits

## Workflow

1. Read the model schema and source model file first.
2. Confirm the local conventions in use:
   Axis-centered walls, centimeters, base elevations relative to floor elevation, and opening offsets measured from `from` along the wall centerline.
3. Make the geometry change in the data model first.
4. Normalize related geometry immediately after the change.
5. Verify with a checker.
6. Run the project build.

## Normalization rules

- `30 cm` walls should stop at pillar faces, not pass through pillar centers.
- Perpendicular walls should meet at the pillar object, not overlap through it.
- Openings belong on `wall.openings`, not as loose objects.
- Opening `baseHeight` is relative to the wall base, not an absolute world elevation.
- If the user gives a dimension from the far wall end, convert it to the correct `offset` from `from`.
- Clamp openings so `offset >= 0` and `offset + length <= wall length`.
- Keep stairs and platforms inside their intended containing area.
- Update pillar base and height when adjacent wall conditions change.
- Preserve explicit pillar overrides if the user has asked for them.

## Heuristics

- Exterior stair defaults are usually `15-17 cm` risers and `28-30 cm` treads.
- Raised-wall pillars usually inherit:
  `baseElevation = min(adjacent wall bases)` and `top = max(adjacent wall tops)`.
- Prefer repeated generated geometry for stairs over many unrelated manual objects.

## Verification checklist

- No wall/pillar overlap
- No wall-through-pillar intersections
- No opening outside wall length
- No opening outside wall height
- No unintended stair or platform overlap with walls
- No object crossing its containing area
- Stable IDs for pillars, openings, and generated stair parts

## Finish

- Run the geometry checker if available.
- Run the build.
- Report assumptions that affect architecture, especially orientation, elevation datum, and opening offsets.
