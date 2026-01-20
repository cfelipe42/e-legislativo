
export enum VoteValue {
  YES = 'YES',
  NO = 'NO',
  ABSTAIN = 'ABSTAIN',
  PENDING = 'PENDING'
}

export interface ChamberConfig {
  city: string;
  allowedIP: string;
  isActive: boolean;
  lastSessionDate?: string;
  activeBillId?: string | null;
  activeSpeakerId?: string | null;
}

export interface Councilman {
  id: string;
  name: string;
  party: string;
  city: string;
  isPresent: boolean;
  currentVote: VoteValue;
  avatar: string;
  isRequestingFloor?: boolean;
  isRequestingIntervention?: boolean;
  isSpeaking?: boolean;
}

export interface UserAccount {
  id: string;
  cpf: string;
  password: string;
  role: 'clerk' | 'councilman' | 'president' | 'moderator';
  city: string;
  allowedIP?: string;
  name: string;
}

export interface IndividualVote {
  councilmanId: string;
  councilmanName: string;
  party: string;
  vote: VoteValue;
}

export interface Bill {
  id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  status: 'PENDING' | 'VOTING' | 'APPROVED' | 'REJECTED';
  fullText: string;
}

export interface SessionHistory {
  id: string;
  billId: string;
  date: string;
  result: {
    yes: number;
    no: number;
    abstain: number;
    outcome: 'APPROVED' | 'REJECTED';
  };
  individualVotes: IndividualVote[];
}
