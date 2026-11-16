export interface PsnProfile {
  onlineId: string;
  accountId: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  personalDetail?: { firstName?: string; lastName?: string } | null;
  dob?: string | null;
  age?: number | null;
  country?: string | null;
  countryCode?: string | null;
  locale?: string | null;
  aboutMe: string;
  avatarUrl: string | null;
  trophySummary: PsnTrophySummary | null;
  isPlus: boolean;
  languages: string[];
}

export interface PsnTrophySummary {
  level: number;
  progress: number;
  earnedTrophies: PsnTrophyCounts;
}

export interface PsnTrophyCounts {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}

export interface PsnGame {
  npCommunicationId: string;
  npServiceName: string;
  title: string;
  detail: string;
  iconUrl: string;
  platform: string;
  definedTrophies: PsnTrophyCounts;
  earnedTrophies: PsnTrophyCounts;
  progress: number;
  hoursPlayed?: number;
  lastUpdatedDateTime: string;
}

export interface PsnTrophy {
  trophyId: number;
  trophyHidden: boolean;
  trophyType: 'bronze' | 'silver' | 'gold' | 'platinum';
  trophyName: string;
  trophyDetail: string;
  trophyIconUrl: string;
  trophyGroupId: string;
  earned: boolean;
  earnedDateTime: string | null;
  progress: string | null;
  progressRate: number | null;
}

export interface PsnGamesResponse {
  totalItemCount: number;
  games: PsnGame[];
}

export interface PsnTrophiesResponse {
  totalItemCount: number;
  trophies: PsnTrophy[];
}
