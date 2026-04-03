import type { Rarity } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const rarityConfig: Record<Rarity, { label: string; className: string }> = {
  common: { label: 'Commun', className: 'text-rarity-common border-rarity-common/30 bg-rarity-common/10' },
  rare: { label: 'Rare', className: 'text-rarity-rare border-rarity-rare/30 bg-rarity-rare/10' },
  epic: { label: 'Épique', className: 'text-rarity-epic border-rarity-epic/30 bg-rarity-epic/10' },
  legendary: { label: 'Légendaire', className: 'text-rarity-legendary border-rarity-legendary/30 bg-rarity-legendary/10' },
  mythic: { label: 'Mythique', className: 'text-rarity-mythic border-rarity-mythic/30 bg-rarity-mythic/10' },
};

export function RarityBadge({ rarity, className }: { rarity: Rarity; className?: string }) {
  const config = rarityConfig[rarity];
  return (
    <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider font-medium', config.className, className)}>
      {config.label}
    </Badge>
  );
}
