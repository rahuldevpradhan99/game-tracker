import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { Game, GameStatus, STATUS_CONFIG, PLATFORM_OPTIONS, GENRE_OPTIONS, GamePlatform } from '../../models/game.model';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe],
  template: `
    @if (game()) {
      <div class="game-detail">
        <header class="detail-header">
          <button class="back-btn" (click)="goBack()">← Back</button>
          <div class="header-actions">
            <button class="edit-btn" (click)="editing.set(!editing())">
              {{ editing() ? '✕ Cancel' : '✏️ Edit' }}
            </button>
            <button class="delete-btn" (click)="onDelete()">🗑️ Delete</button>
          </div>
        </header>

        <div class="detail-layout">
          <div class="detail-cover">
            <img [src]="game()!.coverUrl" [alt]="game()!.title" (error)="onImageError($event)" />
            <button class="fav-btn" (click)="onToggleFavorite()">
              {{ game()!.favorite ? '❤️ Favorited' : '🤍 Add to Favorites' }}
            </button>
          </div>

          <div class="detail-info">
            @if (!editing()) {
              <!-- View Mode -->
              <h1 class="detail-title">{{ game()!.title }}</h1>
              <div class="detail-meta">
                <span class="meta-developer">{{ game()!.developer }}</span>
                @if (game()!.releaseYear) {
                  <span class="meta-year">{{ game()!.releaseYear }}</span>
                }
              </div>

              <div class="status-badge" [style.background]="getStatusColor()">
                {{ getStatusIcon() }} {{ getStatusLabel() }}
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Platforms</span>
                  <div class="platforms">
                    @for (p of game()!.platform; track p) {
                      <span class="platform-tag">{{ p }}</span>
                    }
                  </div>
                </div>
                <div class="info-item">
                  <span class="info-label">Genres</span>
                  <div class="genres">
                    @for (g of game()!.genre; track g) {
                      <span class="genre-tag">{{ g }}</span>
                    }
                  </div>
                </div>
              </div>

              @if (game()!.status === 'playing' || game()!.status === 'on-hold' || game()!.status === 'completed') {
                <div class="progress-section">
                  <div class="progress-header">
                    <span class="progress-label">Progress</span>
                    <span class="progress-value">{{ game()!.progress }}%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" [style.width.%]="game()!.progress"
                         [style.background]="getStatusColor()"></div>
                  </div>
                </div>
              }

              <div class="stats-row">
                <div class="stat-item">
                  <span class="stat-value">{{ game()!.hoursPlayed | number:'1.0-1' }}h</span>
                  <span class="stat-label">Hours Played</span>
                </div>
                <div class="stat-item">
                  <div class="rating-display">
                    @if (game()!.rating) {
                      @for (s of [1,2,3,4,5]; track s) {
                        <span class="star" [class.filled]="s <= (game()!.rating || 0)">★</span>
                      }
                    } @else {
                      <span class="no-rating">Not rated</span>
                    }
                  </div>
                  <span class="stat-label">Rating</span>
                </div>
              </div>

              <div class="dates">
                @if (game()!.dateStarted) {
                  <div class="date-item">
                    <span class="date-label">Started</span>
                    <span class="date-value">{{ game()!.dateStarted | date:'mediumDate' }}</span>
                  </div>
                }
                @if (game()!.dateCompleted) {
                  <div class="date-item">
                    <span class="date-label">Completed</span>
                    <span class="date-value">{{ game()!.dateCompleted | date:'mediumDate' }}</span>
                  </div>
                }
                <div class="date-item">
                  <span class="date-label">Added to Library</span>
                  <span class="date-value">{{ game()!.dateAdded | date:'mediumDate' }}</span>
                </div>
              </div>

              @if (game()!.notes) {
                <div class="notes-section">
                  <h3>📝 Notes</h3>
                  <p>{{ game()!.notes }}</p>
                </div>
              }
            } @else {
              <!-- Edit Mode -->
              <div class="edit-form">
                <div class="form-field">
                  <label>Title</label>
                  <input type="text" [(ngModel)]="editTitle" />
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label>Developer</label>
                    <input type="text" [(ngModel)]="editDeveloper" />
                  </div>
                  <div class="form-field">
                    <label>Release Year</label>
                    <input type="number" [(ngModel)]="editYear" />
                  </div>
                </div>
                <div class="form-field">
                  <label>Cover URL</label>
                  <input type="url" [(ngModel)]="editCoverUrl" />
                </div>
                <div class="form-field">
                  <label>Status</label>
                  <div class="status-pills">
                    @for (entry of statusEntries; track entry[0]) {
                      <button type="button" class="status-pill"
                              [class.selected]="editStatus === entry[0]"
                              [style.--pill-color]="entry[1].color"
                              (click)="editStatus = entry[0]">
                        {{ entry[1].icon }} {{ entry[1].label }}
                      </button>
                    }
                  </div>
                </div>
                <div class="form-field">
                  <label>Progress ({{ editProgress }}%)</label>
                  <input type="range" [(ngModel)]="editProgress" min="0" max="100" class="range-input" />
                </div>
                <div class="form-row">
                  <div class="form-field">
                    <label>Hours Played</label>
                    <input type="number" [(ngModel)]="editHours" min="0" />
                  </div>
                  <div class="form-field">
                    <label>Rating</label>
                    <div class="rating-input">
                      @for (star of [1,2,3,4,5]; track star) {
                        <button type="button" class="star-btn" [class.filled]="star <= (editRating || 0)"
                                (click)="editRating = star === editRating ? null : star">★</button>
                      }
                    </div>
                  </div>
                </div>
                <div class="form-field">
                  <label>Notes</label>
                  <textarea [(ngModel)]="editNotes" rows="3"></textarea>
                </div>
                <div class="form-actions">
                  <button class="cancel-btn" (click)="editing.set(false)">Cancel</button>
                  <button class="save-btn" (click)="onSave()">💾 Save Changes</button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="not-found">
        <h2>Game not found</h2>
        <a routerLink="/library">← Back to Library</a>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .game-detail {
      padding: 36px 48px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 20px;
    }

    .back-btn {
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #9ca3af;
      font-size: 13px;
      cursor: pointer;
      &:hover { background: rgba(255, 255, 255, 0.1); color: #f3f4f6; }
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .edit-btn, .delete-btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.2s ease;
    }

    .edit-btn {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      &:hover { background: rgba(99, 102, 241, 0.25); }
    }

    .delete-btn {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      &:hover { background: rgba(239, 68, 68, 0.2); }
    }

    .detail-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 32px;
    }

    .detail-cover {
      display: flex;
      flex-direction: column;
      gap: 12px;

      img {
        width: 100%;
        aspect-ratio: 3/4;
        object-fit: cover;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
    }

    .fav-btn {
      padding: 10px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #9ca3af;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      &:hover { background: rgba(255, 255, 255, 0.08); }
    }

    .detail-info {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .detail-title {
      font-size: 32px;
      font-weight: 700;
      color: #f3f4f6;
      margin: 0;
      line-height: 1.2;
    }

    .detail-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 15px;
      color: #9ca3af;
    }

    .status-badge {
      display: inline-flex;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: white;
      align-self: flex-start;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .platforms, .genres {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .platform-tag, .genre-tag {
      padding: 4px 10px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      font-size: 12px;
      color: #d1d5db;
    }

    .genre-tag {
      background: rgba(99, 102, 241, 0.1);
      color: #a5b4fc;
    }

    .progress-section {
      padding: 16px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .progress-label {
      font-size: 14px;
      color: #9ca3af;
    }

    .progress-value {
      font-size: 16px;
      font-weight: 700;
      color: #a78bfa;
    }

    .progress-track {
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .stats-row {
      display: flex;
      gap: 32px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #f3f4f6;
    }

    .stat-label {
      font-size: 12px;
      color: #6b7280;
    }

    .rating-display {
      display: flex;
      gap: 2px;
    }

    .star {
      font-size: 20px;
      color: #374151;
      &.filled { color: #fbbf24; }
    }

    .no-rating {
      color: #4b5563;
      font-size: 14px;
    }

    .dates {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }

    .date-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .date-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .date-value {
      font-size: 14px;
      color: #d1d5db;
    }

    .notes-section {
      padding: 16px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;

      h3 {
        font-size: 15px;
        color: #d1d5db;
        margin: 0 0 8px;
      }

      p {
        font-size: 14px;
        color: #9ca3af;
        margin: 0;
        line-height: 1.6;
      }
    }

    /* Edit form styles */
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 13px;
        font-weight: 500;
        color: #9ca3af;
      }

      input, textarea {
        padding: 10px 14px;
        background: #1a1a2e;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: #f3f4f6;
        font-size: 14px;
        outline: none;
        font-family: inherit;
        &:focus { border-color: #818cf8; }
      }

      textarea { resize: vertical; }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .status-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .status-pill {
      padding: 8px 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #9ca3af;
      font-size: 13px;
      cursor: pointer;
      &.selected {
        background: color-mix(in srgb, var(--pill-color) 20%, transparent);
        border-color: var(--pill-color);
        color: var(--pill-color);
      }
    }

    .range-input {
      accent-color: #818cf8;
    }

    .rating-input {
      display: flex;
      gap: 4px;
    }

    .star-btn {
      background: none;
      border: none;
      font-size: 24px;
      color: #374151;
      cursor: pointer;
      &.filled { color: #fbbf24; }
      &:hover { transform: scale(1.15); }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .cancel-btn {
      padding: 10px 24px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #9ca3af;
      cursor: pointer;
    }

    .save-btn {
      padding: 10px 28px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
      }
    }

    .not-found {
      padding: 60px;
      text-align: center;
      color: #6b7280;

      a {
        color: #818cf8;
        text-decoration: none;
      }
    }
  `],
})
export class GameDetailComponent implements OnInit {
  private gameService = inject(GameService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  game = signal<Game | undefined>(undefined);
  editing = signal(false);

  statusEntries = Object.entries(STATUS_CONFIG);

  // Edit fields
  editTitle = '';
  editDeveloper = '';
  editYear: number | null = null;
  editCoverUrl = '';
  editStatus = '';
  editProgress = 0;
  editHours = 0;
  editRating: number | null = null;
  editNotes = '';

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const g = this.gameService.getGame(params['id']);
      this.game.set(g);
      if (g) {
        this.editTitle = g.title;
        this.editDeveloper = g.developer;
        this.editYear = g.releaseYear;
        this.editCoverUrl = g.coverUrl;
        this.editStatus = g.status;
        this.editProgress = g.progress;
        this.editHours = g.hoursPlayed;
        this.editRating = g.rating;
        this.editNotes = g.notes;
      }
    });
  }

  getStatusColor(): string {
    return STATUS_CONFIG[this.game()!.status]?.color || '#6b7280';
  }

  getStatusIcon(): string {
    return STATUS_CONFIG[this.game()!.status]?.icon || '';
  }

  getStatusLabel(): string {
    return STATUS_CONFIG[this.game()!.status]?.label || '';
  }

  onToggleFavorite() {
    this.gameService.toggleFavorite(this.game()!.id);
    this.game.set(this.gameService.getGame(this.game()!.id));
  }

  onSave() {
    this.gameService.updateGame(this.game()!.id, {
      title: this.editTitle,
      developer: this.editDeveloper,
      releaseYear: this.editYear,
      coverUrl: this.editCoverUrl,
      status: this.editStatus as GameStatus,
      progress: this.editProgress,
      hoursPlayed: this.editHours,
      rating: this.editRating as any,
      notes: this.editNotes,
    });
    this.game.set(this.gameService.getGame(this.game()!.id));
    this.editing.set(false);
  }

  onDelete() {
    if (confirm('Are you sure you want to delete "' + this.game()!.title + '"?')) {
      this.gameService.deleteGame(this.game()!.id);
      this.router.navigate(['/library']);
    }
  }

  goBack() {
    this.router.navigate(['/library']);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" fill="none">
        <rect width="240" height="320" fill="#1a1a2e"/>
        <text x="120" y="160" text-anchor="middle" fill="#4b5563" font-size="48">🎮</text>
      </svg>
    `);
  }
}

