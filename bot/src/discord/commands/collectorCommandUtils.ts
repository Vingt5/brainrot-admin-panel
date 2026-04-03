import type { BrainrotRecord } from '../../core/types.js';

export function formatBrainrotCandidates(candidates: readonly BrainrotRecord[]): string {
  return candidates.slice(0, 5).map((candidate) => `• ${candidate.name}`).join('\n');
}

export function formatResolutionError(result: {
  kind: 'not_found' | 'ambiguous';
  query: string;
  candidates?: BrainrotRecord[];
}): string {
  if (result.kind === 'not_found') {
    return `Aucun brainrot exact trouvé pour \`${result.query}\`. Utilise \`/search\` ou \`%search\` pour explorer le catalogue.`;
  }

  return [
    `La recherche \`${result.query}\` est ambiguë.`,
    'Candidats possibles :',
    formatBrainrotCandidates(result.candidates ?? [])
  ].join('\n');
}
