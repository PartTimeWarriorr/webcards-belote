export enum Suit {
    Hearts = "H",
    Clubs = "C",
    Diamonds = "D",
    Spades = "S",
}

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

export interface CardRaw {
    suit: Suit;
    rank: Rank;
}

export interface PlayerRaw {
    id: PlayerId;
    hand: Array<CardRaw>;
    team?: string;
}

export interface BoardState {
    hand?: Array<CardRaw>;
    cardCounts: Record<PlayerId, number>;
    turn: PlayerId;
    playedCards: Array<Play>;
}

export interface JoinRoomPayload {
    roomName: string;
    teamPref: string;
}

export interface CardPlayedPayload {
    playerId: PlayerId;
    card: CardRaw;
}

export interface GameConfig {
    playerId: PlayerId;
    seats: Seats;
    teams: Record<PlayerId, string>;
}

export type Seats = [PlayerId, PlayerId, PlayerId, PlayerId];

export type PlayerId = string;

export enum GameMode {
    ALL_TRUMP,
    NO_TRUMP,
    TRUMP,
}

export type Play = { player: PlayerId; card: CardRaw };
