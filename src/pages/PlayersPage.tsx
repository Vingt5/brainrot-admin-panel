import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Heart, Package, Search, Star, Trophy, TriangleAlert, User } from 'lucide-react';

import { RarityBadge } from '@/components/RarityBadge';
import { ResultsPagination } from '@/components/ResultsPagination';
import { TopBar } from '@/components/TopBar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchPlayerDetail, fetchPlayerInventory, fetchPlayers, fetchPlayerStats } from '@/lib/api';
import type { PlayerAdminView } from '@/lib/types';

function formatDate(iso: string | null): string {
  if (!iso) return '--';

  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function PlayerDetailSheet({
  playerId,
  open,
  onOpenChange
}: {
  playerId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const detailQuery = useQuery({
    queryKey: ['player-detail', playerId],
    queryFn: () => fetchPlayerDetail(playerId!),
    enabled: open && playerId !== null
  });
  const statsQuery = useQuery({
    queryKey: ['player-stats', playerId],
    queryFn: () => fetchPlayerStats(playerId!),
    enabled: open && playerId !== null
  });
  const inventoryQuery = useQuery({
    queryKey: ['player-inventory', playerId],
    queryFn: () => fetchPlayerInventory(playerId!),
    enabled: open && playerId !== null
  });

  const player = detailQuery.data;
  const stats = statsQuery.data;
  const inventory = inventoryQuery.data ?? [];
  const isLoading = detailQuery.isLoading || statsQuery.isLoading || inventoryQuery.isLoading;
  const error = detailQuery.error || statsQuery.error || inventoryQuery.error;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] bg-card border-border overflow-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {player?.username ?? 'Player details'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Vue detaillee du profil, des statistiques et de l inventaire du joueur selectionne.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Chargement impossible</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'Impossible de charger ce joueur.'}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && !player ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </>
          ) : player ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-muted/50 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Discord ID</p>
                  <p className="text-xs font-mono text-foreground">{player.discordUserId}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Global name</p>
                  <p className="text-xs text-foreground">{player.globalName || '--'}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Inscrit</p>
                  <p className="text-xs text-foreground">{formatDate(player.createdAt)}</p>
                </div>
                <div className="p-3 rounded-md bg-muted/50 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dernier roll</p>
                  <p className="text-xs text-foreground">{formatDate(player.lastRollAt)}</p>
                </div>
              </div>

              {stats && (
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Stats</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <Package className="h-3.5 w-3.5 mx-auto mb-1 text-primary" />
                      <p className="text-lg font-semibold text-foreground">{stats.totalBrainrots}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <Trophy className="h-3.5 w-3.5 mx-auto mb-1 text-warning" />
                      <p className="text-lg font-semibold text-foreground">{stats.score}</p>
                      <p className="text-[10px] text-muted-foreground">Score</p>
                    </div>
                    <div className="text-center p-2 rounded-md bg-muted/50">
                      <Star className="h-3.5 w-3.5 mx-auto mb-1 text-rarity-epic" />
                      <p className="text-lg font-semibold text-foreground">{stats.uniqueBrainrots}</p>
                      <p className="text-[10px] text-muted-foreground">Uniques</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Inventaire ({inventory.length} entrees)
                </h3>
                <div className="space-y-2">
                  {inventory.length > 0 ? (
                    inventory.map((entry) => (
                      <div
                        key={entry.brainrot.databaseId}
                        className="flex items-center gap-3 p-2 rounded-md bg-muted/30"
                      >
                        <RarityBadge rarity={entry.brainrot.rarity} />
                        <span className="text-sm text-foreground flex-1 truncate">{entry.brainrot.name}</span>
                        <span className="text-xs text-muted-foreground">x{entry.quantity}</span>
                        {entry.isFavorite && <Heart className="h-3 w-3 text-destructive fill-destructive" />}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune possession pour ce joueur.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Selectionne un joueur pour voir ses details.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function PlayersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const deferredSearch = useDeferredValue(search);

  const playersQuery = useQuery({
    queryKey: ['players', deferredSearch, page],
    queryFn: () => fetchPlayers({ page, search: deferredSearch || undefined })
  });

  const players = playersQuery.data?.data ?? [];
  const error = playersQuery.error;

  return (
    <>
      <TopBar title="Players" subtitle={`${playersQuery.data?.total ?? 0} joueurs enregistres`}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Chercher un joueur..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="pl-8 h-8 w-64 bg-muted border-border text-sm"
          />
        </div>
      </TopBar>

      <main className="flex-1 overflow-auto p-6 space-y-4">
        {error && (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Liste indisponible</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Impossible de charger les joueurs.'}
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Username</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Discord ID</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Guilds</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Copies</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Score</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Dernier roll</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playersQuery.isLoading
                  ? Array.from({ length: 8 }, (_, index) => (
                      <TableRow key={index} className="border-border">
                        <TableCell colSpan={6}>
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : players.map((player: PlayerAdminView) => (
                      <TableRow
                        key={player.id}
                        className="border-border cursor-pointer hover:bg-accent/50"
                        onClick={() => setSelectedPlayerId(player.id)}
                      >
                        <TableCell className="font-medium text-foreground text-sm">{player.username}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{player.discordUserId}</TableCell>
                        <TableCell className="text-center text-sm text-foreground">{player.guildCount}</TableCell>
                        <TableCell className="text-center text-sm text-foreground">{player.inventoryCount}</TableCell>
                        <TableCell className="text-center text-sm text-foreground tabular-nums">{player.score}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(player.lastRollAt)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>

            {!playersQuery.isLoading && players.length === 0 && (
              <div className="p-8 text-sm text-muted-foreground">Aucun joueur ne correspond a cette recherche.</div>
            )}

            {playersQuery.data && playersQuery.data.total > 0 && (
              <ResultsPagination
                page={playersQuery.data.page}
                pageSize={playersQuery.data.pageSize}
                total={playersQuery.data.total}
                onPageChange={setPage}
              />
            )}
          </CardContent>
        </Card>

        <PlayerDetailSheet
          playerId={selectedPlayerId}
          open={selectedPlayerId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedPlayerId(null);
            }
          }}
        />
      </main>
    </>
  );
}
