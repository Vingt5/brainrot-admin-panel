import { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { RarityBadge } from '@/components/RarityBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { mockPlayers, mockPlayerStats, mockPlayerInventory } from '@/lib/mock-data';
import type { PlayerAdminView } from '@/lib/types';
import { Search, User, Package, Star, Heart, Trophy, Clock } from 'lucide-react';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function PlayerDetailSheet({ player }: { player: PlayerAdminView }) {
  const stats = mockPlayerStats;
  const inventory = mockPlayerInventory;

  return (
    <SheetContent className="w-[480px] sm:max-w-[480px] bg-card border-border overflow-auto">
      <SheetHeader>
        <SheetTitle className="text-foreground flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          {player.username}
        </SheetTitle>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-md bg-muted/50 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Discord ID</p>
            <p className="text-xs font-mono text-foreground">{player.discordUserId}</p>
          </div>
          <div className="p-3 rounded-md bg-muted/50 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Global Name</p>
            <p className="text-xs text-foreground">{player.globalName || '—'}</p>
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

        {/* Stats */}
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

        {/* Inventory preview */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Inventaire ({inventory.length} entrées)
          </h3>
          <div className="space-y-2">
            {inventory.map((entry) => (
              <div key={entry.brainrot.databaseId} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                <RarityBadge rarity={entry.brainrot.rarity} />
                <span className="text-sm text-foreground flex-1 truncate">{entry.brainrot.name}</span>
                <span className="text-xs text-muted-foreground">×{entry.quantity}</span>
                {entry.isFavorite && <Heart className="h-3 w-3 text-destructive fill-destructive" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </SheetContent>
  );
}

export default function PlayersPage() {
  const [search, setSearch] = useState('');
  const players = mockPlayers.filter(
    (p) => !search || p.username.toLowerCase().includes(search.toLowerCase()) || p.discordUserId.includes(search)
  );

  return (
    <>
      <TopBar title="Players" subtitle={`${mockPlayers.length} joueurs enregistrés`}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Chercher un joueur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 w-64 bg-muted border-border text-sm"
          />
        </div>
      </TopBar>
      <main className="flex-1 overflow-auto p-6">
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Username</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Discord ID</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Guilds</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Inventaire</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">Score</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Dernier roll</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <Sheet key={player.id}>
                    <SheetTrigger asChild>
                      <TableRow className="border-border cursor-pointer hover:bg-accent/50">
                        <TableCell className="font-medium text-foreground text-sm">{player.username}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{player.discordUserId}</TableCell>
                        <TableCell className="text-center text-sm text-foreground">{player.guildCount}</TableCell>
                        <TableCell className="text-center text-sm text-foreground">{player.inventoryCount}</TableCell>
                        <TableCell className="text-center text-sm text-foreground tabular-nums">{player.score}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(player.lastRollAt)}</TableCell>
                      </TableRow>
                    </SheetTrigger>
                    <PlayerDetailSheet player={player} />
                  </Sheet>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
