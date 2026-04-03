import { rarityColorMap, rarityLabelMap, rarityScoreMap } from '../../config/game.js';
import type { Rarity, SourceStatus } from '../../core/types.js';

export interface RarityVisualTheme {
  color: number;
  icon: string;
  shortIcon: string;
  titlePrefix: string;
  flavor: string;
}

const numberFormatter = new Intl.NumberFormat('fr-FR');

export const rarityVisualThemeMap: Record<Rarity, RarityVisualTheme> = {
  common: {
    color: rarityColorMap.common,
    icon: '⬜',
    shortIcon: '◽',
    titlePrefix: 'Signal brut',
    flavor: 'Diffusion standard, parfaitement collectionnable.'
  },
  rare: {
    color: rarityColorMap.rare,
    icon: '🔷',
    shortIcon: '◆',
    titlePrefix: 'Signal rare',
    flavor: 'Drop convoité avec une bonne densité de chaos.'
  },
  epic: {
    color: rarityColorMap.epic,
    icon: '🟣',
    shortIcon: '⬣',
    titlePrefix: 'Signal épique',
    flavor: 'Un brainrot nerveux avec une vraie présence de collection.'
  },
  legendary: {
    color: rarityColorMap.legendary,
    icon: '🟠',
    shortIcon: '⬢',
    titlePrefix: 'Signal légendaire',
    flavor: 'Drop premium à verrouiller avant tout le salon.'
  },
  mythic: {
    color: rarityColorMap.mythic,
    icon: '🟥',
    shortIcon: '✦',
    titlePrefix: 'Signal mythique',
    flavor: 'Niveau critique. Chaque seconde compte sur ce drop.'
  }
};

export const sourceStatusLabelMap: Record<SourceStatus, string> = {
  canon: 'Canon',
  popular_variant: 'Variante populaire',
  uncertain: 'Origine incertaine'
};

export const sourceStatusIconMap: Record<SourceStatus, string> = {
  canon: '📚',
  popular_variant: '🌀',
  uncertain: '❔'
};

export function getRarityDisplay(rarity: Rarity): string {
  return `${rarityVisualThemeMap[rarity].icon} ${rarityLabelMap[rarity]}`;
}

export function getRarityValueDisplay(rarity: Rarity): string {
  return `${formatInteger(rarityScoreMap[rarity])} pts`;
}

export function formatDiscordTimestamp(iso: string, style: 'R' | 'f' | 't' = 'R'): string {
  return `<t:${Math.floor(Date.parse(iso) / 1000)}:${style}>`;
}

export function formatInteger(value: number): string {
  return numberFormatter.format(value);
}

export function buildProgressBar(current: number, total: number, width = 10): string {
  if (total <= 0) {
    return '░'.repeat(width);
  }

  const ratio = Math.min(Math.max(current / total, 0), 1);
  const filledWidth =
    current > 0 ? Math.max(1, Math.round(ratio * width)) : 0;

  return `${'█'.repeat(filledWidth)}${'░'.repeat(width - filledWidth)}`;
}

export function formatCompletion(current: number, total: number): string {
  if (total <= 0) {
    return '0%';
  }

  return `${Math.round((current / total) * 100)}%`;
}

export function getLeaderboardRankIcon(index: number): string {
  switch (index) {
    case 0:
      return '🥇';
    case 1:
      return '🥈';
    case 2:
      return '🥉';
    default:
      return '•';
  }
}

export function truncateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) {
    return label;
  }

  return `${label.slice(0, Math.max(1, maxLength - 1))}…`;
}
