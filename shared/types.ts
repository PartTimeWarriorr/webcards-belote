
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