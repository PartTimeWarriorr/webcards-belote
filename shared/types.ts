export type GameState = BiddingState | PlayingState | ScoringState | FinishedState;
export type BaseGameState = {
    round: RoundState;
    totalScores: Scores;
    hangingScore: number;
};

export interface BiddingState extends BaseGameState {
    phase: GamePhase.Bidding;
    highestBid: [PlayerId, Bid] | null;
    currentBidder: PlayerId;
    passed: Set<PlayerId>;
}

export interface PlayingState extends BaseGameState {
    phase: GamePhase.Playing;
    currentPlayer: PlayerId;
    trickStatus: TrickStatus;
    plays: Play[];
}

export interface ScoringState extends BaseGameState {
    phase: GamePhase.Scoring;
    condition: string;
}

export interface FinishedState extends BaseGameState {
    phase: GamePhase.Finished;
    winningTeam: TeamId;
    condition: string;
}

export interface RoundState {
    dealer: PlayerId;
    highestBidder: PlayerId | null;
    deck: Card[];
    hands: Record<PlayerId, Card[]>;
    mode?: GameMode;
    trump?: Suit;
    modifier?: Modifier;
    roundScores: Scores;
    announcementScores: Scores;
    announcements: Record<PlayerId, Announcement[]>;
}

type PublicRoundState = Omit<RoundState, "hands" | "deck"> & {
    hand: Card[];
    numCards: Record<string, number>;
};

export type PlayerView =
    | (Omit<BiddingState, "round"> & { round: PublicRoundState })
    | (Omit<PlayingState, "round"> & { round: PublicRoundState })
    | (Omit<ScoringState, "round"> & { round: PublicRoundState })
    | (Omit<FinishedState, "round"> & { round: PublicRoundState });

export type PlayerProfile = {
    userId: PlayerId,
    username: string,
    connected: boolean,
    ready: boolean,
    isBot: boolean,
}

export type PlayerId = string;
export type PlayerSlot = PlayerId | null;
export type Team = [PlayerSlot, PlayerSlot];
export type FullTeam = [PlayerId, PlayerId];
export type TeamId = "team1" | "team2";
export type Play = { player: PlayerId; card: Card };
export type Card = { rank: Rank; suit: Suit };
export type Bid =
    | { mode: GameMode.TRUMP; trump: Suit; modifier?: Modifier }
    | { mode: GameMode.NO_TRUMP; modifier?: Modifier }
    | { mode: GameMode.ALL_TRUMP; modifier?: Modifier };

export type User = {
    username: string,
    email: string,
    displayName: string,
    isBot: boolean,
}

export type Seats = [PlayerId, PlayerId, PlayerId, PlayerId];

export type Scores = Record<TeamId, number>;

export enum Suit {
    Hearts = "H",
    Clubs = "C",
    Diamonds = "D",
    Spades = "S",
}

export const SUIT_ORDER: Suit[] = [
    Suit.Clubs,
    Suit.Diamonds,
    Suit.Hearts,
    Suit.Spades,
];

export enum Rank {
    Ace = "A",
    Seven = "7",
    Eight = "8",
    Nine = "9",
    Ten = "T",
    Jack = "J",
    Queen = "Q",
    King = "K",
}

export enum GameMode {
    TRUMP,
    NO_TRUMP,
    ALL_TRUMP,
}

export enum GamePhase {
    Bidding = "BIDDING",
    Playing = "PLAYING",
    Scoring = "SCORING",
    Finished = "FINISHED",
}

export enum Modifier {
    x2 = 2,
    x4 = 4,
}

export interface GameConfig {
    players: [PlayerId, PlayerId, PlayerId, PlayerId];
    teams: {
        team1: Team;
        team2: Team;
    };
}

export interface GameInitPayload {
    orderedPlayers: [PlayerId, PlayerId, PlayerId, PlayerId];
    playerProfiles: Record<string, PlayerProfile>;
    teams: {
        team1: Team;
        team2: Team;
    }
}

export type Result<T> = { ok: true; state: T } | { ok: false; reason: string };

export enum TrickStatus {
    Playing = "PLAYING",
    Resolving = "RESOLVING",
}

export type Move =
    | { type: "BID"; player: PlayerId; bid: Bid }
    | { type: "PASS"; player: PlayerId }
    | { type: "PLAY"; player: PlayerId; card: Card }
    | { type: "RESOLVE_TRICK" }
    | { type: "START_NEW_ROUND" };

// Payloads
export type RoomJoinedPayload = {
    player: PlayerId;
    room: string;
    isGameActive: boolean;
};

// Announcements

export enum AnnouncementType {
    Square = "SQUARE",
    Tierce = "TIERCE",
    Quarte = "QUARTE",
    Quinte = "QUINTE",
    Belot = "BELOT",
}

export const ANNOUNCEMENT_LENGTH: Record<AnnouncementType, number> = {
    SQUARE: 4,
    TIERCE: 3,
    QUARTE: 4,
    QUINTE: 5,
    BELOT: 2,
};

export type Announcement =
    | {
          type:
              | AnnouncementType.Tierce
              | AnnouncementType.Quarte
              | AnnouncementType.Quinte
              | AnnouncementType.Belot;
          suit: Suit;
          highestCard: Rank;
      }
    | {
          type: AnnouncementType.Square;
          rank: SquareRank
      };

export type SquareRank =
    | Rank.Ace
    | Rank.King
    | Rank.Queen
    | Rank.Jack
    | Rank.Ten
    | Rank.Nine;
