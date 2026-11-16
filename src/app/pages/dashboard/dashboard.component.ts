import { Component, inject } from '@angular/core';
import { GameService } from '../../services/game.service';
import { StatsCardComponent } from '../../components/stats-card/stats-card.component';
import { GameCardComponent } from '../../components/game-card/game-card.component';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatsCardComponent, GameCardComponent, RouterLink, DecimalPipe],
  template: `
    <div class="dashboard">
      <header class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Your gaming overview at a glance</p>
        </div>
        <a routerLink="/add" class="add-btn">➕ Add Game</a>
      </header>

      <section class="stats-grid">
        <app-stats-card icon="🎮" [value]="stats().totalGames" label="Total Games" color="#818cf8" />
        <app-stats-card icon="▶️" [value]="stats().playing" label="Currently Playing" color="#3b82f6" />
        <app-stats-card icon="✅" [value]="stats().completed" label="Completed" color="#22c55e" />
        <app-stats-card icon="📦" [value]="stats().backlog" label="Backlog" color="#f59e0b" />
        <app-stats-card icon="⏱️" [value]="(stats().totalHoursPlayed | number:'1.0-1') + 'h'" label="Total Hours Played" color="#a78bfa" />
        <app-stats-card icon="⭐" [value]="(stats().averageRating | number:'1.1-1') + '/5'" label="Avg Rating" color="#fbbf24" />
      </section>

      @if (currentlyPlaying().length > 0) {
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">🎮 Currently Playing</h2>
            <a routerLink="/library" [queryParams]="{status: 'playing'}" class="see-all">See all →</a>
          </div>
          <div class="games-grid">
            @for (game of currentlyPlaying().slice(0, 10); track game.id) {
              <app-game-card [game]="game" (favoriteToggle)="onToggleFavorite($event)" />
            }
          </div>
        </section>
      }

      @if (recentlyAdded().length > 0) {
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">🆕 Recently Added</h2>
            <a routerLink="/library" class="see-all">View Library →</a>
          </div>
          <div class="games-grid">
            @for (game of recentlyAdded().slice(0, 10); track game.id) {
              <app-game-card [game]="game" (favoriteToggle)="onToggleFavorite($event)" />
            }
          </div>
        </section>
      }

      @if (favorites().length > 0) {
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">❤️ Favorites</h2>
          </div>
          <div class="games-grid">
            @for (game of favorites().slice(0, 10); track game.id) {
              <app-game-card [game]="game" (favoriteToggle)="onToggleFavorite($event)" />
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .dashboard {
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

    .add-btn {
      padding: 10px 22px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
      margin-bottom: 36px;

      @media (max-width: 1400px) {
        grid-template-columns: repeat(3, 1fr);
      }
      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }
      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .section {
      margin-bottom: 40px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #f3f4f6;
      margin: 0;
    }

    .see-all {
      font-size: 13px;
      color: #818cf8;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;

      &:hover {
        color: #a78bfa;
      }
    }

    .games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }
  `],
})
export class DashboardComponent {
  private gameService = inject(GameService);

  stats = this.gameService.stats;

  currentlyPlaying() {
    return this.gameService.games().filter((g) => g.status === 'playing');
  }

  recentlyAdded() {
    return [...this.gameService.games()]
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, 8);
  }

  favorites() {
    return this.gameService.games().filter((g) => g.favorite);
  }

  onToggleFavorite(id: string) {
    this.gameService.toggleFavorite(id);
  }
}

