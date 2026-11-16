import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  PsnProfile,
  PsnGame,
  PsnGamesResponse,
  PsnTrophiesResponse,
  PsnTrophy,
} from '../models/psn.model';

@Injectable({ providedIn: 'root' })
export class PsnService {
  private readonly API_BASE = 'http://localhost:3001/api/psn';

  readonly isAuthenticated = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly profile = signal<PsnProfile | null>(null);
  readonly games = signal<PsnGame[]>([]);
  readonly totalGames = signal(0);

  readonly trophyStats = computed(() => {
    const p = this.profile();
    if (!p?.trophySummary) {
      return { bronze: 0, silver: 0, gold: 0, platinum: 0, total: 0, level: 0, progress: 0 };
    }
    const t = p.trophySummary.earnedTrophies;
    return {
      ...t,
      total: t.bronze + t.silver + t.gold + t.platinum,
      level: p.trophySummary.level,
      progress: p.trophySummary.progress,
    };
  });

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  async checkAuthStatus(): Promise<void> {
    try {
      const resp = await firstValueFrom(
        this.http.get<{ authenticated: boolean }>(`${this.API_BASE}/auth/status`)
      );
      this.isAuthenticated.set(resp.authenticated);
      if (resp.authenticated) {
        await this.loadProfile();
        await this.loadGames();
      }
    } catch {
      this.isAuthenticated.set(false);
    }
  }

  async authenticate(npsso: string): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const resp = await firstValueFrom(
        this.http.post<{ success: boolean; profile: any }>(`${this.API_BASE}/auth`, { npsso })
      );
      this.isAuthenticated.set(true);
      await this.loadProfile();
      await this.loadGames();
      this.isLoading.set(false);
      return true;
    } catch (err: any) {
      const msg = err?.error?.details
        ? `${err.error.error} (${err.error.details})`
        : err?.error?.error || err?.message || 'Authentication failed';
      this.error.set(msg);
      this.isAuthenticated.set(false);
      this.isLoading.set(false);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.API_BASE}/auth/logout`, {}));
    } catch {}
    this.isAuthenticated.set(false);
    this.profile.set(null);
    this.games.set([]);
    this.totalGames.set(0);
  }

  async loadProfile(): Promise<void> {
    try {
      const profile = await firstValueFrom(
        this.http.get<PsnProfile>(`${this.API_BASE}/profile`)
      );
      this.profile.set(profile);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
    }
  }

  async loadGames(offset = 0, limit = 100): Promise<void> {
    this.isLoading.set(true);
    try {
      const resp = await firstValueFrom(
        this.http.get<PsnGamesResponse>(`${this.API_BASE}/games`, {
          params: { offset: offset.toString(), limit: limit.toString() },
        })
      );
      if (offset === 0) {
        this.games.set(resp.games);
      } else {
        this.games.update((existing) => [...existing, ...resp.games]);
      }
      this.totalGames.set(resp.totalItemCount);
    } catch (err: any) {
      console.error('Failed to load games:', err);
      this.error.set('Failed to load games');
    }
    this.isLoading.set(false);
  }

  async loadMoreGames(): Promise<void> {
    const currentCount = this.games().length;
    if (currentCount < this.totalGames()) {
      await this.loadGames(currentCount, 100);
    }
  }

  async getTrophies(npCommunicationId: string, npServiceName = 'trophy'): Promise<PsnTrophy[]> {
    try {
      const resp = await firstValueFrom(
        this.http.get<PsnTrophiesResponse>(
          `${this.API_BASE}/games/${npCommunicationId}/trophies`,
          { params: { npServiceName } }
        )
      );
      return resp.trophies;
    } catch (err: any) {
      console.error('Failed to load trophies:', err);
      return [];
    }
  }
}
