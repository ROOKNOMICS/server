export function mean(arr: (number | null)[]): number {
  const valid = arr.filter((x): x is number => x !== null && !isNaN(x));
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export function stdDev(arr: (number | null)[]): number {
  const avg = mean(arr);
  const squaredDiffs = arr
    .filter((x): x is number => x !== null)
    .map(x => (x - avg) ** 2);
  return Math.sqrt(mean(squaredDiffs));
}

export function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return Math.round(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
