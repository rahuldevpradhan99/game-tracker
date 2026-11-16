import { Component, input, output } from '@angular/core';
import { Game, STATUS_CONFIG } from '../../models/game.model';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="game-card" [class.favorite]="game().favorite">
      <div class="card-cover">
        <img [src]="game().coverUrl" [alt]="game().title" loading="lazy"
             (error)="onImageError($event)" />
        <div class="cover-overlay">
          <a [routerLink]="['/game', game().id]" class="view-btn">View Details</a>
        </div>
        <div class="status-badge" [style.background]="getStatusColor()">
          {{ getStatusIcon() }} {{ getStatusLabel() }}
        </div>
        @if (game().favorite) {
          <button class="fav-badge" (click)="onFavoriteClick($event)">❤️</button>
        } @else {
          <button class="fav-badge unfav" (click)="onFavoriteClick($event)">🤍</button>
        }
      </div>

      <div class="card-body">
        <h3 class="game-title">{{ game().title }}</h3>
        <div class="game-meta">
          <span class="developer">{{ game().developer }}</span>
          @if (game().releaseYear) {
            <span class="year">{{ game().releaseYear }}</span>
          }
        </div>

        <div class="platforms">
          @for (p of game().platform; track p) {
            <span class="platform-tag">{{ p }}</span>
          }
        </div>

        @if (game().status === 'playing' || game().status === 'on-hold') {
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">Progress</span>
              <span class="progress-value">{{ game().progress }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="game().progress"
                   [style.background]="getStatusColor()"></div>
            </div>
          </div>
        }

        <div class="card-footer">
          @if (game().rating) {
            <div class="rating">
              @for (star of [1,2,3,4,5]; track star) {
                <span class="star" [class.filled]="star <= (game().rating || 0)">★</span>
              }
            </div>
          }
          @if (game().hoursPlayed > 0) {
            <span class="hours">{{ game().hoursPlayed | number:'1.0-1' }}h</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .game-card {
      background: #1a1a2e;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s ease;

      &:hover {
        border-color: rgba(255, 255, 255, 0.12);
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);

        .cover-overlay {
          opacity: 1;
        }
      }

      &.favorite {
        border-color: rgba(239, 68, 68, 0.3);
      }
    }

    .card-cover {
      position: relative;
      aspect-ratio: 3/4;
      overflow: hidden;
      background: #0f0f1a;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      &:hover img {
        transform: scale(1.05);
      }
    }

    .cover-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .view-btn {
      padding: 10px 24px;
      background: rgba(99, 102, 241, 0.9);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s ease;

      &:hover {
        background: rgba(99, 102, 241, 1);
      }
    }

    .status-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      backdrop-filter: blur(4px);
    }

    .fav-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      backdrop-filter: blur(4px);
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.15);
      }

      &.unfav {
        opacity: 0;
        .game-card:hover & {
          opacity: 0.7;
        }
      }
    }

    .card-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .game-title {
      font-size: 15px;
      font-weight: 600;
      color: #f3f4f6;
      margin: 0;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .game-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #6b7280;
    }

    .developer {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .year {
      flex-shrink: 0;
    }

    .platforms {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .platform-tag {
      font-size: 10px;
      padding: 2px 8px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 4px;
      color: #9ca3af;
      font-weight: 500;
    }

    .progress-section {
      margin-top: 4px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .progress-label {
      font-size: 11px;
      color: #6b7280;
    }

    .progress-value {
      font-size: 12px;
      font-weight: 600;
      color: #a78bfa;
    }

    .progress-track {
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.5s ease;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
    }

    .rating {
      display: flex;
      gap: 2px;
    }

    .star {
      color: #374151;
      font-size: 14px;

      &.filled {
        color: #fbbf24;
      }
    }

    .hours {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
  `],
})
export class GameCardComponent {
  game = input.required<Game>();
  favoriteToggle = output<string>();

  getStatusColor(): string {
    return STATUS_CONFIG[this.game().status]?.color || '#6b7280';
  }

  getStatusIcon(): string {
    return STATUS_CONFIG[this.game().status]?.icon || '';
  }

  getStatusLabel(): string {
    return STATUS_CONFIG[this.game().status]?.label || '';
  }

  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.favoriteToggle.emit(this.game().id);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" fill="none">
        <rect width="300" height="400" fill="#1a1a2e"/>
        <text x="150" y="200" text-anchor="middle" fill="#4b5563" font-size="48">🎮</text>
      </svg>
    `);
  }
}

