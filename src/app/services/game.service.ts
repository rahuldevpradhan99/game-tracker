import { Injectable, signal, computed } from '@angular/core';
import { Game, GameStats, GameStatus } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly STORAGE_KEY = 'game-tracker-library';
  private readonly CLEANSED_FLAG = 'game-tracker-stock-cleaned-v1';

  private gamesSignal = signal<Game[]>(this.loadGames());

  readonly games = this.gamesSignal.asReadonly();

  readonly stats = computed<GameStats>(() => {
    const games = this.gamesSignal();
    const owned = games.filter((g) => g.status !== 'wishlist');
    const completed = games.filter((g) => g.status === 'completed');
    const rated = games.filter((g) => g.rating !== null);

    const platformMap = new Map<string, number>();
    const genreMap = new Map<string, number>();
    const monthMap = new Map<string, { added: number; completed: number }>();

    games.forEach((g) => {
      g.platform.forEach((p) => platformMap.set(p, (platformMap.get(p) || 0) + 1));
      g.genre.forEach((gen) => genreMap.set(gen, (genreMap.get(gen) || 0) + 1));

      const addedMonth = g.dateAdded.substring(0, 7);
      const entry = monthMap.get(addedMonth) || { added: 0, completed: 0 };
      entry.added++;
      monthMap.set(addedMonth, entry);

      if (g.dateCompleted) {
        const compMonth = g.dateCompleted.substring(0, 7);
        const compEntry = monthMap.get(compMonth) || { added: 0, completed: 0 };
        compEntry.completed++;
        monthMap.set(compMonth, compEntry);
      }
    });

    return {
      totalGames: games.length,
      completed: completed.length,
      playing: games.filter((g) => g.status === 'playing').length,
      backlog: games.filter((g) => g.status === 'backlog').length,
      dropped: games.filter((g) => g.status === 'dropped').length,
      wishlist: games.filter((g) => g.status === 'wishlist').length,
      onHold: games.filter((g) => g.status === 'on-hold').length,
      totalHoursPlayed: Math.round(owned.reduce((sum, g) => sum + (g.hoursPlayed || 0), 0) * 10) / 10,
      averageRating: rated.length > 0 ? rated.reduce((sum, g) => sum + (g.rating || 0), 0) / rated.length : 0,
      completionRate: owned.length > 0 ? (completed.length / owned.length) * 100 : 0,
      favoriteCount: games.filter((g) => g.favorite).length,
      platformBreakdown: Array.from(platformMap, ([platform, count]) => ({ platform, count })).sort(
        (a, b) => b.count - a.count,
      ),
      genreBreakdown: Array.from(genreMap, ([genre, count]) => ({ genre, count })).sort(
        (a, b) => b.count - a.count,
      ),
      monthlyActivity: Array.from(monthMap, ([month, data]) => ({ month, ...data })).sort((a, b) =>
        a.month.localeCompare(b.month),
      ),
      playstationGamesCount: games.filter((g) => g.platform.includes('PlayStation')).length,
      playstationCompletedCount: games.filter((g) => g.platform.includes('PlayStation') && g.status === 'completed').length,
    };
  });

  private loadGames(): Game[] {
    try {
      const stockTitles = new Set([
        'The Witcher 3: Wild Hunt',
        'Elden Ring',
        "Baldur's Gate 3",
        'Hollow Knight',
        'Cyberpunk 2077',
        'Hades',
        'Red Dead Redemption 2',
        'Celeste',
        'Silksong',
        'Stardew Valley',
        'Doom Eternal',
        'Ghost of Tsushima',
      ]);

      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed: Game[] = JSON.parse(data);
        // Automatically filter out stock games and sanitize floating-point playtime to 1 decimal place
        const userGames = parsed
          .filter((g) => !stockTitles.has(g.title))
          .map((g) => ({
            ...g,
            hoursPlayed: Math.round((g.hoursPlayed || 0) * 10) / 10,
          }));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userGames));
        return userGames;
      }
      return [];
    } catch {
      return [];
    }
  }

  private saveGames(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.gamesSignal()));
  }

  addGame(game: Omit<Game, 'id' | 'dateAdded'>): void {
    const newGame: Game = {
      ...game,
      hoursPlayed: Math.round((game.hoursPlayed || 0) * 10) / 10,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
    };
    this.gamesSignal.update((games) => [...games, newGame]);
    this.saveGames();
  }

  updateGame(id: string, updates: Partial<Game>): void {
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.hoursPlayed !== undefined) {
      sanitizedUpdates.hoursPlayed = Math.round(sanitizedUpdates.hoursPlayed * 10) / 10;
    }
    this.gamesSignal.update((games) => games.map((g) => (g.id === id ? { ...g, ...sanitizedUpdates } : g)));
    this.saveGames();
  }

  deleteGame(id: string): void {
    this.gamesSignal.update((games) => games.filter((g) => g.id !== id));
    this.saveGames();
  }

  getGame(id: string): Game | undefined {
    return this.gamesSignal().find((g) => g.id === id);
  }

  toggleFavorite(id: string): void {
    this.gamesSignal.update((games) =>
      games.map((g) => (g.id === id ? { ...g, favorite: !g.favorite } : g)),
    );
    this.saveGames();
  }

  getGamesByStatus(status: GameStatus): Game[] {
    return this.gamesSignal().filter((g) => g.status === status);
  }

  clearAllGames(): void {
    this.gamesSignal.set([]);
    this.saveGames();
  }

  clearStockGames(): void {
    const stockTitles = new Set([
      'The Witcher 3: Wild Hunt',
      'Elden Ring',
      "Baldur's Gate 3",
      'Hollow Knight',
      'Cyberpunk 2077',
      'Hades',
      'Red Dead Redemption 2',
      'Celeste',
      'Silksong',
      'Stardew Valley',
      'Doom Eternal',
      'Ghost of Tsushima',
    ]);
    this.gamesSignal.update((games) => games.filter((g) => !stockTitles.has(g.title)));
    this.saveGames();
  }
}
