
/* =========================================================
   TUNING. Every balance number lives here so it can move
   straight into a ScriptableObject / DataAsset when porting.
   ========================================================= */
export const CFG = {
  half: 6, arenaHalf: 12,
  baseSpeed: 9, minSpeed: 5.5, maxSpeed: 14.5,
  steer: 12,
  jumpV: 9.5, gravity: 24,
  packC: 0.36,                 // crowd packing density
  tierHP:   [1, 5, 25],        // HP per unit of each tier
  tierArea: [1, 2.2, 4.6],     // footprint used for crowd packing
  mergeN: 5,                   // 5 of a tier merge into 1 of the next
  cap: [420, 140, 60],         // max rendered instances per tier (the count itself is not capped)
  melee:  [2, 8, 30],           // damage per unit per second when touching a wall, gate or boss
  ranged: [0, 4, 14],          // ranged damage per unit per second (tier 0 has no gun)
  splash: 3.2,                 // titan splash radius
  volley: 0.3, range: 44,
  grace: 0.14,                 // seconds a unit can hang over the void before it falls
  crumbleDelay: 2.0,
  maxUnits: 6000,
  wallBite: 3,                 // HP lost per second while pushing a spiked wall
};
export const COL = { tier:[0x3d7bf0,0x16a99b,0xf2b929], enemy:0xc73a33, pos:0x3d7bf0, neg:0xe0483f };
