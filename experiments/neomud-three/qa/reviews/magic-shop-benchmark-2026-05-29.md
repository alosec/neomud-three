# Magic Shop Benchmark Review - 2026-05-29

## Purpose

Use `town:magic_shop` as the current positive benchmark for representational
cohesion. This does not mean the room is final art. It means its internal logic
is currently clearer than the Town Square, Temple, or avatar work.

## Evidence

- Player-view screenshots:
  - `qa/latest/room-shot-magic-entry.png`
  - `qa/latest/room-shot-magic-counter.png`
- Scenic-review screenshots:
  - `qa/latest/scenic-review-magic-entry.png`
  - `qa/latest/scenic-review-magic-layout.png`
- Metadata:
  - `qa/latest/scenic-review-report.json`

## Rubric Scores

| Criterion | Score | Notes |
| --- | ---: | --- |
| Representational Sanity | 2 | Reads as a compact magic shop: shelves, counter, display case, NPC, floating magical objects. |
| Cohesion | 2 | Props share one simplified abstraction level and mostly support the same room premise. |
| Scale | 1 | Room scale works better than other spaces, but the current avatar still dominates the view. |
| Material / Texture Language | 1 | Purple walls, shelves, and props are coherent enough, but material detail remains simple. |
| Visual Hierarchy | 2 | Counter, shelves, NPC, and floating objects are readable; the room has a clear interior composition. |
| Playability / Flow | 1 | Exits and collisions exist, but the player-flow read still depends partly on labels and familiar layout. |
| Boundedness | 2 | The room is closed and internally legible even without a true ceiling. |

Prototype pass: yes.

## What Works

- Bounded room shape makes it feel like a place, not an outdoor prop spread.
- Tables, shelves, display panels, and floating objects read clearly.
- Stylization works because all simplified objects simplify in the same
  direction.
- The scene does not require physical completeness to be coherent.

## What Should Transfer

- Future rooms should define their bounded stage and prop language before adding
  detail.
- The abstraction level should be chosen deliberately and kept consistent.
- Props should serve the room premise and movement flow, not exist as generic
  decoration.

## Current Limits

- The player avatar remains a major visual problem.
- The NPC standee style still clashes with the room's low-poly environment.
- Material polish and lighting can improve, but should not be addressed before
  preserving the room's cohesion.
