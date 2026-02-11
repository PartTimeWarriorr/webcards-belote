import Konva from 'konva';
import { Card, Suit, Rank} from './card.js';
import { Vector2d } from 'konva/lib/types';

const cardsPath = '/cards';
const cardBack = '/cards/1B.svg';
const IMAGE_SCALE = 2;
const INIT_POS : Vector2d = {x: 0, y: 0};
const SPACE = 10;

export class Board {
    deck: Array<Card> = new Array();
    layer: Konva.Layer;
    stage: Konva.Stage;

    constructor(layer: Konva.Layer, stage: Konva.Stage) {
        // Add all cards to deck
        for (let s of Object.values(Suit)){
            for (let r of Object.values(Rank).filter((v) : v is Rank => typeof v === 'number')) {
                this.deck.push(new Card(s, r));
            } 
        }

        this.layer = layer;
        this.stage = stage;
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
            let cardImage = card.visualize(position, IMAGE_SCALE);

            this.layer.add(cardImage);
        } 
    }

    visualizePlayerHand() {
        let cards: Array<Card> = [
            new Card(Suit.Clubs, Rank.Ace),
            new Card(Suit.Clubs, Rank.Eight),
            new Card(Suit.Clubs, Rank.Queen),
            new Card(Suit.Diamonds, Rank.Seven),
            new Card(Suit.Spades, Rank.Jack),
        ]

        let initPos : Vector2d = {x: 1, y: 1};
        for (let [index, card] of cards.entries()) {
            let position = { x: initPos.x + SPACE * index, y : initPos.y };
            let cardImage = card.visualize(position, IMAGE_SCALE);

            let v : Vector2d = {x: cardImage.getAbsolutePosition().x, y: window.innerHeight - cardImage.getHeight()};  
            cardImage.setPosition(v);

            this.layer.add(cardImage);
        } 
    }

    visualizeBacks() {
        const imageObj = new Image();
        imageObj.src = cardBack;

        this.visualizeAlly(imageObj, IMAGE_SCALE);
        this.visualizeOpps(imageObj, IMAGE_SCALE);

    }

    visualizeOpps(imageObj: HTMLImageElement, scale: number) {

        let initPos = {x : 0, y : window.innerHeight - imageObj.height / scale};

        for (let i = 0; i < 6; ++i) {
            let pos = {x : initPos.x , y : initPos.y + SPACE};

            let img = new Konva.Image({
                x: pos.x,
                y: pos.y,
                image: imageObj,
                width: imageObj.width / scale,
                height: imageObj.height / scale,
                draggable: false
            }).setAttr("metadata", {
                
            }).rotate(90);
            this.layer.add(img);
        }
    }

    visualizeAlly(imageObj: HTMLImageElement, scale: number) {
        let initPos = {x : window.innerWidth / 2, y : 0};

        for (let i = 0; i < 6; ++i) {
            let pos = {x : initPos.x + SPACE, y : initPos.y};

            let img = new Konva.Image({
                x: pos.x,
                y: pos.y,
                image: imageObj,
                width: imageObj.width / scale,
                height: imageObj.height / scale,
                draggable: false
            }).setAttr("metadata", {
                
            });
            this.layer.add(img);
        }
    }
}