export function randomInteger(min: number, max: number): number {
  const lower = Math.ceil(min);
  const upper = Math.floor(max);

  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

export function pickRandom<T>(items: readonly T[]): T {
  const index = randomInteger(0, items.length - 1);
  const item = items[index];

  if (item === undefined) {
    throw new Error('Impossible de choisir un élément aléatoire dans un tableau vide.');
  }

  return item;
}

export function pickWeighted<T>(entries: readonly { item: T; weight: number }[]): T {
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    throw new Error('Impossible d’effectuer un tirage pondéré lorsque le poids total est nul.');
  }

  let cursor = Math.random() * totalWeight;

  for (const entry of entries) {
    cursor -= entry.weight;

    if (cursor <= 0) {
      return entry.item;
    }
  }

  const lastEntry = entries.at(-1);

  if (!lastEntry) {
    throw new Error('Impossible d’effectuer un tirage pondéré sur une liste vide.');
  }

  return lastEntry.item;
}
