import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GameService } from '../../services/game.service';
import { PsnService } from '../../services/psn.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">🎮</span>
        <h1 class="brand-text">GameTracker</h1>
      </div>

      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" title="Dashboard">
          <span class="nav-icon">📊</span>
          <span class="nav-label">Dashboard</span>
        </a>
        <a routerLink="/library" routerLinkActive="active" class="nav-item" title="Library">
          <span class="nav-icon">📚</span>
          <span class="nav-label">Library</span>
          <span class="nav-badge">{{ gameService.stats().totalGames }}</span>
        </a>
        <div class="psn-nav-row">
          <a routerLink="/playstation" routerLinkActive="active" class="nav-item psn-nav-item" title="PlayStation">
            <span class="nav-icon ps-blue">🎮</span>
            <span class="nav-label">PlayStation</span>
            @if (psnService.isAuthenticated()) {
              <span class="nav-badge psn-live">LIVE</span>
            } @else {
              <span class="nav-badge psn-connect">CONNECT</span>
            }
          </a>
        </div>
        <a routerLink="/add" routerLinkActive="active" class="nav-item" title="Add Game">
          <span class="nav-icon">➕</span>
          <span class="nav-label">Add Game</span>
        </a>
        <a routerLink="/stats" routerLinkActive="active" class="nav-item" title="Statistics">
          <span class="nav-icon">📈</span>
          <span class="nav-label">Statistics</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <!-- USER PROFILE FOOTER TRIGGER -->
        <button
          class="user-profile-trigger"
          (click)="openAccountPopup($event)"
          [title]="psnService.isAuthenticated() ? (psnService.profile()?.onlineId || 'PlayStation Account') : 'Connect PlayStation Network'"
        >
          <div class="avatar-wrapper">
            @if (psnService.isAuthenticated() && psnService.profile()?.avatarUrl) {
              <img
                [src]="psnService.profile()?.avatarUrl"
                class="user-avatar-img"
                alt="PSN Avatar"
                (error)="handleAvatarError($event)"
              />
            } @else if (psnService.isAuthenticated()) {
              <div class="user-avatar-fallback psn-authed">🎮</div>
            } @else {
              <div class="user-avatar-fallback guest">👤</div>
            }
            @if (psnService.isAuthenticated()) {
              <span class="online-indicator"></span>
            }
          </div>

          <div class="user-meta">
            <div class="user-name-line">
              <span class="user-display-name">
                {{ psnService.isAuthenticated() ? (psnService.profile()?.onlineId || 'PSN Player') : 'Guest Player' }}
              </span>
              @if (psnService.profile()?.isPlus) {
                <span class="plus-badge">PLUS</span>
              }
            </div>
            <span class="user-subtext">
              @if (psnService.isAuthenticated()) {
                Level {{ psnService.trophyStats().level }} • Profile
              } @else {
                Connect PlayStation
              }
            </span>
          </div>

          <span class="user-chevron">⚙️</span>
        </button>

        <!-- ACCOUNT DETAILS POPUP MODAL -->
        @if (showAccountPopup()) {
          <div class="account-modal-backdrop" (click)="closeAccountPopup()">
            <div class="account-modal-card" (click)="$event.stopPropagation()">
              <div class="modal-card-header">
                <div class="modal-header-profile">
                  <div class="modal-avatar-box">
                    @if (psnService.isAuthenticated() && psnService.profile()?.avatarUrl) {
                      <img
                        [src]="psnService.profile()?.avatarUrl"
                        class="modal-avatar-img"
                        alt="PSN Avatar"
                        (error)="handleAvatarError($event)"
                      />
                    } @else if (psnService.isAuthenticated()) {
                      <div class="modal-avatar-fallback psn-authed">🎮</div>
                    } @else {
                      <div class="modal-avatar-fallback guest">👤</div>
                    }
                    @if (psnService.profile()?.isPlus) {
                      <span class="modal-plus-pill">PLUS</span>
                    }
                  </div>
                  <div class="modal-user-info">
                    <div class="modal-title-row">
                      <h2 class="modal-online-id">
                        {{ psnService.isAuthenticated() ? (psnService.profile()?.onlineId || 'PlayStation Player') : 'Guest Account' }}
                      </h2>
                    </div>
                    @if (psnService.isAuthenticated()) {
                      <span class="modal-acc-id">ID: {{ psnService.profile()?.accountId || 'Connected' }}</span>
                    } @else {
                      <span class="modal-acc-id">PlayStation Not Connected</span>
                    }
                  </div>
                </div>
                <button class="modal-close-icon-btn" (click)="closeAccountPopup()">✕</button>
              </div>

              @if (psnService.isAuthenticated()) {
                <div class="modal-card-body">
                  <div class="user-info-list">
                    <!-- Full Name -->
                    <div class="info-row">
                      <span class="info-label">👤 Full Name</span>
                      <strong class="info-value">
                        {{ psnService.profile()?.fullName || (psnService.profile()?.personalDetail?.firstName ? (psnService.profile()?.personalDetail?.firstName + ' ' + (psnService.profile()?.personalDetail?.lastName || '')) : (psnService.profile()?.onlineId || 'PlayStation User')) }}
                      </strong>
                    </div>

                    <!-- PSN Online ID -->
                    <div class="info-row">
                      <span class="info-label">🎮 Online ID</span>
                      <strong class="info-value ps-tag">{{ psnService.profile()?.onlineId }}</strong>
                    </div>

                    <!-- Account ID -->
                    <div class="info-row">
                      <span class="info-label">🆔 Account ID</span>
                      <span class="info-value mono-val">{{ psnService.profile()?.accountId || '—' }}</span>
                    </div>

                    <!-- Date of Birth (DOB) -->
                    @if (psnService.profile()?.dob) {
                      <div class="info-row">
                        <span class="info-label">🎂 Date of Birth</span>
                        <strong class="info-value">
                          {{ psnService.profile()?.dob }}
                          @if (psnService.profile()?.age) {
                            <span class="age-badge">Age {{ psnService.profile()?.age }}</span>
                          }
                        </strong>
                      </div>
                    }

                    <!-- Country -->
                    @if (psnService.profile()?.country) {
                      <div class="info-row">
                        <span class="info-label">🌍 Country</span>
                        <strong class="info-value">
                          {{ psnService.profile()?.country }}
                          @if (psnService.profile()?.countryCode) {
                            <span class="country-pill">{{ psnService.profile()?.countryCode }}</span>
                          }
                        </strong>
                      </div>
                    }

                    <!-- Language / Locale -->
                    @if (psnService.profile()?.locale || (psnService.profile()?.languages && psnService.profile()!.languages.length > 0)) {
                      <div class="info-row">
                        <span class="info-label">🗣️ Language</span>
                        <span class="info-value">{{ psnService.profile()?.locale || psnService.profile()?.languages?.[0] }}</span>
                      </div>
                    }

                    <!-- Plus Membership -->
                    <div class="info-row">
                      <span class="info-label">⭐ PS Plus</span>
                      <span class="info-value" [class.plus-active]="psnService.profile()?.isPlus">
                        {{ psnService.profile()?.isPlus ? 'Active Subscriber' : 'Not Subscribed' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="modal-card-footer">
                  <button class="modal-close-action-btn" (click)="closeAccountPopup()">Close</button>
                  <button class="modal-logout-btn" (click)="disconnectPsn($event)">
                    🔌 Disconnect
                  </button>
                </div>
              } @else {
                <div class="modal-card-body guest-body">
                  <div class="guest-prompt-icon">🎮</div>
                  <h3 class="guest-prompt-title">Connect PlayStation Network</h3>
                  <p class="guest-prompt-desc">
                    Synchronize your PlayStation trophies, games library, and playtime directly into your personal GameTracker.
                  </p>
                  <a routerLink="/playstation" class="modal-connect-btn" (click)="closeAccountPopup()">
                    ⚡ Connect PlayStation Account
                  </a>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 72px;
      min-height: 100vh;
      background: #0f0f1a;
      border-right: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
      padding: 0;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      overflow-x: hidden;
      overflow-y: auto;
      white-space: nowrap;
      transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.28s ease;

      &:hover {
        width: 260px;
        box-shadow: 12px 0 35px rgba(0, 0, 0, 0.7);
      }
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      min-height: 72px;
      box-sizing: border-box;
    }

    .brand-icon {
      font-size: 26px;
      min-width: 36px;
      text-align: center;
      flex-shrink: 0;
    }

    .brand-text {
      font-size: 19px;
      font-weight: 700;
      background: linear-gradient(135deg, #818cf8, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
      opacity: 0;
      transform: translateX(-10px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;

      .sidebar:hover & {
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
      }
    }

    .sidebar-nav {
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 11px 13px;
      border-radius: 12px;
      color: #9ca3af;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #e5e7eb;
      }

      &.active {
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
      }
    }

    .nav-icon {
      font-size: 20px;
      min-width: 26px;
      text-align: center;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-label {
      flex: 1;
      opacity: 0;
      transform: translateX(-8px);
      transition: opacity 0.2s ease, transform 0.2s ease;

      .sidebar:hover & {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .nav-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.1);
      color: #9ca3af;
      opacity: 0;
      transform: scale(0.8);
      transition: opacity 0.2s ease, transform 0.2s ease;

      .sidebar:hover & {
        opacity: 1;
        transform: scale(1);
      }

      &.psn-live {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
        font-weight: 700;
      }

      &.psn-connect {
        background: rgba(0, 112, 209, 0.2);
        color: #60a5fa;
        font-weight: 700;
      }
    }

    .psn-nav-row {
      display: flex;
      align-items: center;
      gap: 4px;
      position: relative;

      .nav-item {
        flex: 1;
      }
    }

    .sidebar-disconnect-btn {
      width: 24px;
      height: 24px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 6px;
      color: #fca5a5;
      font-size: 11px;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      margin-right: 4px;

      .sidebar:hover & {
        display: flex;
      }

      &:hover {
        background: rgba(239, 68, 68, 0.35);
        color: white;
      }
    }

    .sidebar-footer {
      margin-top: auto;
      padding: 12px 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      position: relative;
    }

    .user-profile-trigger {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 6px;
      background: none;
      border: 1px solid transparent;
      border-radius: 14px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.08);
      }
    }

    .avatar-wrapper {
      position: relative;
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }

    .user-avatar-img {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      object-fit: cover;
      border: 2px solid #0070d1;
      box-shadow: 0 4px 12px rgba(0, 112, 209, 0.35);
    }

    .user-avatar-fallback {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #9ca3af;

      &.psn-authed {
        background: linear-gradient(135deg, #0070d1, #00439c);
        color: white;
        border-color: #38bdf8;
      }
    }

    .online-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 10px;
      height: 10px;
      background: #10b981;
      border: 2px solid #0f0f1a;
      border-radius: 50%;
    }

    .user-meta {
      display: none;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
      opacity: 0;
      transform: translateX(-10px);
      transition: opacity 0.2s ease, transform 0.2s ease;

      .sidebar:hover & {
        display: flex;
        opacity: 1;
        transform: translateX(0);
      }
    }

    .user-name-line {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .user-display-name {
      font-size: 13.5px;
      font-weight: 700;
      color: #f3f4f6;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 130px;
    }

    .plus-badge {
      font-size: 8px;
      font-weight: 800;
      background: #facc15;
      color: #000;
      padding: 1px 4px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }

    .user-subtext {
      font-size: 11px;
      color: #9ca3af;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-chevron {
      display: none;
      font-size: 14px;
      color: #6b7280;
      margin-left: auto;
      transition: transform 0.2s;

      .sidebar:hover & {
        display: inline-block;
      }
    }

    /* POPUP MODAL */
    .account-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: modalFadeIn 0.2s ease;
    }

    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .account-modal-card {
      width: 100%;
      max-width: 440px;
      background: #121324;
      border: 1px solid rgba(0, 112, 209, 0.35);
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 112, 209, 0.15);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: modalScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalScaleUp {
      from { transform: scale(0.94); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      background: linear-gradient(135deg, #0b112c, #141738);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .modal-header-profile {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .modal-avatar-box {
      position: relative;
      width: 54px;
      height: 54px;
      flex-shrink: 0;
    }

    .modal-avatar-img {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      object-fit: cover;
      border: 2px solid #0070d1;
      box-shadow: 0 4px 16px rgba(0, 112, 209, 0.4);
    }

    .modal-avatar-fallback {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      background: rgba(255, 255, 255, 0.06);

      &.psn-authed {
        background: linear-gradient(135deg, #0070d1, #00439c);
        color: white;
      }
    }

    .modal-plus-pill {
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

    .modal-user-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .modal-online-id {
      font-size: 20px;
      font-weight: 800;
      color: #f3f4f6;
      margin: 0;
      line-height: 1.2;
    }

    .modal-acc-id {
      font-size: 12px;
      color: #9ca3af;
      font-family: monospace;
    }

    .modal-close-icon-btn {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #9ca3af;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: white;
      }
    }

    .modal-card-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .user-info-list {
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 16px;
      padding: 6px 18px;
    }

    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);

      &:last-child {
        border-bottom: none;
      }
    }

    .info-label {
      font-size: 13px;
      color: #9ca3af;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    .info-value {
      font-size: 13.5px;
      font-weight: 600;
      color: #f3f4f6;
      text-align: right;
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: flex-end;
    }

    .mono-val {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12.5px;
      color: #a78bfa;
      background: rgba(167, 139, 250, 0.1);
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid rgba(167, 139, 250, 0.2);
    }

    .ps-tag {
      color: #38bdf8;
      font-weight: 700;
    }

    .age-badge {
      font-size: 11px;
      color: #fbbf24;
      background: rgba(251, 191, 36, 0.12);
      border: 1px solid rgba(251, 191, 36, 0.25);
      padding: 2px 6px;
      border-radius: 6px;
      font-weight: 600;
    }

    .country-pill {
      font-size: 10px;
      color: #10b981;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      padding: 2px 6px;
      border-radius: 6px;
      font-weight: 700;
    }

    .plus-active {
      color: #facc15;
      font-weight: 700;
    }

    .modal-card-footer {
      display: flex;
      gap: 10px;
      padding: 16px 24px;
      background: rgba(0, 0, 0, 0.25);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .modal-close-action-btn {
      flex: 1;
      padding: 11px 16px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #e5e7eb;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: white;
      }
    }

    .modal-logout-btn {
      padding: 11px 16px;
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
      }
    }

    .guest-body {
      text-align: center;
      align-items: center;
      padding: 32px 20px;
    }

    .guest-prompt-icon {
      font-size: 44px;
      margin-bottom: 6px;
    }

    .guest-prompt-title {
      font-size: 17px;
      font-weight: 700;
      color: #f3f4f6;
      margin: 0 0 6px;
    }

    .guest-prompt-desc {
      font-size: 13px;
      color: #9ca3af;
      margin: 0 0 20px;
      line-height: 1.5;
    }

    .modal-connect-btn {
      padding: 11px 22px;
      background: linear-gradient(135deg, #0070d1, #00439c);
      color: white;
      border-radius: 12px;
      font-size: 13.5px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 4px 16px rgba(0, 112, 209, 0.35);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 22px rgba(0, 112, 209, 0.5);
      }
    }
  `],
})
export class SidebarComponent {
  gameService = inject(GameService);
  psnService = inject(PsnService);

  showAccountPopup = signal(false);

  openAccountPopup(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.showAccountPopup.set(true);
  }

  closeAccountPopup(): void {
    this.showAccountPopup.set(false);
  }

  disconnectPsn(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (confirm('Disconnect your PlayStation account from GameTracker?')) {
      this.psnService.logout();
      this.closeAccountPopup();
    }
  }

  handleAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
