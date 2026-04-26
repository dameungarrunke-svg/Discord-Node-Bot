// Tiny Levenshtein-based "did you mean?" helper used by router for misspellings.
function lev(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[] = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) dp[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

export function suggestClosest(input: string, known: string[], maxResults = 3): string[] {
  const inp = input.toLowerCase();
  const scored = known
    .map((k) => ({ k, d: lev(inp, k.toLowerCase()) }))
    .filter((x) => x.d <= Math.max(2, Math.floor(inp.length / 3)))
    .sort((a, b) => a.d - b.d)
    .slice(0, maxResults)
    .map((x) => x.k);
  return scored;
}
