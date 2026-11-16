import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Game, GameStatus, STATUS_CONFIG, PLATFORM_OPTIONS, GENRE_OPTIONS } from '../../models/game.model';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [GameCardComponent, FormsModule, RouterLink, DecimalPipe],
  template: `
    <div class="library">
      <header class="page-header">
        <div>
          <h1 class="page-title">Game Library</h1>
          <p class="page-subtitle">{{ filteredGames().length }} games</p>
        </div>
        <div class="header-actions">
          @if (gameService.games().length > 0) {
            <button class="clear-lib-btn" (click)="confirmClearLibrary()">🗑️ Clear Library</button>
          }
          <a routerLink="/add" class="add-btn">➕ Add Game</a>
        </div>
      </header>

      <div class="filters-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Search games..." [ngModel]="searchQuery()"
                 (ngModelChange)="searchQuery.set($event)" class="search-input" />
          @if (searchQuery()) {
            <button class="clear-btn" (click)="searchQuery.set('')">✕</button>
          }
        </div>

        <div class="filter-group">
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" class="filter-select">
            <option value="all">All Status</option>
            @for (entry of statusEntries; track entry[0]) {
              <option [value]="entry[0]">{{ entry[1].icon }} {{ entry[1].label }}</option>
            }
          </select>

          <select [ngModel]="platformFilter()" (ngModelChange)="platformFilter.set($event)" class="filter-select">
            <option value="all">All Platforms</option>
            @for (p of platforms; track p) {
              <option [value]="p">{{ p }}</option>
            }
          </select>

          <select [ngModel]="genreFilter()" (ngModelChange)="genreFilter.set($event)" class="filter-select">
            <option value="all">All Genres</option>
            @for (g of genres; track g) {
              <option [value]="g">{{ g }}</option>
            }
          </select>

          <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)" class="filter-select">
            <option value="dateAdded">Date Added</option>
            <option value="title">Title</option>
            <option value="rating">Rating</option>
            <option value="hoursPlayed">Hours Played</option>
            <option value="progress">Progress</option>
          </select>
        </div>

        <div class="view-toggle">
          <button [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')">▦</button>
          <button [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')">☰</button>
        </div>
      </div>

      <!-- Status tabs -->
      <div class="status-tabs">
        <button class="tab" [class.active]="statusFilter() === 'all'"
                (click)="statusFilter.set('all')">
          All <span class="tab-count">{{ gameService.games().length }}</span>
        </button>
        @for (entry of statusEntries; track entry[0]) {
          <button class="tab" [class.active]="statusFilter() === entry[0]"
                  (click)="statusFilter.set(entry[0])"
                  [style.--tab-color]="entry[1].color">
            {{ entry[1].icon }} {{ entry[1].label }}
            <span class="tab-count">{{ getStatusCount(entry[0]) }}</span>
          </button>
        }
      </div>

      @if (filteredGames().length > 0) {
        <div class="games-grid" [class.list-view]="viewMode() === 'list'">
          @for (game of filteredGames(); track game.id) {
            @if (viewMode() === 'grid') {
              <app-game-card [game]="game" (favoriteToggle)="onToggleFavorite($event)" />
            } @else {
              <div class="list-item" [routerLink]="['/game', game.id]">
                <img [src]="game.coverUrl" [alt]="game.title" class="list-cover"
                     (error)="onImageError($event)" />
                <div class="list-info">
                  <h3 class="list-title">{{ game.title }}</h3>
                  <span class="list-dev">{{ game.developer }}</span>
                </div>
                <div class="list-platforms">
                  @for (p of game.platform; track p) {
                    <span class="platform-tag">{{ p }}</span>
                  }
                </div>
                <div class="list-status" [style.color]="getColor(game.status)">
                  {{ getIcon(game.status) }} {{ getLabel(game.status) }}
                </div>
                @if (game.status === 'playing' || game.status === 'on-hold') {
                  <div class="list-progress">
                    <div class="mini-progress">
                      <div class="mini-fill" [style.width.%]="game.progress"></div>
                    </div>
                    <span>{{ game.progress }}%</span>
                  </div>
                }
                <div class="list-rating">
                  @if (game.rating) {
                    @for (s of [1,2,3,4,5]; track s) {
                      <span class="star" [class.filled]="s <= (game.rating || 0)">★</span>
                    }
                  } @else {
                    <span class="no-rating">—</span>
                  }
                </div>
                <span class="list-hours">{{ game.hoursPlayed | number:'1.0-1' }}h</span>
                <button class="list-fav" (click)="onToggleFavorite(game.id); $event.stopPropagation()">
                  {{ game.favorite ? '❤️' : '🤍' }}
                </button>
              </div>
            }
          }
        </div>
      } @else {
        <div class="empty-state">
          <span class="empty-icon">🎮</span>
          <h3>No games found</h3>
          <p>Try adjusting your filters or add a new game to your library.</p>
          <a routerLink="/add" class="add-btn">Add Your First Game</a>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .library {
      padding: 36px 48px;
      max-width: 1600px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 20px;
    }

    .page-title {
      font-size: 32px;
      font-weight: 800;
      color: #f3f4f6;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 14px;
      color: #9ca3af;
      margin: 4px 0 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .clear-lib-btn {
      padding: 10px 16px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      color: #fca5a5;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(239, 68, 68, 0.25);
        color: white;
        border-color: rgba(239, 68, 68, 0.5);
      }
    }

    .add-btn {
      padding: 10px 20px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
      }
    }

    .filters-bar {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      background: #141426;
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 16px;
      padding: 14px 18px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 220px;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
    }

    .search-input {
      width: 100%;
      padding: 10px 36px 10px 38px;
      background: #0d0d1a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #f3f4f6;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;

      &:focus {
        border-color: #818cf8;
      }

      &::placeholder {
        color: #4b5563;
      }
    }

    .clear-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      font-size: 14px;
      padding: 4px;

      &:hover {
        color: #f3f4f6;
      }
    }

    .filter-group {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .filter-select {
      padding: 10px 14px;
      background: #0d0d1a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #d1d5db;
      font-size: 13px;
      outline: none;
      cursor: pointer;

      &:focus {
        border-color: #818cf8;
      }

      option {
        background: #1a1a2e;
      }
    }

    .view-toggle {
      display: flex;
      background: #0d0d1a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      overflow: hidden;

      button {
        padding: 10px 14px;
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;

        &.active {
          background: rgba(99, 102, 241, 0.2);
          color: #818cf8;
        }

        &:hover:not(.active) {
          color: #d1d5db;
        }
      }
    }

    .status-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 28px;
      overflow-x: auto;
      padding-bottom: 4px;
      width: 100%;

      &::-webkit-scrollbar {
        height: 2px;
      }
      &::-webkit-scrollbar-thumb {
        background: #374151;
        border-radius: 2px;
      }
    }

    .tab {
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      color: #9ca3af;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #d1d5db;
      }

      &.active {
        background: rgba(99, 102, 241, 0.15);
        border-color: rgba(99, 102, 241, 0.3);
        color: #818cf8;
      }
    }

    .tab-count {
      font-size: 11px;
      padding: 1px 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 6px;
    }

    .games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 24px;
      width: 100%;

      &.list-view {
        grid-template-columns: 1fr;
        gap: 8px;
      }
    }

    .list-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: #1a1a2e;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;

      &:hover {
        border-color: rgba(255, 255, 255, 0.12);
        background: #1e1e34;
      }
    }

    .list-cover {
      width: 44px;
      height: 58px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .list-info {
      flex: 1;
      min-width: 0;
    }

    .list-title {
      font-size: 14px;
      font-weight: 600;
      color: #f3f4f6;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .list-dev {
      font-size: 12px;
      color: #6b7280;
    }

    .list-platforms {
      display: flex;
      gap: 4px;
    }

    .platform-tag {
      font-size: 10px;
      padding: 2px 8px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 4px;
      color: #9ca3af;
    }

    .list-status {
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      min-width: 90px;
    }

    .list-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 80px;
      font-size: 12px;
      color: #9ca3af;
    }

    .mini-progress {
      flex: 1;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .mini-fill {
      height: 100%;
      background: #818cf8;
      border-radius: 2px;
    }

    .list-rating {
      min-width: 80px;
    }

    .star {
      color: #374151;
      font-size: 13px;
      &.filled { color: #fbbf24; }
    }

    .no-rating { color: #374151; }

    .list-hours {
      font-size: 12px;
      color: #6b7280;
      min-width: 40px;
      text-align: right;
    }

    .list-fav {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      padding: 4px;
      transition: transform 0.2s;
      &:hover { transform: scale(1.2); }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;

      .empty-icon {
        font-size: 48px;
        display: block;
        margin-bottom: 16px;
      }

      h3 {
        color: #d1d5db;
        margin: 0 0 8px;
      }

      p {
        margin: 0 0 20px;
      }
    }
  `],
})
export class LibraryComponent implements OnInit {
  gameService = inject(GameService);
  private route = inject(ActivatedRoute);

