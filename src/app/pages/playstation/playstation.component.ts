import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PsnService } from '../../services/psn.service';
import { GameService } from '../../services/game.service';
import { PsnGame, PsnTrophy } from '../../models/psn.model';

@Component({
  selector: 'app-playstation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="psn-container">
      <!-- HEADER -->
      <header class="page-header">
        <div class="header-left">
          <div class="brand-badge">
            <span class="ps-icon">🎮</span>
            <span class="ps-title">PlayStation Network</span>
          </div>
          <h1 class="page-heading">PlayStation Library & Trophies</h1>
          <p class="page-sub">Connect your PSN account to sync your games, trophies, and completion stats dynamically.</p>
        </div>

        @if (psnService.isAuthenticated()) {
          <div class="header-actions">
            @if (psnService.profile()) {
              <button class="sync-all-btn" (click)="importAllToLibrary()" [disabled]="isImportingAll()">
                {{ isImportingAll() ? '⏳ Importing...' : '📥 Sync All to Tracker' }}
              </button>
            }
            <button class="logout-btn" (click)="confirmDisconnect()">
              🔌 Disconnect
            </button>
          </div>
        }
      </header>

      <!-- NOT CONNECTED STATE (LOGIN / CONNECT FLOW) -->
      @if (!psnService.isAuthenticated()) {
        <div class="connect-card">
          <div class="connect-icon-wrapper">
            <svg class="ps-logo-svg" viewBox="0 0 32 32" width="56" height="56" fill="currentColor">
              <path d="M14.615 1.595c-1.896.79-3.23 2.502-3.27 4.204-.047 1.83 1.258 3.513 3.23 4.167v3.298c-3.791-.976-7.391-2.906-10.428-5.592L0 12.87c3.963 3.655 8.948 5.86 14.18 6.223v2.304c-3.132.222-6.242.887-9.214 1.979l1.782 4.41c2.378-.857 4.88-1.378 7.432-1.554v4.173h4.482V19.98c5.44-.393 10.6-2.585 14.697-6.216l-4.14-5.207c-3.197 2.73-7.007 4.673-11.04 5.626v-4.8c1.373-.393 2.37-1.464 2.404-2.83.036-1.552-1.077-3.056-2.68-3.744l-3.5-1.214zm1.196 2.658c.846.333 1.34 1.054 1.326 1.764-.015.753-.594 1.487-1.442 1.821l-.014-3.651.13.066z"/>
            </svg>
          </div>
          <h2>Connect Your PlayStation Account</h2>
          <p class="connect-desc">
            Access your live PlayStation library, trophy progress, hours, and platinum accomplishments.
          </p>

          <div class="npsso-guide">
            <div class="guide-step">
              <span class="step-num">1</span>
              <span>Sign in to your account at <a href="https://www.playstation.com" target="_blank" rel="noopener noreferrer">playstation.com</a> in a new tab.</span>
            </div>
            <div class="guide-step">
              <span class="step-num">2</span>
              <span>Visit <a href="https://ca.account.sony.com/api/v1/ssocookie" target="_blank" rel="noopener noreferrer">ca.account.sony.com/api/v1/ssocookie</a> to view your 64-character <code>npsso</code> code.</span>
            </div>
            <div class="guide-step">
              <span class="step-num">3</span>
              <span>Paste your NPSSO token below to securely link your live profile.</span>
            </div>
          </div>

          <form class="connect-form" (ngSubmit)="connectWithNpsso()">
            <div class="input-wrapper">
              <input
                type="password"
                [(ngModel)]="npssoInput"
                name="npsso"
                placeholder="Paste your 64-character NPSSO token here..."
                required
                class="npsso-input"
              />
              <button
                type="submit"
                class="connect-submit-btn"
                [disabled]="!npssoInput.trim() || psnService.isLoading()"
              >
                @if (psnService.isLoading()) {
                  <span class="spinner"></span> Connecting...
                } @else {
                  Link PSN Account →
                }
              </button>
            </div>

            @if (psnService.error()) {
              <div class="error-banner">
                ⚠️ {{ psnService.error() }}
              </div>
            }

            <p class="security-note">
              🔒 Your NPSSO stays in local session memory and is used solely to fetch your trophies and game metadata through the local proxy.
            </p>
          </form>
        </div>
      } @else {
        <!-- CONNECTED VIEW: PROFILE & TROPHIES SUMMARY -->
        @if (psnService.profile(); as profile) {
          <div class="profile-hero">
            <div class="profile-avatar-box">
              <img
                [src]="profile.avatarUrl || defaultAvatar"
                alt="Avatar"
                class="avatar-img"
              />
              @if (profile.isPlus) {
                <span class="plus-pill" title="PlayStation Plus Member">PLUS</span>
              }
            </div>

            <div class="profile-info">
              <div class="profile-name-row">
                <h2 class="online-id">{{ profile.onlineId }}</h2>
                <span class="account-badge">PlayStation Network</span>
                <button class="hero-disconnect-btn" (click)="confirmDisconnect()" title="Disconnect this PSN account">
                  🔌 Disconnect
                </button>
              </div>
              @if (profile.aboutMe) {
                <p class="about-me">"{{ profile.aboutMe }}"</p>
              }

              <!-- TROPHY LEVEL BAR -->
              @if (psnService.trophyStats(); as ts) {
                <div class="trophy-level-row">
                  <div class="level-badge">
                    <span class="level-icon">🏆</span>
                    <span class="level-val">Level {{ ts.level || 1 }}</span>
                  </div>
                  <div class="level-bar-track">
                    <div class="level-bar-fill" [style.width.%]="ts.progress || 0"></div>
                  </div>
                  <span class="level-pct">{{ ts.progress || 0 }}% to next level</span>
                </div>
              }
            </div>

            <!-- TROPHIES BADGES -->
            @if (psnService.trophyStats(); as ts) {
              <div class="trophy-counters">
                <div class="trophy-stat platinum">
                  <span class="t-icon">🏆</span>
                  <div class="t-meta">
                    <span class="t-count">{{ ts.platinum }}</span>
                    <span class="t-name">Platinum</span>
                  </div>
                </div>
                <div class="trophy-stat gold">
                  <span class="t-icon">🥇</span>
                  <div class="t-meta">
                    <span class="t-count">{{ ts.gold }}</span>
                    <span class="t-name">Gold</span>
                  </div>
                </div>
                <div class="trophy-stat silver">
                  <span class="t-icon">🥈</span>
                  <div class="t-meta">
                    <span class="t-count">{{ ts.silver }}</span>
                    <span class="t-name">Silver</span>
                  </div>
                </div>
                <div class="trophy-stat bronze">
                  <span class="t-icon">🥉</span>
                  <div class="t-meta">
                    <span class="t-count">{{ ts.bronze }}</span>
                    <span class="t-name">Bronze</span>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- METRICS ROW -->
        <div class="metrics-row">
          <div class="metric-box">
            <span class="m-val">{{ psnService.totalGames() }}</span>
            <span class="m-label">PlayStation Titles</span>
          </div>
          <div class="metric-box">
            <span class="m-val">{{ completedCount() }}</span>
            <span class="m-label">100% Completed</span>
          </div>
          <div class="metric-box">
            <span class="m-val">{{ inProgressCount() }}</span>
            <span class="m-label">In Progress</span>
          </div>
          <div class="metric-box">
            <span class="m-val">{{ psnService.trophyStats().platinum }}</span>
            <span class="m-label">Platinums Earned</span>
          </div>
          <div class="metric-box">
            <span class="m-val">{{ psnService.trophyStats().total }}</span>
            <span class="m-label">Total Trophies</span>
          </div>
        </div>

        <!-- SEARCH AND FILTER CONTROLS -->
        <div class="filter-bar">
          <div class="search-input-box">
            <span class="search-lens">🔍</span>
            <input
              type="text"
              placeholder="Search your PlayStation titles..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              class="psn-search"
            />
            @if (searchQuery()) {
              <button class="clear-search" (click)="searchQuery.set('')">✕</button>
            }
          </div>

          <div class="tabs-group">
            <button
              class="tab-btn"
              [class.active]="filterStatus() === 'all'"
              (click)="filterStatus.set('all')"
            >
              All ({{ psnService.games().length }})
            </button>
            <button
              class="tab-btn"
              [class.active]="filterStatus() === 'completed'"
              (click)="filterStatus.set('completed')"
            >
              🏆 Completed ({{ completedCount() }})
            </button>
            <button
              class="tab-btn"
              [class.active]="filterStatus() === 'playing'"
              (click)="filterStatus.set('playing')"
            >
              🎮 In Progress ({{ inProgressCount() }})
            </button>
            <button
              class="tab-btn"
              [class.active]="filterStatus() === 'backlog'"
              (click)="filterStatus.set('backlog')"
            >
              📦 Backlog ({{ backlogCount() }})
            </button>
          </div>

          <select
            [ngModel]="platformFilter()"
            (ngModelChange)="platformFilter.set($event)"
            class="platform-select"
          >
            <option value="all">All Platforms</option>
            <option value="PS5">PS5</option>
            <option value="PS4">PS4</option>
            <option value="PS3">PS3</option>
            <option value="PSVITA">PS Vita</option>
          </select>
        </div>

        <!-- NOTIFICATION BANNER IF IMPORT SUCCESS -->
        @if (notificationMessage()) {
          <div class="notification-banner">
            {{ notificationMessage() }}
          </div>
        }

        <!-- GAMES GRID -->
        @if (filteredGames().length > 0) {
          <div class="psn-games-grid">
            @for (game of filteredGames(); track game.npCommunicationId) {
              <div class="psn-game-card">
                <div class="game-cover-area">
                  <img
                    [src]="game.iconUrl"
                    [alt]="game.title"
                    loading="lazy"
                    (error)="handleImgError($event)"
                  />
                  <span class="platform-tag" [class.ps5]="game.platform.includes('PS5')">
                    {{ game.platform || 'PS' }}
                  </span>

                  @if (game.progress === 100 || game.earnedTrophies.platinum > 0) {
                    <div class="platinum-badge" title="100% or Platinum unlocked!">
                      🏆 100% Completed
                    </div>
                  }
                </div>

                <div class="game-details">
                  <h3 class="game-title" [title]="game.title">{{ game.title }}</h3>

                  <!-- PROGRESS BAR -->
                  <div class="progress-wrap">
                    <div class="progress-label-row">
                      <span>Progress</span>
                      <div class="progress-meta-right">
                        <button
                          class="card-hours-tag"
                          [class.has-hours]="game.hoursPlayed && game.hoursPlayed > 0"
                          (click)="setCustomHours(game, $event)"
                          title="Hours played (click to adjust)"
                        >
                          ⏱️ {{ (game.hoursPlayed && game.hoursPlayed > 0) ? ((game.hoursPlayed | number:'1.0-1') + 'h') : 'Set hours' }}
                        </button>
                        <strong class="pct-num">{{ game.progress }}%</strong>
                      </div>
                    </div>
                    <div class="bar-bg">
                      <div
                        class="bar-fill"
                        [style.width.%]="game.progress"
                        [class.complete]="game.progress === 100"
                      ></div>
                    </div>
                  </div>

                  <!-- TROPHY BREAKDOWN -->
                  <div class="game-trophies-row">
                    <span class="t-pill plat" title="Platinum">
                      🏆 {{ game.earnedTrophies.platinum }}/{{ game.definedTrophies.platinum }}
                    </span>
                    <span class="t-pill gold" title="Gold">
                      🥇 {{ game.earnedTrophies.gold }}/{{ game.definedTrophies.gold }}
                    </span>
                    <span class="t-pill silver" title="Silver">
                      🥈 {{ game.earnedTrophies.silver }}/{{ game.definedTrophies.silver }}
                    </span>
                    <span class="t-pill bronze" title="Bronze">
                      🥉 {{ game.earnedTrophies.bronze }}/{{ game.definedTrophies.bronze }}
                    </span>
                  </div>

                  <!-- CARD ACTIONS -->
                  <div class="game-card-actions">
                    <button class="view-trophies-btn" (click)="openTrophiesModal(game)">
                      📜 View Trophies
                    </button>
                    <button
                      class="sync-single-btn"
                      [class.synced]="isGameInTracker(game)"
                      (click)="syncGameToTracker(game)"
                    >
                      {{ isGameInTracker(game) ? '✓ In Library' : '+ Add to Library' }}
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <span class="empty-emoji">🎮</span>
            <h3>No games found</h3>
            <p>Try modifying your search or filter options.</p>
          </div>
        }
      }

      <!-- TROPHIES MODAL -->
      @if (selectedGame()) {
        <div class="modal-backdrop" (click)="closeTrophiesModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-box">
                <img [src]="selectedGame()!.iconUrl" class="modal-game-icon" alt="" />
                <div>
                  <h2>{{ selectedGame()!.title }}</h2>
                  <span class="modal-sub">
                    {{ selectedGame()!.platform }} • {{ selectedGame()!.progress }}% Completed
                  </span>
                </div>
              </div>
              <button class="modal-close-btn" (click)="closeTrophiesModal()">✕</button>
            </div>

            <div class="modal-body">
              @if (loadingTrophies()) {
                <div class="modal-loader">
                  <div class="spinner"></div>
                  <p>Loading PlayStation trophies...</p>
                </div>
              } @else if (trophiesList().length === 0) {
                <p class="no-trophies">No trophy information available for this title.</p>
              } @else {
                <div class="trophies-scroll-list">
                  @for (t of trophiesList(); track t.trophyId) {
                    <div class="trophy-row" [class.unlocked]="t.earned">
                      <div class="trophy-icon-wrap">
                        <img
                          [src]="t.trophyIconUrl"
                          [alt]="t.trophyName"
                          loading="lazy"
                          (error)="handleImgError($event)"
                        />
                        @if (t.earned) {
                          <span class="earned-checkmark">✓</span>
                        }
                      </div>

                      <div class="trophy-info-wrap">
                        <div class="t-title-row">
                          <span class="t-name">{{ t.trophyName }}</span>
                          <span class="trophy-tier-tag" [class]="t.trophyType">
                            {{ t.trophyType | uppercase }}
                          </span>
                        </div>
                        <p class="t-desc">{{ t.trophyDetail || 'Hidden Trophy' }}</p>
                        @if (t.earned && t.earnedDateTime) {
                          <span class="t-earned-date">
                            Unlocked: {{ t.earnedDateTime | date:'mediumDate' }}
                          </span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="modal-footer">
              <button class="modal-btn-close" (click)="closeTrophiesModal()">Close</button>
              <button class="modal-btn-sync" (click)="syncGameToTracker(selectedGame()!)">
                {{ isGameInTracker(selectedGame()!) ? 'Already In Library' : 'Import to GameTracker' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .psn-container {
      padding: 36px 48px;
      max-width: 1600px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    /* HEADER */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      background: rgba(0, 67, 156, 0.25);
      border: 1px solid rgba(0, 112, 239, 0.4);
      border-radius: 20px;
      margin-bottom: 8px;
      font-size: 12px;
      font-weight: 600;
      color: #60a5fa;
    }

    .page-heading {
      font-size: 30px;
      font-weight: 800;
      color: #f9fafb;
      margin: 0 0 4px;
      letter-spacing: -0.02em;
    }

    .page-sub {
      color: #9ca3af;
      font-size: 14px;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .sync-all-btn {
      padding: 10px 18px;
      background: linear-gradient(135deg, #0070d1, #00439c);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(0, 112, 209, 0.35);

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        filter: brightness(1.1);
      }
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .logout-btn {
      padding: 10px 16px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      color: #d1d5db;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.4);
        color: #fca5a5;
      }
    }

    /* CONNECT CARD */
    .connect-card {
      background: #151528;
      border: 1px solid rgba(0, 112, 209, 0.25);
      border-radius: 20px;
      padding: 48px 36px;
      max-width: 720px;
      margin: 30px auto;
      text-align: center;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);

      h2 {
        font-size: 24px;
        color: #f3f4f6;
        margin: 16px 0 8px;
      }
    }

    .connect-icon-wrapper {
      width: 80px;
      height: 80px;
      margin: 0 auto;
      border-radius: 24px;
      background: linear-gradient(135deg, #00439c, #0070d1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 10px 25px rgba(0, 67, 156, 0.5);
    }

    .connect-desc {
      color: #9ca3af;
      font-size: 15px;
      margin-bottom: 28px;
      line-height: 1.5;
    }

    .npsso-guide {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 20px;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 28px;
    }

    .guide-step {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 13.5px;
      color: #d1d5db;

      a {
        color: #60a5fa;
        text-decoration: underline;
        font-weight: 500;
      }

      code {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        color: #93c5fd;
      }
    }

    .step-num {
      width: 22px;
      height: 22px;
      background: #0070d1;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .connect-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .input-wrapper {
      display: flex;
      gap: 10px;

      @media (max-width: 640px) {
        flex-direction: column;
      }
    }

    .npsso-input {
      flex: 1;
      padding: 14px 18px;
      background: #0d0d1a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      color: #f3f4f6;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;

      &:focus {
        border-color: #0070d1;
        box-shadow: 0 0 0 3px rgba(0, 112, 209, 0.25);
      }
    }

    .connect-submit-btn {
      padding: 14px 28px;
      background: linear-gradient(135deg, #0070d1, #00439c);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        filter: brightness(1.1);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .security-note {
      font-size: 12px;
      color: #6b7280;
      margin: 8px 0 0;
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      text-align: left;
    }

    /* PROFILE HERO */
    .profile-hero {
      background: linear-gradient(135deg, #161836, #0e122b);
      border: 1px solid rgba(0, 112, 209, 0.3);
      border-radius: 20px;
      padding: 28px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 24px;
      align-items: center;
      margin-bottom: 24px;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
        text-align: center;
      }
    }

    .profile-avatar-box {
      position: relative;
      width: 88px;
      height: 88px;
      margin: 0 auto;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 22px;
      object-fit: cover;
      border: 2px solid #0070d1;
      box-shadow: 0 8px 24px rgba(0, 67, 156, 0.4);
    }

    .plus-pill {
      position: absolute;
      bottom: -4px;
      right: -4px;
      background: #facc15;
      color: #000;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
      letter-spacing: 0.05em;
    }

    .profile-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .profile-name-row {
      display: flex;
      align-items: center;
      gap: 12px;

      @media (max-width: 900px) {
        justify-content: center;
      }
    }

    .online-id {
      font-size: 24px;
      font-weight: 700;
      color: #f9fafb;
      margin: 0;
    }

    .account-badge {
      font-size: 11px;
      font-weight: 600;
      color: #60a5fa;
      background: rgba(0, 112, 209, 0.2);
      border: 1px solid rgba(0, 112, 209, 0.4);
      padding: 2px 8px;
      border-radius: 12px;
    }

    .hero-disconnect-btn {
      padding: 4px 10px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      color: #fca5a5;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-left: 4px;

      &:hover {
        background: rgba(239, 68, 68, 0.25);
        color: white;
        border-color: rgba(239, 68, 68, 0.6);
      }
    }

    .about-me {
      font-size: 13px;
      color: #9ca3af;
      margin: 0;
      font-style: italic;
    }

    .trophy-level-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 6px;

      @media (max-width: 900px) {
        justify-content: center;
        flex-wrap: wrap;
      }
    }

    .level-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.06);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #facc15;
    }

    .level-bar-track {
      width: 140px;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .level-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #facc15, #f59e0b);
      border-radius: 4px;
    }

    .level-pct {
      font-size: 11px;
      color: #9ca3af;
    }

    .trophy-counters {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;

      @media (max-width: 900px) {
        max-width: 320px;
        margin: 0 auto;
      }
    }

    .trophy-stat {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 100px;

      &.platinum { border-color: rgba(147, 197, 253, 0.3); }
      &.gold { border-color: rgba(250, 204, 21, 0.3); }
      &.silver { border-color: rgba(209, 213, 219, 0.3); }
      &.bronze { border-color: rgba(249, 115, 22, 0.3); }
    }

    .t-icon {
      font-size: 20px;
    }

    .t-meta {
      display: flex;
      flex-direction: column;
    }

    .t-count {
      font-size: 16px;
      font-weight: 800;
      color: #f3f4f6;
      line-height: 1.1;
    }

    .t-name {
      font-size: 10px;
      color: #9ca3af;
      text-transform: uppercase;
      font-weight: 600;
    }

    /* METRICS ROW */
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }

    .metric-box {
      background: #141426;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .m-val {
      font-size: 26px;
      font-weight: 800;
      color: #f3f4f6;
    }

    .m-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }

    /* FILTER BAR */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-input-box {
      position: relative;
      flex: 1;
      min-width: 220px;
    }

    .search-lens {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 13px;
    }

    .psn-search {
      width: 100%;
      padding: 10px 36px 10px 36px;
      background: #151528;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #f3f4f6;
      font-size: 13px;
      outline: none;

      &:focus {
        border-color: #0070d1;
      }
    }

    .clear-search {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
    }

    .tabs-group {
      display: flex;
      background: #151528;
      padding: 3px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      gap: 2px;
    }

    .tab-btn {
      padding: 7px 14px;
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 12.5px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        color: #f3f4f6;
      }

      &.active {
        background: #0070d1;
        color: white;
      }
    }

    .platform-select {
      padding: 9px 14px;
      background: #151528;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #d1d5db;
      font-size: 13px;
      outline: none;
      cursor: pointer;
    }

    .notification-banner {
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.4);
      color: #4ade80;
      padding: 12px 18px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    /* GAMES GRID */
    .psn-games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .psn-game-card {
      background: #141426;
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.25s ease;

      &:hover {
        transform: translateY(-4px);
        border-color: rgba(0, 112, 209, 0.4);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
      }
    }

    .game-cover-area {
      position: relative;
      aspect-ratio: 16 / 9;
      background: #0d0d1a;
      overflow: hidden;

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

    .platform-tag {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #d1d5db;
      border: 1px solid rgba(255, 255, 255, 0.15);

      &.ps5 {
        background: #0070d1;
        border-color: #38bdf8;
        color: white;
      }
    }

    .platinum-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9));
      backdrop-filter: blur(4px);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      color: white;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }

    .game-details {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }

    .game-title {
      font-size: 15px;
      font-weight: 700;
      color: #f3f4f6;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .progress-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .progress-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #9ca3af;
    }

    .progress-meta-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-hours-tag {
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 2px 7px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;

      &:hover {
        background: rgba(167, 139, 250, 0.2);
        color: #c4b5fd;
        border-color: rgba(167, 139, 250, 0.4);
        transform: translateY(-1px);
      }

      &.has-hours {
        color: #c4b5fd;
        background: rgba(167, 139, 250, 0.15);
        border-color: rgba(167, 139, 250, 0.3);
      }
    }

    .pct-num {
      color: #60a5fa;
    }

    .bar-bg {
      height: 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 3px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #0070d1, #38bdf8);
      border-radius: 3px;
      transition: width 0.4s ease;

      &.complete {
        background: linear-gradient(90deg, #10b981, #34d399);
      }
    }

    .game-trophies-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .t-pill {
      font-size: 11px;
      padding: 3px 7px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      color: #9ca3af;
      font-weight: 600;

      &.plat { color: #93c5fd; }
      &.gold { color: #facc15; }
      &.silver { color: #d1d5db; }
      &.bronze { color: #fdba74; }
    }

    .game-card-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
      padding-top: 8px;
    }

    .view-trophies-btn {
      flex: 1;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #d1d5db;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
    }

    .sync-single-btn {
      flex: 1;
      padding: 8px 12px;
      background: rgba(0, 112, 209, 0.15);
      border: 1px solid rgba(0, 112, 209, 0.35);
      border-radius: 8px;
      color: #60a5fa;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(0, 112, 209, 0.3);
      }

      &.synced {
        background: rgba(34, 197, 94, 0.15);
        border-color: rgba(34, 197, 94, 0.35);
        color: #4ade80;
      }
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .modal-card {
      background: #141426;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      width: 100%;
      max-width: 640px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
      animation: modalFade 0.2s ease-out;
    }

    @keyframes modalFade {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title-box {
      display: flex;
      align-items: center;
      gap: 14px;

      h2 {
        font-size: 18px;
        color: #f9fafb;
        margin: 0;
      }
    }

    .modal-game-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      object-fit: cover;
    }

    .modal-sub {
      font-size: 12px;
      color: #9ca3af;
    }

    .modal-close-btn {
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 18px;
      cursor: pointer;
      padding: 6px;
      &:hover { color: white; }
    }

    .modal-body {
      padding: 20px 24px;
      overflow-y: auto;
      flex: 1;
    }

    .modal-loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
      color: #9ca3af;
    }

    .trophies-scroll-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .trophy-row {
      display: flex;
      gap: 14px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      align-items: center;
      opacity: 0.7;

      &.unlocked {
        opacity: 1;
        background: rgba(0, 112, 209, 0.08);
        border-color: rgba(0, 112, 209, 0.25);
      }
    }

    .trophy-icon-wrap {
      position: relative;
      width: 44px;
      height: 44px;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        border-radius: 8px;
        object-fit: cover;
      }
    }

    .earned-checkmark {
      position: absolute;
      bottom: -4px;
      right: -4px;
      background: #22c55e;
      color: white;
      font-size: 10px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }

    .trophy-info-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .t-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .t-name {
      font-size: 14px;
      font-weight: 600;
      color: #f3f4f6;
    }

    .trophy-tier-tag {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;

      &.platinum { background: rgba(147, 197, 253, 0.2); color: #93c5fd; }
      &.gold { background: rgba(250, 204, 21, 0.2); color: #facc15; }
      &.silver { background: rgba(209, 213, 219, 0.2); color: #e5e7eb; }
      &.bronze { background: rgba(249, 115, 22, 0.2); color: #fdba74; }
    }

    .t-desc {
      font-size: 12px;
      color: #9ca3af;
      margin: 0;
    }

    .t-earned-date {
      font-size: 10.5px;
      color: #60a5fa;
      margin-top: 2px;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .modal-btn-close {
      padding: 8px 18px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      color: #d1d5db;
      font-size: 13px;
      cursor: pointer;
    }

    .modal-btn-sync {
      padding: 8px 20px;
      background: #0070d1;
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;

      .empty-emoji {
        font-size: 48px;
        display: block;
        margin-bottom: 12px;
      }
      h3 { color: #d1d5db; margin: 0 0 6px; }
      p { margin: 0; }
    }
  `],
})
export class PlaystationComponent implements OnInit {
  psnService = inject(PsnService);
  gameService = inject(GameService);

  readonly defaultAvatar =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#00439c"/><text x="50" y="62" font-size="40" text-anchor="middle" fill="white">PS</text></svg>'
    );

  npssoInput = '';
  searchQuery = signal('');
  filterStatus = signal<'all' | 'completed' | 'playing' | 'backlog'>('all');
  platformFilter = signal<string>('all');
  isImportingAll = signal(false);
  notificationMessage = signal<string | null>(null);

  selectedGame = signal<PsnGame | null>(null);
  trophiesList = signal<PsnTrophy[]>([]);
  loadingTrophies = signal(false);

  ngOnInit(): void {
    this.psnService.checkAuthStatus();
  }

  // Count computed getters
  completedCount = computed(() => {
    return this.psnService.games().filter((g) => g.progress === 100 || g.earnedTrophies.platinum > 0).length;
  });

  inProgressCount = computed(() => {
    return this.psnService.games().filter((g) => g.progress > 0 && g.progress < 100 && g.earnedTrophies.platinum === 0).length;
  });

  backlogCount = computed(() => {
    return this.psnService.games().filter((g) => g.progress === 0).length;
  });

  filteredGames = computed(() => {
    let list = this.psnService.games();
    const q = this.searchQuery().toLowerCase().trim();

    if (q) {
      list = list.filter((g) => g.title.toLowerCase().includes(q));
    }

    const status = this.filterStatus();
    if (status === 'completed') {
      list = list.filter((g) => g.progress === 100 || g.earnedTrophies.platinum > 0);
    } else if (status === 'playing') {
      list = list.filter((g) => g.progress > 0 && g.progress < 100 && g.earnedTrophies.platinum === 0);
    } else if (status === 'backlog') {
      list = list.filter((g) => g.progress === 0);
    }

    const pf = this.platformFilter();
    if (pf !== 'all') {
      list = list.filter((g) => g.platform.toUpperCase().includes(pf.toUpperCase()));
    }

    return list;
  });

  async connectWithNpsso(): Promise<void> {
    if (!this.npssoInput.trim()) return;
    const ok = await this.psnService.authenticate(this.npssoInput.trim());
    if (ok) {
      this.npssoInput = '';
    }
  }

  confirmDisconnect(): void {
    if (confirm('Are you sure you want to disconnect your PlayStation account? You can re-link it anytime.')) {
      this.disconnect();
    }
  }

  async disconnect(): Promise<void> {
    await this.psnService.logout();
    this.showNotification('PlayStation account disconnected successfully.');
  }

  isGameInTracker(game: PsnGame): boolean {
    return this.gameService.games().some(
      (g) => g.title.toLowerCase().trim() === game.title.toLowerCase().trim()
    );
  }

  syncGameToTracker(game: PsnGame): void {
    const existing = this.gameService.games().find(
      (g) => g.title.toLowerCase().trim() === game.title.toLowerCase().trim()
    );

    const isComplete = game.progress === 100 || game.earnedTrophies.platinum > 0;
    const status: any = isComplete ? 'completed' : game.progress > 0 ? 'playing' : 'backlog';
    const activityDate = game.lastUpdatedDateTime
      ? new Date(game.lastUpdatedDateTime).toISOString()
      : new Date().toISOString();

    if (existing) {
      // Sync/update existing game in library to keep statistics updated
      this.gameService.updateGame(existing.id, {
        progress: game.progress,
        hoursPlayed: (game.hoursPlayed && game.hoursPlayed > 0) ? game.hoursPlayed : existing.hoursPlayed,
        status: status,
        rating: isComplete ? 5 : (game.progress >= 50 ? 4 : existing.rating),
        dateCompleted: isComplete ? (existing.dateCompleted || activityDate) : existing.dateCompleted,
        notes: `PlayStation Synced. Trophies: 🏆 ${game.earnedTrophies.platinum} Plat, 🥇 ${game.earnedTrophies.gold} Gold, 🥈 ${game.earnedTrophies.silver} Silver, 🥉 ${game.earnedTrophies.bronze} Bronze.`,
      });
      this.showNotification(`Updated "${game.title}" (${game.progress}%, ${game.hoursPlayed || 0}h) in your library!`);
      return;
    }

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

    this.showNotification(`Added "${game.title}" (${game.progress}%) to your GameTracker library!`);
  }

  setCustomHours(game: PsnGame, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const current = game.hoursPlayed || 0;
    const input = prompt(`Enter hours played for "${game.title}":`, current > 0 ? String(current) : '15');
    if (input !== null) {
      const parsed = parseFloat(input.trim());
      if (!isNaN(parsed) && parsed >= 0) {
        const rounded = Math.round(parsed * 10) / 10;
        game.hoursPlayed = rounded;
        const existing = this.gameService.games().find(
          (g) => g.title.toLowerCase().trim() === game.title.toLowerCase().trim()
        );
        if (existing) {
          this.gameService.updateGame(existing.id, { hoursPlayed: rounded });
          this.showNotification(`Updated "${game.title}" playtime to ${rounded} hours!`);
        } else {
          this.showNotification(`Set playtime to ${rounded} hours for "${game.title}". Click "+ Add to Library" to sync it!`);
        }
      }
    }
  }

  async importAllToLibrary(): Promise<void> {
    const games = this.psnService.games();
    if (games.length === 0) return;

    this.isImportingAll.set(true);
    let addedCount = 0;
    let updatedCount = 0;

    for (const game of games) {
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
          notes: `PlayStation Synced. Trophies: 🏆 ${game.earnedTrophies.platinum} Plat, 🥇 ${game.earnedTrophies.gold} Gold, 🥈 ${game.earnedTrophies.silver} Silver, 🥉 ${game.earnedTrophies.bronze} Bronze.`,
        });
        updatedCount++;
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
        addedCount++;
      }
    }

    this.isImportingAll.set(false);
    this.showNotification(`Synced ${addedCount + updatedCount} PlayStation games with your tracker statistics!`);
  }

  async openTrophiesModal(game: PsnGame): Promise<void> {
    this.selectedGame.set(game);
    this.loadingTrophies.set(true);
    this.trophiesList.set([]);

    const trophies = await this.psnService.getTrophies(
      game.npCommunicationId,
      game.npServiceName || 'trophy'
    );
    this.trophiesList.set(trophies);
    this.loadingTrophies.set(false);
  }

  closeTrophiesModal(): void {
    this.selectedGame.set(null);
    this.trophiesList.set([]);
  }

  showNotification(msg: string): void {
    this.notificationMessage.set(msg);
    setTimeout(() => {
      this.notificationMessage.set(null);
    }, 4500);
  }

  handleImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" fill="%230d0d1a">
        <rect width="300" height="200" fill="%23141426"/>
        <text x="150" y="105" text-anchor="middle" fill="%230070d1" font-size="36" font-family="sans-serif">🎮 PlayStation</text>
      </svg>
    `);
  }
}
