import Konva from 'konva';
import { Vector2d } from 'konva/lib/types';

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

    visualize(pos: Vector2d, scale: number): Konva.Image {

        const imageObj = new Image();
        imageObj.src = this.getImageName();

        return new Konva.Image({
            x: pos.x,
            y: pos.y,
            image: imageObj,
            width: imageObj.width / scale,
            height: imageObj.height / scale,
            draggable: true
        }).setAttr("metadata", {
            "suit" : this.suit,
            "rank" : this.rank
        });
    }
}