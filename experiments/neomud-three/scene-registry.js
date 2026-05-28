import { WORLD_ROOT } from "./world-data.js";
import { buildGenericRoom, buildNorthGateRoom, buildTavernRoom, buildTempleRoom, buildTownSquareRoom } from "./room-scenes.js";

export function buildRoomScene(context) {
  const { roomId, world, serverNpcs = [], serverItems = [], onExit } = context;
  const room = world.rooms.get(roomId);
  if (!room) return null;

  if (roomId === "town:temple") {
    return buildTempleRoom({
      ...context,
      worldRoot: WORLD_ROOT,
      onExit
    });
  }

  if (roomId === "town:square") {
    return buildTownSquareRoom({
      ...context,
      worldRoot: WORLD_ROOT,
      npcs: serverNpcs.length
        ? serverNpcs
        : world.npcs.filter((npc) => npc.startRoomId === "town:square"),
      roomItems: serverItems
    });
  }

  if (roomId === "town:tavern") {
    return buildTavernRoom({
      ...context,
      worldRoot: WORLD_ROOT,
      npcs: serverNpcs.length
        ? serverNpcs
        : world.npcs.filter((npc) => npc.startRoomId === "town:tavern"),
      roomItems: serverItems
    });
  }

  if (roomId === "town:gate") {
    return buildNorthGateRoom({
      ...context,
      worldRoot: WORLD_ROOT,
      npcs: serverNpcs.length
        ? serverNpcs
        : world.npcs.filter((npc) => npc.startRoomId === "town:gate"),
      roomItems: serverItems
    });
  }

  return buildGenericRoom({
    ...context,
    room,
    rooms: world.rooms,
    worldRoot: WORLD_ROOT
  });
}
