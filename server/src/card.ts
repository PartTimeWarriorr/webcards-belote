import { Suit, Rank } from "../../shared/types";

// zasega samo vsichko koz
const power: Map<Rank, number> = new Map([
    [Rank.Jack, 20],
    [Rank.Nine, 14],
    [Rank.Ace, 11],
    [Rank.Ten, 10],
    [Rank.King, 4],
    [Rank.Queen, 3],
    [Rank.Eight, 2],
    [Rank.Seven, 1],
]);

export class Card {
    suit: Suit;
    rank: Rank;

    constructor(suit: Suit, rank: Rank) {
        this.suit = suit;
        this.rank = rank;
    }

    // doubles as score rn
    getCardPower(): number {
        return power.get(this.rank)!;
    }
}
