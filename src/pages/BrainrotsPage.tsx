import { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { RarityBadge } from '@/components/RarityBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { mockBrainrots } from '@/lib/mock-data';
import type { BrainrotAdminView, Rarity } from '@/lib/types';
import { Search, Sparkles, Users, Star, Heart, Tag } from 'lucide-react';

const sourceStatusLabels: Record<string, string> = {
  canon: 'Canon',
  popular_variant: 'Variante populaire',
  uncertain: 'Incertain',
};

function BrainrotDetailSheet({ brainrot }: { brainrot: BrainrotAdminView }) {
  return (
    <SheetContent className="w-[480px] sm:max-w-[480px] bg-card border-border overflow-auto">
      <SheetHeader>
        <SheetTitle className="text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {brainrot.name}
        </SheetTitle>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          <RarityBadge rarity={brainrot.rarity} />
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            {sourceStatusLabels[brainrot.sourceStatus]}
          </Badge>
          <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
            {brainrot.id}
          </Badge>
        </div>

        <p className="text-sm text-secondary-foreground leading-relaxed">{brainrot.description}</p>

        {brainrot.aliases.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="h-3 w-3" /> Aliases
            </h3>
            <div className="flex gap-1.5 flex-wrap">
              {brainrot.aliases.map((alias) => (
                <Badge key={alias} variant="secondary" className="text-xs">
                  {alias}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-md bg-muted/50 space-y-1 text-center">
            <Users className="h-3.5 w-3.5 mx-auto text-primary" />
            <p className="text-lg font-semibold text-foreground">{brainrot.ownerCount}</p>
            <p className="text-[10px] text-muted-foreground">Owners</p>
          </div>
          <div className="p-3 rounded-md bg-muted/50 space-y-1 text-center">
            <Sparkles className="h-3.5 w-3.5 mx-auto text-primary" />
            <p className="text-lg font-semibold text-foreground">{brainrot.totalOwned}</p>
            <p className="text-[10px] text-muted-foreground">Total owned</p>
          </div>
          <div className="p-3 rounded-md bg-muted/50 space-y-1 text-center">
            <Star className="h-3.5 w-3.5 mx-auto text-warning" />
            <p className="text-lg font-semibold text-foreground">{brainrot.wishCount}</p>
            <p className="text-[10px] text-muted-foreground">Wishes</p>
          </div>
          <div className="p-3 rounded-md bg-muted/50 space-y-1 text-center">
            <Heart className="h-3.5 w-3.5 mx-auto text-destructive" />
            <p className="text-lg font-semibold text-foreground">{brainrot.favoriteCount}</p>
            <p className="text-[10px] text-muted-foreground">Favorites</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-md bg-muted/50 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Slug</p>
            <p className="text-xs font-mono text-foreground">{brainrot.slug}</p>
          </div>
          <div className="p-3 rounded-md bg-muted/50 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Source</p>
            <p className="text-xs text-foreground">{sourceStatusLabels[brainrot.sourceStatus]}</p>
          </div>
        </div>

        <div className="p-3 rounded-md bg-warning/5 border border-warning/20">
          <p className="text-[10px] uppercase tracking-wider text-warning font-medium mb-1">Seed-managed</p>
          <p className="text-xs text-muted-foreground">Ce brainrot est piloté par <code className="font-mono text-foreground">data/brainrots.seed.json</code>. Les modifications passent par le fichier seed puis le script <code className="font-mono text-foreground">db:seed</code>.</p>
        </div>
      </div>
    </SheetContent>
  );
}

export default function BrainrotsPage() {
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  const brainrots = mockBrainrots.filter((b) => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.slug.includes(search.toLowerCase());
    const matchRarity = rarityFilter === 'all' || b.rarity === rarityFilter;
    return matchSearch && matchRarity;
  });

  return (
    <>
      <TopBar title="Brainrots" subtitle={`${mockBrainrots.length} dans le catalogue`}>
        <Select value={rarityFilter} onValueChange={setRarityFilter}>
          <SelectTrigger className="h-8 w-36 bg-muted border-border text-sm">
            <SelectValue placeholder="Rareté" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="common">Commun</SelectItem>
            <SelectItem value="rare">Rare</SelectItem>
            <SelectItem value="epic">Épique</SelectItem>
            <SelectItem value="legendary">Légendaire</SelectItem>
            <SelectItem value="mythic">Mythique</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Chercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 w-48 bg-muted border-border text-sm"
          />
        </div>
      </TopBar>
      <main className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {brainrots.map((brainrot) => (
            <Sheet key={brainrot.databaseId}>
              <SheetTrigger asChild>
                <Card className="bg-card border-border cursor-pointer hover:bg-accent/30 transition-colors group">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {brainrot.name}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground truncate">{brainrot.slug}</p>
                      </div>
                      <RarityBadge rarity={brainrot.rarity} />
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{brainrot.description}</p>

                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {brainrot.ownerCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" /> {brainrot.wishCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {brainrot.favoriteCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </SheetTrigger>
              <BrainrotDetailSheet brainrot={brainrot} />
            </Sheet>
          ))}
        </div>

        {brainrots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Sparkles className="h-8 w-8 mb-3 opacity-30" />
            <p className="text-sm">Aucun brainrot trouvé</p>
          </div>
        )}
      </main>
    </>
  );
}
