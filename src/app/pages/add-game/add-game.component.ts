import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { GamePlatform, GameStatus, PLATFORM_OPTIONS, GENRE_OPTIONS, STATUS_CONFIG } from '../../models/game.model';

@Component({
  selector: 'app-add-game',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="add-game">
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" (click)="goBack()">← Back</button>
          <div>
            <h1 class="page-title">Add New Game</h1>
            <p class="page-subtitle">Track custom titles, platforms, playtime, and progress</p>
          </div>
        </div>
      </header>

      <form class="game-form" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <!-- Left Column: Cover Preview -->
          <div class="cover-section">
            <div class="cover-preview">
              @if (coverUrl()) {
                <img [src]="coverUrl()" alt="Cover preview" (error)="onImageError($event)" />
              } @else {
                <div class="cover-placeholder">
                  <span>🎮</span>
                  <p>Game Cover</p>
                </div>
              }
            </div>
            <div class="form-field">
              <label>Cover Image URL</label>
              <input type="url" [ngModel]="coverUrl()" (ngModelChange)="coverUrl.set($event)"
                     name="coverUrl" placeholder="https://..." />
            </div>
          </div>

          <!-- Right Column: Details -->
          <div class="details-section">
            <div class="form-field">
              <label>Game Title <span class="required">*</span></label>
              <input type="text" [ngModel]="title()" (ngModelChange)="title.set($event)"
                     name="title" placeholder="Enter game title" required />
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>Developer</label>
                <input type="text" [ngModel]="developer()" (ngModelChange)="developer.set($event)"
                       name="developer" placeholder="Studio name" />
              </div>
              <div class="form-field">
                <label>Release Year</label>
                <input type="number" [ngModel]="releaseYear()" (ngModelChange)="releaseYear.set($event)"
                       name="releaseYear" placeholder="2024" min="1970" max="2030" />
              </div>
            </div>

            <div class="form-field">
              <label>Status</label>
              <div class="status-pills">
                @for (entry of statusEntries; track entry[0]) {
                  <button type="button" class="status-pill"
                          [class.selected]="status() === entry[0]"
                          [style.--pill-color]="entry[1].color"
                          (click)="status.set($any(entry[0]))">
                    {{ entry[1].icon }} {{ entry[1].label }}
                  </button>
                }
              </div>
            </div>

            <div class="form-field">
              <label>Platforms</label>
              <div class="checkbox-group">
                @for (p of platformOptions; track p) {
                  <label class="checkbox-item" [class.checked]="selectedPlatforms().includes(p)">
                    <input type="checkbox" [checked]="selectedPlatforms().includes(p)"
                           (change)="togglePlatform(p)" />
                    {{ p }}
                  </label>
                }
              </div>
            </div>

            <div class="form-field">
              <label>Genres</label>
              <div class="checkbox-group genres">
                @for (g of genreOptions; track g) {
                  <label class="checkbox-item" [class.checked]="selectedGenres().includes(g)">
                    <input type="checkbox" [checked]="selectedGenres().includes(g)"
                           (change)="toggleGenre(g)" />
                    {{ g }}
                  </label>
                }
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>Progress ({{ progress() }}%)</label>
                <input type="range" [ngModel]="progress()" (ngModelChange)="progress.set($event)"
                       name="progress" min="0" max="100" class="range-input" />
              </div>
              <div class="form-field">
                <label>Hours Played</label>
                <input type="number" [ngModel]="hoursPlayed()" (ngModelChange)="hoursPlayed.set($event)"
                       name="hoursPlayed" placeholder="0" min="0" />
              </div>
            </div>

            <div class="form-field">
              <label>Rating</label>
              <div class="rating-input">
                @for (star of [1,2,3,4,5]; track star) {
                  <button type="button" class="star-btn" [class.filled]="star <= (rating() || 0)"
                          (click)="rating.set(star === rating() ? null : star)">
                    ★
                  </button>
                }
                @if (rating()) {
                  <button type="button" class="clear-rating" (click)="rating.set(null)">Clear</button>
                }
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label>Date Started</label>
                <input type="date" [ngModel]="dateStarted()" (ngModelChange)="dateStarted.set($event)"
                       name="dateStarted" />
              </div>
              <div class="form-field">
                <label>Date Completed</label>
                <input type="date" [ngModel]="dateCompleted()" (ngModelChange)="dateCompleted.set($event)"
                       name="dateCompleted" />
              </div>
            </div>

            <div class="form-field">
              <label>Notes</label>
              <textarea [ngModel]="notes()" (ngModelChange)="notes.set($event)"
                        name="notes" placeholder="Your thoughts..." rows="3"></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" (click)="goBack()">Cancel</button>
              <button type="submit" class="submit-btn" [disabled]="!title()">
                ➕ Add Game
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .add-game {
      padding: 36px 48px;
      max-width: 1200px;
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

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #9ca3af;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #f3f4f6;
      }
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

    .game-form {
      background: #141428;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 36px 40px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);

      @media (max-width: 640px) {
        padding: 24px 20px;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 36px;

      @media (max-width: 960px) {
        grid-template-columns: 1fr;
      }
    }

    .cover-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .cover-preview {
      aspect-ratio: 3/4;
      background: #1a1a2e;
      border: 2px dashed rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .cover-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #4b5563;

      span {
        font-size: 40px;
      }

      p {
        font-size: 13px;
        margin: 0;
      }
    }

    .details-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
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

      .required {
        color: #ef4444;
      }

      input[type="text"],
      input[type="url"],
      input[type="number"],
      input[type="date"],
      textarea {
        padding: 10px 14px;
        background: #1a1a2e;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: #f3f4f6;
        font-size: 14px;
        outline: none;
        font-family: inherit;
        transition: border-color 0.2s;

        &:focus {
          border-color: #818cf8;
        }

        &::placeholder {
          color: #4b5563;
        }
      }

      textarea {
        resize: vertical;
      }
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
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      &.selected {
        background: color-mix(in srgb, var(--pill-color) 20%, transparent);
        border-color: var(--pill-color);
        color: var(--pill-color);
      }
    }

    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      &.genres {
        max-height: 120px;
        overflow-y: auto;
        padding-right: 8px;

        &::-webkit-scrollbar {
          width: 4px;
        }
        &::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 2px;
        }
      }
    }

    .checkbox-item {
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      font-size: 12px;
      color: #9ca3af;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;

      input {
        display: none;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      &.checked {
        background: rgba(99, 102, 241, 0.15);
        border-color: rgba(99, 102, 241, 0.3);
        color: #818cf8;
      }
    }

    .range-input {
      width: 100%;
      accent-color: #818cf8;
    }

    .rating-input {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .star-btn {
      background: none;
      border: none;
      font-size: 28px;
      color: #374151;
      cursor: pointer;
      padding: 0 2px;
      transition: all 0.2s;

      &.filled {
        color: #fbbf24;
      }

      &:hover {
        transform: scale(1.15);
      }
    }

    .clear-rating {
      background: none;
      border: none;
      color: #6b7280;
      font-size: 12px;
      cursor: pointer;
      margin-left: 8px;

      &:hover {
        color: #ef4444;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .cancel-btn {
      padding: 10px 24px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #9ca3af;
      font-size: 14px;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .submit-btn {
      padding: 10px 28px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  `],
})
export class AddGameComponent {
  private gameService = inject(GameService);
  private router = inject(Router);

  statusEntries = Object.entries(STATUS_CONFIG);
  platformOptions = PLATFORM_OPTIONS;
  genreOptions = GENRE_OPTIONS;

  title = signal('');
  coverUrl = signal('');
  developer = signal('');
  releaseYear = signal<number | null>(null);
  status = signal<GameStatus>('backlog');
  selectedPlatforms = signal<GamePlatform[]>([]);
  selectedGenres = signal<string[]>([]);
  progress = signal(0);
  hoursPlayed = signal(0);
  rating = signal<number | null>(null);
  dateStarted = signal<string | null>(null);
  dateCompleted = signal<string | null>(null);
  notes = signal('');

  togglePlatform(p: GamePlatform) {
    this.selectedPlatforms.update((arr) =>
      arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p],
    );
  }

  toggleGenre(g: string) {
    this.selectedGenres.update((arr) =>
      arr.includes(g) ? arr.filter((x) => x !== g) : [...arr, g],
    );
  }

  onSubmit() {
    if (!this.title()) return;

    this.gameService.addGame({
      title: this.title(),
      coverUrl: this.coverUrl() || 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" fill="none">
          <rect width="300" height="400" fill="#1a1a2e"/>
          <text x="150" y="200" text-anchor="middle" fill="#4b5563" font-size="48">🎮</text>
        </svg>
      `),
      platform: this.selectedPlatforms(),
      genre: this.selectedGenres(),
      status: this.status(),
      rating: this.rating() as any,
      progress: this.progress(),
      hoursPlayed: this.hoursPlayed(),
      dateStarted: this.dateStarted() || null,
      dateCompleted: this.dateCompleted() || null,
      notes: this.notes(),
      favorite: false,
      developer: this.developer(),
      releaseYear: this.releaseYear(),
    });

    this.router.navigate(['/library']);
  }

  goBack() {
    this.router.navigate(['/library']);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}