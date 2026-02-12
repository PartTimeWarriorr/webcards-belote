import Konva from "konva";
import { CardImage } from "./types";
import { Vector2d } from "konva/lib/types";

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

// zasega samo vsichko koz
const power : Map<Rank, number> = new Map([
    [Rank.Jack, 20],
    [Rank.Nine, 14],
    [Rank.Ace, 11],
    [Rank.Ten, 10],
    [Rank.King, 4],
    [Rank.Queen, 3],
    [Rank.Eight, 2],
    [Rank.Seven, 1]
]);

export class Card {
    suit: Suit;
    rank: Rank;

    constructor(suit: Suit, rank: Rank) {
        this.suit = suit;
        this.rank = rank;
    }

    getImageName(): string {
        return "/cards/" + this.rank + this.suit + ".svg";
    }

    // doubles as score rn
    getCardPower(): number {
        return power.get(this.rank)!; 
    }
}
