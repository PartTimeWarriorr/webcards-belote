import Konva from 'konva';

export enum Suit {
    Hearts = 'H',
    Clubs = 'C',
    Diamonds = 'D',
    Spades = 'S'
}

export enum Rank {
    Ace = 'A',
    Seven = '7',
    Eight = '8',
    Nine = '9',
    Ten = 'T',
    Jack = 'J',
    Queen = 'Q',
    King = 'K'
}

export class Card {
    suit: Suit;
    rank: Rank;
    
    constructor(suit: Suit, rank: Rank) {
        this.suit = suit;
        this.rank = rank;
    }

    getImageName(): string {
        return '/cards/' + this.rank + this.suit + '.svg';
    }
}