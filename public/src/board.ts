import Konva from 'konva';
import { Card, Suit, Rank} from './card.js';
import { Vector2d } from 'konva/lib/types';

const cardsPath = '/cards';
const IMAGE_SCALE = 2;
const INIT_POS : Vector2d = {x: 0, y: 0};
const SPACE = 10;

export class Board {
    deck: Array<Card> = new Array();
    layer: Konva.Layer;

    constructor(layer: Konva.Layer) {
        // Add all cards to deck
        for (let s of Object.values(Suit)){
            for (let r of Object.values(Rank).filter((v) : v is Rank => typeof v === 'number')) {
                this.deck.push(new Card(s, r));
            } 
        }

        this.layer = layer;
    }

    visualizeHand() {
        let cards: Array<Card> = [
            new Card(Suit.Clubs, Rank.Ace),
            new Card(Suit.Clubs, Rank.Eight),
            new Card(Suit.Clubs, Rank.Queen),
            new Card(Suit.Diamonds, Rank.Seven),
            new Card(Suit.Spades, Rank.Jack),
        ]

        for (let [index, card] of cards.entries()) {
            let position = { x: INIT_POS.x + SPACE * index, y : INIT_POS.y };
            let c = this.visualizeCard(card, position);

            this.layer.add(c);
        } 
    }

    visualizeCard(card: Card, pos: Vector2d): Konva.Image {

        const imageObj = new Image();
        imageObj.src = card.getImageName();

        return new Konva.Image({
            x: pos.x,
            y: pos.y,
            image: imageObj,
            width: imageObj.width / IMAGE_SCALE,
            height: imageObj.height / IMAGE_SCALE,
            draggable: true
        }).setAttr("metadata", {
            "suit" : card.suit,
            "rank" : card.rank
        });
    }
}