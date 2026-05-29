# Temple Scenic Review - 2026-05-29

## Purpose

Use Scenic Review evidence to describe why the current Temple is improved but
still fails key representational QA dimensions.

## Evidence

- Player-view screenshots:
  - `qa/latest/room-shot-temple-nave.png`
  - `qa/latest/room-shot-temple-altar.png`
- Scenic-review screenshots:
  - `qa/latest/scenic-review-temple-nave.png`
  - `qa/latest/scenic-review-temple-pews.png`
- Metadata:
  - `qa/latest/scenic-review-report.json`

## Rubric Scores

| Criterion | Score | Notes |
| --- | ---: | --- |
| Representational Sanity | 1 | Reads as a church-like hall, but the pews, wall texture, windows, and floor language do not fully agree. |
| Cohesion | 1 | Stained glass is much higher visual detail than the walls, floor, and pew geometry. |
| Scale | 1 | The nave is larger than before but still lacks monumental height/mass; avatar and pew repetition flatten the space. |
| Material / Texture Language | 0 | Floor/wall texture detail is overpowering and clashes with simplified low-poly forms. |
| Visual Hierarchy | 1 | Altar direction is readable, but repeated pews and bright floor compete with the focal point. |
| Playability / Flow | 1 | Center aisle exists and gives a path, but the room feels like an object grid rather than a composed sacred space. |
| Boundedness | 1 | Bounded as a hall, but the black ceiling/upper void and flat wall treatment weaken the authored-room read. |

Prototype pass: no.

## Primary Failure

The Temple's problem is not simply low fidelity. It is inconsistent abstraction:
painted stained-glass panels, bright procedural stone, repeated blocky pews,
and flat wall massing all imply different visual systems.

## Next Bounded Target

Do not broadly decorate the Temple. Pick one target:

1. Redesign pews from a simpler semantic spec.
2. Rework the floor/wall material language to reduce overpowering texture
   contrast.
3. Establish a stronger nave scale/height read with a flow spec.

The pew target is the best first diagnostic because it can be reviewed
standalone, in-row, and in-room through Scenic Review.
