export type GameState = BiddingState | PlayingState | ScoringState;
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
}

type PublicRoundState = Omit<RoundState, "hands" | "deck"> & {
    hand: Card[];
};

export type PlayerView = Omit<GameState, "round"> & {
    round: PublicRoundState;
};

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
    Ended = "ENDED",
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

export type Result =
    | { ok: true; state: GameState }
    | { ok: false; reason: string };

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
};
