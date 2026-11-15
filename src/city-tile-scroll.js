// Preserve the continuity of the actual tile that is approaching the pilot.
// Swapping which tile is in front at odd wraps prevents a different district
// from instantly teleporting into the near slot at every 1,900-unit boundary.
// This stays pure and works without Three.js or a browser.
export const CITY_TILE_LENGTH = 1900;

export function cityTilePositions(visualTravel, tileLength = CITY_TILE_LENGTH) {
  if (!Number.isFinite(visualTravel) || visualTravel < 0)
    throw new RangeError('City travel must be finite and nonnegative');
  if (!Number.isFinite(tileLength) || tileLength <= 0)
    throw new RangeError('City tile length must be positive');

  const lap = Math.floor(visualTravel / tileLength);
  const phase = visualTravel - lap * tileLength;
  const civicIsApproaching = lap % 2 === 0;
  return {
    lap,
    phase,
    // The tile which was behind the pilot leaves at +1900 and wraps to
    // -1900. The other advances continuously from -epsilon to +epsilon.
    civic: civicIsApproaching ? phase : phase - tileLength,
    industrial: civicIsApproaching ? phase - tileLength : phase,
    approaching: civicIsApproaching ? 'civic' : 'industrial',
  };
}
