---
name: house-geometry-checker
description: Use when validating a structured house or building model for geometric consistency. Best for finding wall-pillar overlaps, incorrect wall endpoints, openings outside wall spans, inconsistent pillar heights, stair containment problems, and similar model integrity issues before or after edits.
---

# House Geometry Checker

Validate the model mechanically. Prefer a deterministic script over visual guessing.

## Use this skill for

- Checking whether walls overlap pillars
- Checking whether perpendicular walls still intersect after pillar trimming
- Checking whether windows and doors fit inside wall spans
- Checking whether pillar base and height match adjacent wall intent
- Checking whether stairs, platforms, and vehicles fit inside containing areas
- Producing an issue list before editing
- Confirming that a normalization pass actually fixed the model

## Workflow

1. Read the model schema and source model file.
2. Decide whether the task is report-only, report-plus-suggested-fix, or report-plus-auto-fix.
3. Implement or reuse a deterministic checker script when possible.
4. Run the checker before editing if the model looks inconsistent.
5. Re-run the checker after edits.
6. Run the project build after the checker passes.

## Minimum checks

- Wall/pillar overlap:
  `30 cm` walls should terminate at pillar faces, not overlap pillar volume.
- Wall/wall intersection sanity:
  Perpendicular wall bands may meet at a pillar; otherwise overlapping solids are a defect.
- Opening span fit:
  `offset >= 0` and `offset + length <= wall length`.
- Opening height fit:
  `baseHeight >= 0` and `baseHeight + height <= wall height`.
- Pillar consistency:
  Raised-wall pillars should not silently become full-height unless intended.
- Containment:
  Stairs and platforms should not cross walls or boundary limits unless explicitly requested.

## Preferred checker behavior

- Load the source model directly from the repo
- Print concise machine-readable findings
- Exit non-zero when issues are found
- Include wall IDs, pillar IDs, overlap dimensions, and coordinates when useful

## Output categories

- `wall-pillar overlap`
- `wall-wall overlap without pillar`
- `opening outside wall span`
- `opening exceeds wall height`
- `pillar height mismatch`
- `object outside containing area`

## Editing boundary

- Do not silently mutate the model unless the task explicitly asks for auto-fix behavior.
- If you auto-fix, keep the checker and the fix logic separate enough that the checker remains trustworthy on its own.

## Finish

- Re-run the checker until it reports clean results.
- Run the build.
- Summarize remaining assumptions, especially around orientation, wall datum, and pillar override rules.
