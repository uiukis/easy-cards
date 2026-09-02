// Curated set/number pairs verified against the public Pokémon TCG image CDN
// (images.pokemontcg.io), spanning many eras for visual variety. Used purely
// as decorative flourishes — images are hotlinked from the public database,
// never redistributed.
const CARD_REFS = [
  "base1/4",
  "base1/2",
  "base1/6",
  "base1/9",
  "base1/15",
  "base1/58",
  "base1/60",
  "neo1/3",
  "neo1/9",
  "neo2/17",
  "gym1/2",
  "gym2/1",
  "base5/1",
  "base5/8",
  "ecard1/1",
  "ex1/1",
  "ex3/1",
  "ex12/1",
  "ex14/1",
  "dp1/1",
  "dp1/6",
  "pl1/1",
  "hgss1/1",
  "hgss4/1",
  "bw1/1",
  "bw1/20",
  "bw6/1",
  "xy1/1",
  "xy1/2",
  "xy7/1",
  "sm1/1",
  "sm1/20",
  "sm8/1",
  "swsh1/1",
  "swsh4/1",
  "swsh9/1",
  "swsh12/1",
  "sv1/1",
  "sv1/6",
  "sv2/1",
  "sv3/1",
  "sv4/1",
] as const;

export function randomCardImageUrls(count: number): string[] {
  const pool = [...CARD_REFS];
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(`https://images.pokemontcg.io/${pool[i]}.png`);
    pool.splice(i, 1);
  }
  return picked;
}
