import { Component, inject, computed, signal } from '@angular/core';
import { GameService } from '../../services/game.service';
import { PsnService } from '../../services/psn.service';
import { StatsCardComponent } from '../../components/stats-card/stats-card.component';
import { DecimalPipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [StatsCardComponent, DecimalPipe, CommonModule, RouterLink],
  template: `
    <div class="stats-page">
      <header class="page-header">
        <h1 class="page-title">Statistics</h1>
        <p class="page-subtitle">Your gaming journey in numbers</p>
      </header>

      <!-- Overview Cards -->
      <section class="overview-grid">
        <app-stats-card icon="🎮" [value]="stats().totalGames" label="Total Games" color="#818cf8" />
        <app-stats-card icon="✅" [value]="stats().completed" label="Completed" color="#22c55e" />
        <app-stats-card icon="▶️" [value]="stats().playing" label="Playing" color="#3b82f6" />
        <app-stats-card icon="📦" [value]="stats().backlog" label="Backlog" color="#f59e0b" />
        <app-stats-card icon="⏸️" [value]="stats().onHold" label="On Hold" color="#8b5cf6" />
        <app-stats-card icon="❌" [value]="stats().dropped" label="Dropped" color="#ef4444" />
        <app-stats-card icon="⭐" [value]="stats().wishlist" label="Wishlist" color="#fbbf24" />
        <app-stats-card icon="❤️" [value]="stats().favoriteCount" label="Favorites" color="#ec4899" />
      </section>

      <!-- PLAYSTATION LIVE STATS INTEGRATION -->
      @if (psnService.isAuthenticated()) {
        <section class="psn-stats-banner">
          <div class="psn-stats-header">
            <div class="psn-badge-title">
              <span class="psn-icon">🎮</span>
              <div>
                <h3 class="psn-title">PlayStation Network Live Sync</h3>
                <span class="psn-subtitle">Connected as <strong>{{ psnService.profile()?.onlineId || 'PlayStation Player' }}</strong> • Level {{ psnService.trophyStats().level }}</span>
              </div>
            </div>
            <div class="psn-actions">
              <button class="sync-stats-btn" (click)="quickSyncPsn()" [disabled]="isSyncing()">
                {{ isSyncing() ? '⏳ Syncing...' : '🔄 Re-sync PSN Games' }}
              </button>
              <a routerLink="/playstation" class="view-psn-link">View PSN Hub →</a>
            </div>
          </div>

          <div class="psn-stats-grid">
            <div class="psn-metric-box">
              <span class="psn-val">{{ stats().playstationGamesCount }}</span>
              <span class="psn-lbl">Tracked PS Games</span>
            </div>
            <div class="psn-metric-box">
              <span class="psn-val">{{ stats().playstationCompletedCount }}</span>
              <span class="psn-lbl">100% Completed</span>
            </div>
            <div class="psn-metric-box">
              <span class="psn-val plat">🏆 {{ psnService.trophyStats().platinum }}</span>
              <span class="psn-lbl">Platinums</span>
            </div>
            <div class="psn-metric-box">
              <span class="psn-val gold">🥇 {{ psnService.trophyStats().gold }}</span>
              <span class="psn-lbl">Gold Trophies</span>
            </div>
            <div class="psn-metric-box">
              <span class="psn-val silver">🥈 {{ psnService.trophyStats().silver }}</span>
              <span class="psn-lbl">Silver Trophies</span>
            </div>
            <div class="psn-metric-box">
              <span class="psn-val bronze">🥉 {{ psnService.trophyStats().bronze }}</span>
              <span class="psn-lbl">Bronze Trophies</span>
            </div>
          </div>
        </section>
      }

      <div class="charts-grid">
        <!-- Completion Rate -->
        <div class="chart-card">
          <h3 class="chart-title">🏆 Completion Rate</h3>
          <div class="donut-container">
            <div class="donut">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#22c55e" stroke-width="12"
                        [attr.stroke-dasharray]="completionDash()"
                        stroke-dashoffset="0"
                        stroke-linecap="round"
                        transform="rotate(-90 60 60)" />
              </svg>
              <div class="donut-label">
                <span class="donut-value">{{ stats().completionRate | number:'1.0-0' }}%</span>
                <span class="donut-sublabel">completed</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hours Stats -->
        <div class="chart-card">
          <h3 class="chart-title">⏱️ Time Spent</h3>
          <div class="time-stats">
            <div class="big-stat">
              <span class="big-value">{{ stats().totalHoursPlayed | number:'1.0-1' }}h</span>
              <span class="big-label">Total Hours</span>
            </div>
            <div class="time-breakdown">
              <div class="time-item">
                <span class="time-val">{{ avgHoursPerGame() | number:'1.0-1' }}h</span>
                <span class="time-lbl">Avg per game</span>
              </div>
              <div class="time-item">
                <span class="time-val">{{ (stats().totalHoursPlayed / 24) | number:'1.0-1' }}</span>
                <span class="time-lbl">Days played</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Rating Distribution -->
        <div class="chart-card">
          <h3 class="chart-title">⭐ Rating Distribution</h3>
          <div class="rating-bars">
            @for (r of [5,4,3,2,1]; track r) {
              <div class="rating-row">
                <span class="rating-label">{{ r }}★</span>
                <div class="rating-bar-track">
                  <div class="rating-bar-fill" [style.width.%]="getRatingPercent(r)"
                       [style.background]="r >= 4 ? '#fbbf24' : r >= 3 ? '#f59e0b' : '#ef4444'"></div>
                </div>
                <span class="rating-count">{{ getRatingCount(r) }}</span>
              </div>
            }
          </div>
          <div class="avg-rating">
            Average: <strong>{{ stats().averageRating | number:'1.1-1' }}</strong> / 5
          </div>
        </div>

        <!-- Platform Breakdown -->
        <div class="chart-card">
          <h3 class="chart-title">🖥️ Platform Breakdown</h3>
          <div class="breakdown-list">
            @for (item of stats().platformBreakdown; track item.platform) {
              <div class="breakdown-item">
                <span class="breakdown-label">{{ item.platform }}</span>
                <div class="breakdown-bar-track">
                  <div class="breakdown-bar-fill"
                       [style.width.%]="(item.count / maxPlatformCount()) * 100"
                       [style.background]="getPlatformColor(item.platform)"></div>
                </div>
                <span class="breakdown-count">{{ item.count }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Genre Breakdown -->
        <div class="chart-card wide">
          <h3 class="chart-title">🏷️ Top Genres</h3>
          <div class="genre-cloud">
            @for (item of stats().genreBreakdown.slice(0, 12); track item.genre) {
              <div class="genre-item" [style.--size]="getGenreSize(item.count)">
                <span class="genre-name">{{ item.genre }}</span>
                <span class="genre-count">{{ item.count }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Status Distribution -->
        <div class="chart-card wide">
          <h3 class="chart-title">📊 Status Distribution</h3>
          <div class="status-bar-container">
            @if (stats().totalGames > 0) {
              <div class="status-bar">
                <div class="status-segment" [style.width.%]="(stats().completed / stats().totalGames) * 100"
                     style="background: #22c55e" title="Completed">
                  @if ((stats().completed / stats().totalGames) * 100 > 8) {
                    {{ stats().completed }}
                  }
                </div>
                <div class="status-segment" [style.width.%]="(stats().playing / stats().totalGames) * 100"
                     style="background: #3b82f6" title="Playing">
                  @if ((stats().playing / stats().totalGames) * 100 > 8) {
                    {{ stats().playing }}
                  }
                </div>
                <div class="status-segment" [style.width.%]="(stats().backlog / stats().totalGames) * 100"
                     style="background: #f59e0b" title="Backlog">
                  @if ((stats().backlog / stats().totalGames) * 100 > 8) {
                    {{ stats().backlog }}
                  }
                </div>
                <div class="status-segment" [style.width.%]="(stats().onHold / stats().totalGames) * 100"
                     style="background: #8b5cf6" title="On Hold">
                </div>
                <div class="status-segment" [style.width.%]="(stats().dropped / stats().totalGames) * 100"
                     style="background: #ef4444" title="Dropped">
                </div>
                <div class="status-segment" [style.width.%]="(stats().wishlist / stats().totalGames) * 100"
                     style="background: #fbbf24" title="Wishlist">
                </div>
              </div>
            }
            <div class="status-legend">
              <span class="legend-item"><span class="dot" style="background:#22c55e"></span> Completed</span>
              <span class="legend-item"><span class="dot" style="background:#3b82f6"></span> Playing</span>
              <span class="legend-item"><span class="dot" style="background:#f59e0b"></span> Backlog</span>
              <span class="legend-item"><span class="dot" style="background:#8b5cf6"></span> On Hold</span>
              <span class="legend-item"><span class="dot" style="background:#ef4444"></span> Dropped</span>
              <span class="legend-item"><span class="dot" style="background:#fbbf24"></span> Wishlist</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .stats-page {
      padding: 36px 48px;
      max-width: 1600px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #f3f4f6;
      margin: 0;
    }

    .page-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 4px 0 0;
    }

    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    /* PSN LIVE BANNER */
    .psn-stats-banner {
      background: linear-gradient(135deg, #131738, #0e112c);
      border: 1px solid rgba(0, 112, 209, 0.35);
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 28px;
      box-shadow: 0 8px 32px rgba(0, 67, 156, 0.2);
    }

    .psn-stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .psn-badge-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .psn-icon {
      font-size: 26px;
    }

    .psn-title {
      font-size: 17px;
      font-weight: 700;
      color: #f3f4f6;
      margin: 0;
    }

    .psn-subtitle {
      font-size: 12px;
      color: #93c5fd;

      strong {
        color: #fff;
      }
    }

    .psn-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sync-stats-btn {
      padding: 8px 14px;
      background: #0070d1;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        filter: brightness(1.1);
      }
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .view-psn-link {
      font-size: 12px;
      color: #60a5fa;
      text-decoration: underline;
      font-weight: 500;
      &:hover { color: #93c5fd; }
    }

    .psn-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
    }

    .psn-metric-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .psn-val {
      font-size: 18px;
      font-weight: 700;
      color: #f3f4f6;

      &.plat { color: #93c5fd; }
      &.gold { color: #facc15; }
      &.silver { color: #e5e7eb; }
      &.bronze { color: #fdba74; }
    }

    .psn-lbl {
      font-size: 11px;
      color: #9ca3af;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .chart-card {
      background: #1a1a2e;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 24px;

      &.wide {
        grid-column: span 2;
      }
    }

    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #d1d5db;
      margin: 0 0 20px;
    }

    /* Donut */
    .donut-container {
      display: flex;
      justify-content: center;
    }

    .donut {
      position: relative;
      width: 160px;
      height: 160px;
    }

    .donut svg {
      width: 100%;
      height: 100%;
    }

    .donut-label {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .donut-value {
      font-size: 28px;
      font-weight: 700;
      color: #22c55e;
    }

    .donut-sublabel {
      font-size: 12px;
      color: #6b7280;
    }

    /* Time Stats */
    .time-stats {
      text-align: center;
    }

    .big-stat {
      margin-bottom: 20px;
    }

    .big-value {
      display: block;
      font-size: 48px;
      font-weight: 700;
      color: #a78bfa;
      line-height: 1;
    }

    .big-label {
      font-size: 14px;
      color: #6b7280;
    }

    .time-breakdown {
      display: flex;
      justify-content: center;
      gap: 32px;
    }

    .time-item {
      display: flex;
      flex-direction: column;
    }

    .time-val {
      font-size: 20px;
      font-weight: 600;
      color: #d1d5db;
    }

    .time-lbl {
      font-size: 12px;
      color: #6b7280;
    }

    /* Rating Bars */
    .rating-bars {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .rating-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .rating-label {
      font-size: 13px;
      color: #9ca3af;
      width: 30px;
      text-align: right;
    }

    .rating-bar-track {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 4px;
      overflow: hidden;
    }

    .rating-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .rating-count {
      font-size: 13px;
      color: #6b7280;
      width: 24px;
    }

    .avg-rating {
      margin-top: 16px;
      font-size: 14px;
      color: #9ca3af;
      text-align: center;

      strong {
        color: #fbbf24;
      }
    }

    /* Breakdown */
    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .breakdown-label {
      font-size: 13px;
      color: #d1d5db;
      width: 80px;
    }

    .breakdown-bar-track {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 4px;
      overflow: hidden;
    }

    .breakdown-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .breakdown-count {
      font-size: 13px;
      color: #6b7280;
      width: 24px;
      text-align: right;
    }

    /* Genre Cloud */
    .genre-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .genre-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: rgba(99, 102, 241, calc(var(--size) * 0.15));
      border: 1px solid rgba(99, 102, 241, calc(var(--size) * 0.2));
      border-radius: 10px;
      font-size: calc(12px + var(--size) * 4px);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }
    }

    .genre-name {
      color: #a5b4fc;
      font-weight: 500;
    }

    .genre-count {
      font-size: 11px;
      color: #6b7280;
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Status Bar */
    .status-bar-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .status-bar {
      display: flex;
      height: 32px;
      border-radius: 10px;
      overflow: hidden;
    }

    .status-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: white;
      transition: width 0.5s ease;
      min-width: 2px;
    }

    .status-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #9ca3af;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
  `],
})
export class StatsComponent {
  private gameService = inject(GameService);
  psnService = inject(PsnService);

