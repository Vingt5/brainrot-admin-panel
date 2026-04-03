import { rarityValues, type BrainrotRecord, type Rarity } from '../../core/types.js';
import { rarityWeightMap } from '../../config/game.js';
import { pickRandom, pickWeighted } from '../../utils/random.js';
import { BrainrotRepository } from './brainrotRepository.js';

export type BrainrotResolutionResult =
  | { kind: 'success'; brainrot: BrainrotRecord }
  | { kind: 'not_found'; query: string }
  | { kind: 'ambiguous'; query: string; candidates: BrainrotRecord[] };

function normalizeQuery(value: string): string {
  return value.trim().toLocaleLowerCase('fr-FR');
}

function getRarityRank(rarity: Rarity): number {
  switch (rarity) {
    case 'mythic':
      return 5;
    case 'legendary':
      return 4;
    case 'epic':
      return 3;
    case 'rare':
      return 2;
    case 'common':
    default:
      return 1;
  }
}

function deduplicateBrainrots(brainrots: readonly BrainrotRecord[]): BrainrotRecord[] {
  const uniqueById = new Map<number, BrainrotRecord>();

  for (const brainrot of brainrots) {
    uniqueById.set(brainrot.databaseId, brainrot);
  }

  return [...uniqueById.values()].sort((left, right) => {
    const rarityDelta = getRarityRank(right.rarity) - getRarityRank(left.rarity);

    if (rarityDelta !== 0) {
      return rarityDelta;
    }

    return left.name.localeCompare(right.name, 'fr-FR');
  });
}

function getSearchScore(brainrot: BrainrotRecord, normalizedQuery: string): number {
  const normalizedName = normalizeQuery(brainrot.name);
  const normalizedSlug = normalizeQuery(brainrot.slug);
  const normalizedAliases = brainrot.aliases.map(normalizeQuery);

  if (normalizedName === normalizedQuery) {
    return 120;
  }

  if (normalizedSlug === normalizedQuery) {
    return 115;
  }

  if (normalizedAliases.includes(normalizedQuery)) {
    return 110;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 90;
  }

  if (normalizedSlug.startsWith(normalizedQuery)) {
    return 85;
  }

  if (normalizedAliases.some((alias) => alias.startsWith(normalizedQuery))) {
    return 80;
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 60;
  }

  if (normalizedSlug.includes(normalizedQuery)) {
    return 55;
  }

  if (normalizedAliases.some((alias) => alias.includes(normalizedQuery))) {
    return 50;
  }

  return 0;
}

export class BrainrotService {
  public constructor(private readonly brainrotRepository: BrainrotRepository) {}

  public getRandomBrainrot(): BrainrotRecord | null {
    const brainrots = this.brainrotRepository.findAll();

    if (brainrots.length === 0) {
      return null;
    }

    const groupedByRarity = new Map<Rarity, BrainrotRecord[]>();

    for (const rarity of rarityValues) {
      groupedByRarity.set(rarity, []);
    }

    for (const brainrot of brainrots) {
      groupedByRarity.get(brainrot.rarity)?.push(brainrot);
    }

    const availableRarities = rarityValues
      .map((rarity) => ({
        item: rarity,
        weight: (groupedByRarity.get(rarity)?.length ?? 0) > 0 ? rarityWeightMap[rarity] : 0
      }))
      .filter((entry) => entry.weight > 0);

    if (availableRarities.length === 0) {
      return null;
    }

    const selectedRarity = pickWeighted(availableRarities);
    const candidates = groupedByRarity.get(selectedRarity) ?? [];

    if (candidates.length === 0) {
      return null;
    }

    return pickRandom(candidates);
  }

  public findByDatabaseId(id: number): BrainrotRecord | null {
    return this.brainrotRepository.findByDatabaseId(id);
  }

  public countBrainrots(): number {
    return this.brainrotRepository.count();
  }

  public resolveExact(query: string): BrainrotResolutionResult {
    const normalizedQuery = normalizeQuery(query);

    if (!normalizedQuery) {
      return {
        kind: 'not_found',
        query
      };
    }

    const matches = deduplicateBrainrots(
      this.brainrotRepository.findAll().filter((brainrot) => {
        if (normalizeQuery(brainrot.name) === normalizedQuery) {
          return true;
        }

        if (normalizeQuery(brainrot.slug) === normalizedQuery) {
          return true;
        }

        return brainrot.aliases.some((alias) => normalizeQuery(alias) === normalizedQuery);
      })
    );

    if (matches.length === 0) {
      return {
        kind: 'not_found',
        query
      };
    }

    if (matches.length > 1) {
      return {
        kind: 'ambiguous',
        query,
        candidates: matches
      };
    }

    return {
      kind: 'success',
      brainrot: matches[0]!
    };
  }

  public search(query: string, limit: number): BrainrotRecord[] {
    const normalizedQuery = normalizeQuery(query);

    if (!normalizedQuery) {
      return [];
    }

    return this.brainrotRepository
      .findAll()
      .map((brainrot) => ({
        brainrot,
        score: getSearchScore(brainrot, normalizedQuery)
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => {
        const scoreDelta = right.score - left.score;

        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        const rarityDelta = getRarityRank(right.brainrot.rarity) - getRarityRank(left.brainrot.rarity);

        if (rarityDelta !== 0) {
          return rarityDelta;
        }

        return left.brainrot.name.localeCompare(right.brainrot.name, 'fr-FR');
      })
      .slice(0, limit)
      .map((entry) => entry.brainrot);
  }
}
