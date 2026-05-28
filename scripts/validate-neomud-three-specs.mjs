#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOWN_SQUARE_SPEC } from "../experiments/neomud-three/room-specs.js";
import { validateRoomRenderSpec } from "../experiments/neomud-three/room-triggers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const specs = [TOWN_SQUARE_SPEC];
const rooms = loadWorldRooms();
const errors = specs.flatMap((spec) => validateRoomRenderSpec(spec, rooms.get(spec.id), rooms));

if (errors.length) {
  console.error("NeoMud Three spec validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`NeoMud Three spec validation passed (${specs.length} specs)`);
}

function loadWorldRooms() {
  const worldDir = path.join(repoRoot, "maker/default_world_src/world");
  const rooms = new Map();
  for (const file of fs.readdirSync(worldDir)) {
    if (!file.endsWith(".zone.json")) continue;
    const zone = JSON.parse(fs.readFileSync(path.join(worldDir, file), "utf8"));
    for (const room of zone.rooms ?? []) {
      rooms.set(room.id, room);
    }
  }
  return rooms;
}
