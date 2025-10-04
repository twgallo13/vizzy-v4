export interface Program {
  programId: string;
  name: string;
  seasonTag?: string;
  status: 'active' | 'archived';
}

export interface Activity {
  activityId: string;
  channel: 'Email' | 'Social' | 'Banner' | 'Push';
  contentPacket: {
    subjectLine?: string;
    hashtags?: string[];
    bannerUrl?: string;
  };
  ownerUid: string; // MUST exist in users
  status: 'draft' | 'approved' | 'exported';
}

export interface DayCard {
  date: any; // Firestore Timestamp (local day)
  activities: Activity[]; // UI-local; canonical activities stored as subcollection docs
}

export interface Week {
  weekId: string; // "2025-w42"
  programId: string;
  weekNumber: number; // keep for UI convenience
  year: number;
  dayCards: Record<string, DayCard>; // UI cache; canonical day docs live under day_cards
}