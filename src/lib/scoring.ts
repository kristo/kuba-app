/**
 * Calculates points for a prediction.
 * - 2 pts for correct outcome (W/D/L)
 * - +3 pts bonus for exact score
 */
export function calcPoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  const predictedOutcome = Math.sign(predictedHome - predictedAway);
  const actualOutcome = Math.sign(actualHome - actualAway);

  if (predictedHome === actualHome && predictedAway === actualAway) return 5;
  if (predictedOutcome === actualOutcome) return 2;
  return 0;
}
