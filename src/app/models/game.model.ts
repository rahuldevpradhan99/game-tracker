export type GameStatus = 'backlog' | 'playing' | 'completed' | 'dropped' | 'wishlist' | 'on-hold';
export type GamePlatform = 'PC' | 'PlayStation' | 'Xbox' | 'Nintendo' | 'Mobile' | 'Other';
export type GameRating = 1 | 2 | 3 | 4 | 5 | null;

export interface Game {
  id: string;
  title: string;
  coverUrl: string;
  platform: GamePlatform[];
  genre: string[];
  status: GameStatus;
  rating: GameRating;
  progress: number; // 0-100
  hoursPlayed: number;
  dateAdded: string;
  dateStarted: string | null;
  dateCompleted: string | null;
  notes: string;
  favorite: boolean;
  developer: string;
  releaseYear: number | null;
}

export interface GameStats {
  totalGames: number;
  completed: number;
  playing: number;
  backlog: number;
  dropped: number;
  wishlist: number;
  onHold: number;
  totalHoursPlayed: number;
  averageRating: number;
  completionRate: number;
  favoriteCount: number;
  platformBreakdown: { platform: string; count: number }[];
  genreBreakdown: { genre: string; count: number }[];
  monthlyActivity: { month: string; added: number; completed: number }[];
  playstationGamesCount: number;
  playstationCompletedCount: number;
}

export const STATUS_CONFIG: Record<GameStatus, { label: string; icon: string; color: string }> = {
  backlog: { label: 'Backlog', icon: '📦', color: '#6b7280' },
  playing: { label: 'Playing', icon: '🎮', color: '#3b82f6' },
  completed: { label: 'Completed', icon: '✅', color: '#22c55e' },
  dropped: { label: 'Dropped', icon: '❌', color: '#ef4444' },
  wishlist: { label: 'Wishlist', icon: '⭐', color: '#f59e0b' },
  'on-hold': { label: 'On Hold', icon: '⏸️', color: '#8b5cf6' },
};

export const PLATFORM_OPTIONS: GamePlatform[] = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile', 'Other'];

export const GENRE_OPTIONS: string[] = [
  'Action', 'Adventure', 'RPG', 'Strategy', 'Simulation',
  'Sports', 'Racing', 'Puzzle', 'Horror', 'Shooter',
  'Platformer', 'Fighting', 'Stealth', 'Survival',
  'Open World', 'Indie', 'MMO', 'Roguelike', 'Visual Novel', 'Other',
];

