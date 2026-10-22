/** Predictable swept pickup attraction and contact, independent from the renderer. */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function pickupStep({ position, player, speed, dt, kind = 'shield' }) {
  if (
    ![position.x, position.y, position.z, player.x, player.y, player.z, speed, dt].every(
      Number.isFinite,
    )
  )
    return { x: position.x, y: position.y, z: position.z, collected: false, attracted: false };
  const nextZ = position.z + Math.max(0, speed) * Math.max(0, dt);
  const pet = kind.startsWith('pet:');
  const contactRadius = pet ? 4.1 : 5.35;
  const magnetRadius = pet ? 8.5 : 10.5;
  const lateral = Math.hypot(position.x - player.x, position.y - player.y);
  // Attract only when the object is in the approach corridor, never behind the player.
  const approaching = nextZ > player.z - 38 && position.z < player.z + 3;
  const attracted = approaching && lateral < magnetRadius;
  const pull = attracted ? 1 - Math.exp(-(pet ? 5.8 : 6.8) * Math.max(0, dt)) : 0;
  const x = position.x + (player.x - position.x) * pull;
  const y = position.y + (player.y - position.y) * pull;
  // Swept collision avoids skipping the pickup plane during boost or low frame rate.
  const crossedPlane = position.z <= player.z + 4 && nextZ >= player.z - 4;
  const collected = crossedPlane && Math.hypot(x - player.x, y - player.y) <= contactRadius;
  return { x, y, z: nextZ, collected, attracted };
}
