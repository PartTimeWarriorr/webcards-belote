
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
    suit: Suit,
    rank: Rank
}

export interface PlayerRaw {
    id: string,
    hand: Array<CardRaw>,
    team?: string
}

export interface BoardState {
    players: Array<PlayerRaw>,
    turn: string,
    playedCards: [string, CardRaw][]
}

export interface JoinRoomPayload {
    roomName: string,
    teamPref: string
}