  stats = this.gameService.stats;
  isSyncing = signal(false);

  async quickSyncPsn(): Promise<void> {
    if (this.psnService.games().length === 0) {
      await this.psnService.loadGames();
    }
    const currentGames = this.psnService.games();
    this.isSyncing.set(true);

    for (const game of currentGames) {
      const existing = this.gameService.games().find(
        (g) => g.title.toLowerCase().trim() === game.title.toLowerCase().trim()
      );
      const isComplete = game.progress === 100 || game.earnedTrophies.platinum > 0;
      const status: any = isComplete ? 'completed' : game.progress > 0 ? 'playing' : 'backlog';
      const activityDate = game.lastUpdatedDateTime
        ? new Date(game.lastUpdatedDateTime).toISOString()
        : new Date().toISOString();

      if (existing) {
        this.gameService.updateGame(existing.id, {
          progress: game.progress,
          hoursPlayed: (game.hoursPlayed && game.hoursPlayed > 0) ? game.hoursPlayed : existing.hoursPlayed,
          status: status,
          rating: isComplete ? 5 : (game.progress >= 50 ? 4 : existing.rating),
          dateCompleted: isComplete ? (existing.dateCompleted || activityDate) : existing.dateCompleted,
        });
      } else {
        this.gameService.addGame({
          title: game.title,
          coverUrl: game.iconUrl,
          platform: ['PlayStation'],
          genre: ['Action'],
          status: status,
          rating: isComplete ? 5 : (game.progress >= 50 ? 4 : null),
          progress: game.progress,
          hoursPlayed: game.hoursPlayed || 0,
          dateStarted: game.progress > 0 ? activityDate : null,
          dateCompleted: isComplete ? activityDate : null,
          notes: `Synced from PlayStation Network. Earned ${game.earnedTrophies.platinum} Plat, ${game.earnedTrophies.gold} Gold, ${game.earnedTrophies.silver} Silver, ${game.earnedTrophies.bronze} Bronze.`,
          favorite: isComplete,
          developer: 'PlayStation Studios / Partner',
          releaseYear: null,
        });
      }
    }

    this.isSyncing.set(false);
  }

