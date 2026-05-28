import { WORLD_ROOT } from "./world-data.js";
import {
  buildForestEdgeRoom,
  buildForestPathRoom,
  buildForgeRoom,
  buildGenericRoom,
  buildMagicShopRoom,
  buildMarketRoom,
  buildNorthGateRoom,
  buildTavernRoom,
  buildTempleRoom,
  buildTownSquareRoom
} from "./room-scenes.js";

export function buildRoomScene(context) {
  const { roomId, world, serverAuthoritative = false, serverNpcs = [], serverItems = [], onExit } = context;
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
      npcs: serverAuthoritative ? serverNpcs : world.npcs.filter((npc) => npc.startRoomId === "town:square"),
      roomItems: serverItems
    });
  }

  if (roomId === "town:tavern") {
    return buildTavernRoom({
      ...context,
      worldRoot: WORLD_ROOT,
      npcs: serverAuthoritative ? serverNpcs : world.npcs.filter((npc) => npc.startRoomId === "town:tavern"),
      roomItems: serverItems
    });
  }

  if (roomId === "town:market") {
    return buildMarketRoom({
      ...context,
      worldRoot: WORLD_ROOT,
      npcs: serverAuthoritative ? serverNpcs : world.npcs.filter((npc) => npc.startRoomId === "town:market"),
      roomItems: serverItems
    });
  }

  if (roomId === "town:magic_shop") {
    return buildMagicShopRoom({
      ...context,
      worldRoot: WORLD_ROOT,
      npcs: serverAuthoritative ? serverNpcs : world.npcs.filter((npc) => npc.startRoomId === "town:magic_shop"),
      roomItems: serverItems
    });
  }

  if (roomId === "town:forge") {
    return buildForgeRoom({
      ...context,
      worldRoot: WORLD_ROOT,
      npcs: serverAuthoritative ? serverNpcs : world.npcs.filter((npc) => npc.startRoomId === "town:forge"),
      roomItems: serverItems
    });
  }

  if (roomId === "town:gate") {
    return buildNorthGateRoom({
      ...context,
      worldRoot: WORLD_ROOT,
      npcs: serverAuthoritative ? serverNpcs : world.npcs.filter((npc) => npc.startRoomId === "town:gate"),
      roomItems: serverItems
    });
  }

  if (roomId === "forest:edge") {
    return buildForestEdgeRoom({
      ...context,
      worldRoot: WORLD_ROOT,
      npcs: serverAuthoritative ? serverNpcs : world.npcs.filter((npc) => npc.startRoomId === "forest:edge"),
      roomItems: serverItems
    });
  }

  if (roomId === "forest:path") {
    return buildForestPathRoom({
      ...context,
      worldRoot: WORLD_ROOT,
      npcs: serverAuthoritative ? serverNpcs : world.npcs.filter((npc) => npc.startRoomId === "forest:path"),
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
