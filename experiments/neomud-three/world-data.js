export const WORLD_ROOT = "/maker/default_world_src";

export const ZONE_FILES = [
  "town.zone.json",
  "forest.zone.json",
  "marsh.zone.json",
  "gorge.zone.json",
  "cracked_plains.zone.json",
  "foothills.zone.json",
  "iron_vein.zone.json",
  "highmoor.zone.json",
  "watchers_barrow.zone.json",
  "salt_coast.zone.json",
  "drowned_chapel.zone.json",
  "first_seal.zone.json",
  "cradle_of_the_seal.zone.json",
  "skyveil_reach.zone.json",
  "ashwood.zone.json",
  "pyromancers_folly.zone.json",
  "glass_desert.zone.json",
  "mirage_spire.zone.json",
  "bone_wastes.zone.json",
  "necropolis_of_vael.zone.json",
  "warlords_hold.zone.json",
  "stormcrown_keep.zone.json",
  "sealed_threshold.zone.json"
];

const directionRank = {
  NORTH: 0,
  NORTHEAST: 1,
  EAST: 2,
  SOUTHEAST: 3,
  SOUTH: 4,
  SOUTHWEST: 5,
  WEST: 6,
  NORTHWEST: 7,
  UP: 8,
  DOWN: 9
};

export async function loadWorld() {
  const [zones, catalogs] = await Promise.all([
    Promise.all(ZONE_FILES.map(async (file) => {
      const response = await fetch(`${WORLD_ROOT}/world/${file}`);
      if (!response.ok) throw new Error(`Failed to load ${file}: ${response.status}`);
      return response.json();
    })),
    loadCatalogs()
  ]);

  const rooms = new Map();
  const zonesById = new Map();
  const npcs = [];

  for (const zone of zones) {
    zonesById.set(zone.id, zone);
    for (const room of zone.rooms ?? []) {
      rooms.set(room.id, {
        ...room,
        zoneId: room.zoneId ?? zone.id
      });
    }
    for (const npc of zone.npcs ?? []) {
      npcs.push({ ...npc, zoneId: zone.id });
    }
  }

  return {
    zones,
    zonesById,
    rooms,
    npcs,
    catalogs,
    startRoomId: zonesById.get("town")?.spawnRoom ?? "town:temple"
  };
}

async function loadCatalogs() {
  const [items, classes, skills, spells, races] = await Promise.all([
    fetchCatalog("items.json", "items"),
    fetchCatalog("classes.json", "classes"),
    fetchCatalog("skills.json", "skills"),
    fetchCatalog("spells.json", "spells"),
    fetchCatalog("races.json", "races")
  ]);

  return {
    items,
    classes,
    skills,
    spells,
    races,
    itemsById: new Map(items.map((item) => [item.id, item])),
    classesById: new Map(classes.map((classDef) => [classDef.id, classDef])),
    skillsById: new Map(skills.map((skill) => [skill.id, skill])),
    spellsById: new Map(spells.map((spell) => [spell.id, spell])),
    racesById: new Map(races.map((race) => [race.id, race]))
  };
}

async function fetchCatalog(file, key) {
    const response = await fetch(`${WORLD_ROOT}/world/${file}`);
    if (!response.ok) throw new Error(`Failed to load ${file}: ${response.status}`);
  const data = await response.json();
  return data[key] ?? [];
}

export function assetUrl(path) {
  if (!path) return "";
  return `${WORLD_ROOT}${path}`;
}

export function npcSpritePath(npc) {
  const spriteId = (npc.spriteOverride || npc.id).replace(":", "_");
  return `${WORLD_ROOT}/assets/images/npcs/${spriteId}.webp`;
}

export function roomPosition(room, scale = 8) {
  return {
    x: room.x * scale,
    y: (room.z ?? 0) * 3.2,
    z: -room.y * scale
  };
}

export function sortedDirections(directions) {
  return [...directions].sort((a, b) => (directionRank[a] ?? 99) - (directionRank[b] ?? 99));
}