  completionDash = computed(() => {
    const rate = this.stats().completionRate;
    const circ = 2 * Math.PI * 50;
    return `${(rate / 100) * circ} ${circ}`;
  });

  avgHoursPerGame(): number {
    const owned = this.gameService.games().filter((g) => g.status !== 'wishlist' && g.hoursPlayed > 0);
    return owned.length > 0 ? this.stats().totalHoursPlayed / owned.length : 0;
  }

  getRatingCount(rating: number): number {
    return this.gameService.games().filter((g) => g.rating === rating).length;
  }

  getRatingPercent(rating: number): number {
    const total = this.gameService.games().filter((g) => g.rating !== null).length;
    return total > 0 ? (this.getRatingCount(rating) / total) * 100 : 0;
  }

  maxPlatformCount(): number {
    const breakdown = this.stats().platformBreakdown;
    return breakdown.length > 0 ? breakdown[0].count : 1;
  }

  getGenreSize(count: number): number {
    const max = this.stats().genreBreakdown[0]?.count || 1;
    return Math.max(0.3, count / max);
  }

  getPlatformColor(platform: string): string {
    const colors: Record<string, string> = {
      PC: '#3b82f6',
      PlayStation: '#2563eb',
      Xbox: '#22c55e',
      Nintendo: '#ef4444',
      Mobile: '#f59e0b',
      Other: '#6b7280',
    };
    return colors[platform] || '#818cf8';
  }
}

