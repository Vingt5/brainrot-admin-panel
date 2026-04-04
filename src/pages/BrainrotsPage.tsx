import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, Search, Sparkles, Star, Tag, TriangleAlert, Users } from 'lucide-react';

import { RarityBadge } from '@/components/RarityBadge';
import { ResultsPagination } from '@/components/ResultsPagination';
import { TopBar } from '@/components/TopBar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchBrainrotDetail, fetchBrainrots } from '@/lib/api';
import type { BrainrotAdminView } from '@/lib/types';

const sourceStatusLabels: Record<string, string> = {
  canon: 'Canon',
  popular_variant: 'Variante populaire',
  uncertain: 'Incertain'
};

function BrainrotDetailSheet({
  brainrotId,
  open,
  onOpenChange
}: {
  brainrotId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useQuery({
    queryKey: ['brainrot-detail', brainrotId],
    queryFn: () => fetchBrainrotDetail(brainrotId!),
    enabled: open && brainrotId !== null
  });

  const brainrot = detailQuery.data;
  const error = detailQuery.error;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] bg-card border-border overflow-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {brainrot?.name ?? 'Brainrot details'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Vue detaillee du brainrot selectionne, avec ses metadonnees et ses statistiques d usage.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Chargement impossible</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'Impossible de charger ce brainrot.'}
              </AlertDescription>
            </Alert>
          )}

          {detailQuery.isLoading && !brainrot ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          ) : brainrot ? (
            <>
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
                <p className="text-xs text-muted-foreground">
                  Le catalogue reste pilote par <code className="font-mono text-foreground">bot/data/brainrots.seed.json</code>.
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Selectionne un brainrot pour voir ses details.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function BrainrotsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [selectedBrainrotId, setSelectedBrainrotId] = useState<number | null>(null);
  const deferredSearch = useDeferredValue(search);

  const brainrotsQuery = useQuery({
    queryKey: ['brainrots', deferredSearch, rarityFilter, page],
    queryFn: () =>
      fetchBrainrots({
        page,
        search: deferredSearch || undefined,
        rarity: rarityFilter === 'all' ? undefined : rarityFilter
      })
  });

  const brainrots = brainrotsQuery.data?.data ?? [];
  const error = brainrotsQuery.error;

  return (
    <>
      <TopBar title="Brainrots" subtitle={`${brainrotsQuery.data?.total ?? 0} dans le catalogue`}>
        <Select
          value={rarityFilter}
          onValueChange={(value) => {
            setRarityFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-36 bg-muted border-border text-sm">
            <SelectValue placeholder="Rareté" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="common">Commun</SelectItem>
            <SelectItem value="rare">Rare</SelectItem>
            <SelectItem value="epic">Epic</SelectItem>
            <SelectItem value="legendary">Legendary</SelectItem>
            <SelectItem value="mythic">Mythic</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Chercher..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="pl-8 h-8 w-48 bg-muted border-border text-sm"
          />
        </div>
      </TopBar>

      <main className="flex-1 overflow-auto p-6 space-y-4">
        {error && (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Catalogue indisponible</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Impossible de charger les brainrots.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {brainrotsQuery.isLoading
            ? Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-40 w-full" />)
            : brainrots.map((brainrot: BrainrotAdminView) => (
                <Card
                  key={brainrot.databaseId}
                  className="bg-card border-border cursor-pointer hover:bg-accent/30 transition-colors group"
                  onClick={() => setSelectedBrainrotId(brainrot.databaseId)}
                >
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

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {brainrot.description}
                    </p>

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
              ))}
        </div>

        {!brainrotsQuery.isLoading && brainrots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Sparkles className="h-8 w-8 mb-3 opacity-30" />
            <p className="text-sm">Aucun brainrot trouve</p>
          </div>
        )}

        {brainrotsQuery.data && brainrotsQuery.data.total > 0 && (
          <Card className="bg-card border-border">
            <ResultsPagination
              page={brainrotsQuery.data.page}
              pageSize={brainrotsQuery.data.pageSize}
              total={brainrotsQuery.data.total}
              onPageChange={setPage}
            />
          </Card>
        )}

        <BrainrotDetailSheet
          brainrotId={selectedBrainrotId}
          open={selectedBrainrotId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedBrainrotId(null);
            }
          }}
        />
      </main>
    </>
  );
}
