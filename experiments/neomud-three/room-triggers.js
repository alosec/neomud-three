export function exitForPosition(position, exits = []) {
  return exits.find((exit) => pointInTrigger(position, exit.trigger)) ?? null;
}

export function triggerDebugInfo(exits = []) {
  return exits.map((exit) => ({
    id: exit.id,
    direction: exit.direction,
    targetId: exit.targetId,
    prompt: exit.prompt,
    trigger: exit.trigger,
    affordance: exit.affordance
  }));
}

export function validateRoomRenderSpec(spec, room, rooms) {
  const errors = [];
  if (!spec?.id) errors.push("spec.id is required");
  if (!room) errors.push(`spec room ${spec?.id ?? "<missing>"} does not exist in world graph`);
  if (!Array.isArray(spec?.exits) || spec.exits.length === 0) errors.push(`${spec?.id ?? "<missing>"} must define exits`);

  const roomExits = room?.exits ?? {};
  const specDirections = new Set();
  for (const exit of spec?.exits ?? []) {
    const label = exit?.id ?? `${spec.id}:${exit?.direction ?? "unknown"}`;
    if (!exit?.id) errors.push(`${label} missing id`);
    if (!exit?.direction) errors.push(`${label} missing direction`);
    if (!exit?.targetId) errors.push(`${label} missing targetId`);
    if (!exit?.prompt) errors.push(`${label} missing prompt`);
    if (exit?.direction) specDirections.add(exit.direction);
    if (exit?.direction && roomExits[exit.direction] !== exit.targetId) {
      errors.push(`${label} target ${exit.targetId} does not match room graph ${exit.direction} -> ${roomExits[exit.direction] ?? "<missing>"}`);
    }
    if (exit?.targetId && !rooms?.has?.(exit.targetId)) {
      errors.push(`${label} target ${exit.targetId} does not exist in world graph`);
    }
    validateBoxTrigger(errors, label, exit?.trigger);
    validateAffordance(errors, label, exit?.affordance);
  }

  for (const [direction, targetId] of Object.entries(roomExits)) {
    if (!specDirections.has(direction)) {
      errors.push(`${spec.id} room graph exit ${direction} -> ${targetId} has no visual trigger`);
    }
  }

  const landmarkTargets = new Map((spec?.landmarks ?? []).map((landmark) => [landmark.direction, landmark.targetId]));
  for (const exit of spec?.exits ?? []) {
    if (landmarkTargets.get(exit.direction) !== exit.targetId) {
      errors.push(`${exit.id} has no matching landmark for ${exit.direction} -> ${exit.targetId}`);
    }
  }

  return errors;
}

function pointInTrigger(position, trigger) {
  if (!trigger || trigger.type !== "box") return false;
  const [cx, cy, cz] = trigger.center;
  const [sx, sy, sz] = trigger.size;
  return Math.abs(position.x - cx) <= sx / 2 &&
    Math.abs((position.y ?? 0) - cy) <= sy / 2 &&
    Math.abs(position.z - cz) <= sz / 2;
}

function validateBoxTrigger(errors, label, trigger) {
  if (!trigger) {
    errors.push(`${label} missing trigger`);
    return;
  }
  if (trigger.type !== "box") errors.push(`${label} trigger must use type "box"`);
  if (!isNumericTriple(trigger.center)) errors.push(`${label} trigger.center must be [x, y, z]`);
  if (!isNumericTriple(trigger.size)) errors.push(`${label} trigger.size must be [x, y, z]`);
  if (isNumericTriple(trigger.size) && trigger.size.some((value) => value <= 0)) {
    errors.push(`${label} trigger.size values must be positive`);
  }
}

function validateAffordance(errors, label, affordance) {
  if (!affordance) {
    errors.push(`${label} missing visible affordance`);
    return;
  }
  if (!affordance.label) errors.push(`${label} affordance missing label`);
  if (!affordance.board) {
    errors.push(`${label} affordance missing board`);
  } else {
    if (!isNumericTriple(affordance.board.center)) errors.push(`${label} affordance.board.center must be [x, y, z]`);
    if (!Array.isArray(affordance.board.size) || affordance.board.size.length !== 2 || affordance.board.size.some((value) => !Number.isFinite(value) || value <= 0)) {
      errors.push(`${label} affordance.board.size must be [width, height] with positive values`);
    }
  }
  if (!affordance.threshold) {
    errors.push(`${label} affordance missing threshold`);
  } else {
    if (!isNumericTriple(affordance.threshold.center)) errors.push(`${label} affordance.threshold.center must be [x, y, z]`);
    if (!Array.isArray(affordance.threshold.size) || affordance.threshold.size.length !== 2 || affordance.threshold.size.some((value) => !Number.isFinite(value) || value <= 0)) {
      errors.push(`${label} affordance.threshold.size must be [width, depth] with positive values`);
    }
  }
}

function isNumericTriple(value) {
  return Array.isArray(value) && value.length === 3 && value.every((item) => Number.isFinite(item));
}