  searchQuery = signal('');
  statusFilter = signal<string>('all');
  platformFilter = signal<string>('all');
  genreFilter = signal<string>('all');
  sortBy = signal<string>('dateAdded');
  viewMode = signal<'grid' | 'list'>('grid');

  statusEntries = Object.entries(STATUS_CONFIG);
  platforms = PLATFORM_OPTIONS;
  genres = GENRE_OPTIONS;

  filteredGames = computed(() => {
    let games = this.gameService.games();

    const q = this.searchQuery().toLowerCase();
    if (q) {
      games = games.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.developer.toLowerCase().includes(q) ||
          g.genre.some((gen) => gen.toLowerCase().includes(q)),
      );
    }

    if (this.statusFilter() !== 'all') {
      games = games.filter((g) => g.status === this.statusFilter());
    }

    if (this.platformFilter() !== 'all') {
      games = games.filter((g) => g.platform.includes(this.platformFilter() as any));
    }

    if (this.genreFilter() !== 'all') {
      games = games.filter((g) => g.genre.includes(this.genreFilter()));
    }

    const sort = this.sortBy();
    games = [...games].sort((a, b) => {
      switch (sort) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'hoursPlayed':
          return b.hoursPlayed - a.hoursPlayed;
        case 'progress':
          return b.progress - a.progress;
        default:
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
    });

    return games;
  });

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['status']) {
        this.statusFilter.set(params['status']);
      }
    });
  }

  getStatusCount(status: string): number {
    return this.gameService.games().filter((g) => g.status === status).length;
  }

  getColor(status: GameStatus): string {
    return STATUS_CONFIG[status]?.color || '#6b7280';
  }

  getIcon(status: GameStatus): string {
    return STATUS_CONFIG[status]?.icon || '';
  }

  getLabel(status: GameStatus): string {
    return STATUS_CONFIG[status]?.label || '';
  }

  confirmClearLibrary(): void {
    if (confirm('Are you sure you want to clear your entire game library? This will remove all tracked games.')) {
      this.gameService.clearAllGames();
    }
  }

  onToggleFavorite(id: string) {
    this.gameService.toggleFavorite(id);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 58" fill="none">
        <rect width="44" height="58" fill="#1a1a2e"/>
        <text x="22" y="32" text-anchor="middle" fill="#4b5563" font-size="16">🎮</text>
      </svg>
    `);
  }
}

