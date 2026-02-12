import Konva from "konva";
import { Card, Suit, Rank } from "./card.js";
import { Vector2d } from "konva/lib/types";
import { CardImage } from "./types.js";

const cardBack = "/cards/1B.svg";
const IMAGE_SCALE = 2;
const INIT_POSITION: Vector2d = { x: 0, y: 0 };
const SPACE = 150;
const SPACE_VERTICAL = 50;
const PLAYFIELD_SCALE = 4;

export class Board {
    deck: Array<Card> = new Array();
    layer: Konva.Layer;
    dragLayer: Konva.Layer;
    stage: Konva.Stage;

    constructor(
        layer: Konva.Layer,
        dragLayer: Konva.Layer,
        stage: Konva.Stage,
    ) {
        // Add all cards to deck
        for (let s of Object.values(Suit)) {
            for (let r of Object.values(Rank).filter(
                (v): v is Rank => typeof v === "number",
            )) {
                this.deck.push(new Card(s, r));
            }
        }

        this.layer = layer;
        this.dragLayer = dragLayer;
        this.stage = stage;

        this.loadPlayField();

        this.stage.add(this.layer);
        this.stage.add(this.dragLayer);
    }

    loadPlayField() {
        const field = new Konva.Rect({
            x: window.screenX + window.innerWidth / PLAYFIELD_SCALE,
            y: window.screenY + window.innerHeight / PLAYFIELD_SCALE,
            width: window.innerWidth / 2,
            height: window.innerHeight / 2,
            fill: "blue",
        }).setAttr("name", "PlayField");

        this.layer.add(field);
    }

    async getCardBackObject(
        position: Vector2d,
        rotationDegrees: number,
    ): Promise<Konva.Image> {
        return new Promise((resolve) => {
            const image = new Image();
            image.src = cardBack;

            image.onload = () => {
                const konvaObj = new Konva.Image({
                    x: position.x,
                    y: position.y,
                    image: image,
                    width: image.width / IMAGE_SCALE,
                    height: image.height / IMAGE_SCALE,
                    draggable: false,
                    rotation: rotationDegrees,
                });

                resolve(konvaObj);
            };
        });
    }

    async getCardObject(card: Card, position: Vector2d): Promise<CardImage> {
        return new Promise((resolve) => {
            const image = new Image();
            image.src = card.getImageName();

            image.onload = () => {
                const konvaObj = new Konva.Image({
                    x: position.x,
                    y: position.y,
                    image: image,
                    width: image.width / IMAGE_SCALE,
                    height: image.height / IMAGE_SCALE,
                    draggable: true,
                    dragStartX: 0,
                    dragStartY: 0,
                    suit: card.suit,
                    rank: card.rank,
                }) as CardImage;

                konvaObj.on("mouseover", () => {
                    document.body.style.cursor = "pointer";
                });

                konvaObj.on("mouseout", () => {
                    document.body.style.cursor = "default";
                });

                konvaObj.on("dragstart", (e) => {
                    konvaObj.moveTo(this.dragLayer);
                    konvaObj.dragStartX = konvaObj.x();
                    konvaObj.dragStartY = konvaObj.y();
                    console.log(konvaObj.dragStartX, konvaObj.dragStartY);
                });

                konvaObj.on("dragend", (e) => {
                    const position = this.stage.getPointerPosition();

                    // TODO: socket.playCard()

                    if (position == null) {
                        console.log("opaaa");
                        return;
                    }

                    const shape = this.layer.getIntersection(position);

                    let name = "";
                    if (shape != null) {
                        name = shape.getAttr("name") ?? name;
                    }

                    const startPosition: Vector2d = {
                        x: konvaObj.dragStartX,
                        y: konvaObj.dragStartY,
                    };
                    if (name != "PlayField") {
                        konvaObj.setPosition(startPosition);
                    }
                });

                resolve(konvaObj);
            };
        });
    }

    async visualizePlayerHand() {
        let cards: Array<Card> = [
            new Card(Suit.Clubs, Rank.Ace),
            new Card(Suit.Clubs, Rank.Eight),
            new Card(Suit.Clubs, Rank.Queen),
            new Card(Suit.Diamonds, Rank.Seven),
            new Card(Suit.Spades, Rank.Jack),
            new Card(Suit.Clubs, Rank.Jack),
            new Card(Suit.Clubs, Rank.Seven),
            new Card(Suit.Hearts, Rank.Seven),
        ];

        let initPosition: Vector2d = { x: 350, y: 1 };
        for (let [index, card] of cards.entries()) {
            let cardImage: CardImage = await this.getCardObject(
                card,
                initPosition,
            );

            let v: Vector2d = {
                x: initPosition.x + SPACE * index,
                y: window.innerHeight - cardImage.getHeight(),
            };
            cardImage.setPosition(v);

            this.layer.add(cardImage);
        }
    }

    async visualizeAlly(
        numberCards: number,
    ) {
        let initPosition = { x: 350, y: 0 };

        for (let i = 0; i < numberCards; ++i) {
            let position = { x: initPosition.x + SPACE * i, y: initPosition.y };
            let cardImage = await this.getCardBackObject(position, 0);

            this.layer.add(cardImage);
        }
    }

    async visualizeOpps(numberLeft: number, numberRight: number) {
        let initPositionLeft = { x: 200, y: window.innerHeight / 2 - 300};
        let initPositionRight = { x: 0, y: window.innerHeight / 2 - 300};

        for (let i = 0; i < numberLeft; ++i) {
            let position = { x: initPositionLeft.x, y: initPositionLeft.y + SPACE_VERTICAL * i};
            let cardImage = await this.getCardBackObject(position, 90);

            this.layer.add(cardImage);
        }

        for (let i = 0; i < numberRight; ++i) {
            let position = { x: initPositionRight.x, y: initPositionRight.y + SPACE_VERTICAL * i};
            let cardImage = await this.getCardBackObject(position, 90);

            let v : Vector2d = { x: window.innerWidth - cardImage.getWidth(), y: position.y };
            cardImage.setPosition(v);

            this.layer.add(cardImage);
        }


    }
}
