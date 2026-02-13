import Konva from "konva";
import { CardRaw } from "../../shared/types.js";
import { Vector2d } from "konva/lib/types";
import { CardObject } from "./types.js";

import { getCardImagePath } from "./socket.js";

const cardBack = "/cards/1B.svg";
const IMAGE_SCALE = 2;
const INIT_POSITION: Vector2d = { x: 0, y: 0 };
const SPACE = 150;
const SPACE_VERTICAL = 50;
const PLAYFIELD_SCALE = 4;

export class Board {
    layer: Konva.Layer;
    dragLayer: Konva.Layer;
    stage: Konva.Stage;

    hand: Array<CardRaw> = new Array();

    constructor(
        layer: Konva.Layer,
        dragLayer: Konva.Layer,
        stage: Konva.Stage,
    ) {

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

    async getCardObject(card: CardRaw, position: Vector2d): Promise<CardObject> {
        return new Promise((resolve) => {
            const image = new Image();
            image.src = getCardImagePath(card.suit, card.rank);

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
                }) as CardObject;

                konvaObj.on("mouseover", () => {
                    document.body.style.cursor = "pointer";
                });

                konvaObj.on("mouseout", () => {
                    document.body.style.cursor = "default";
                });

                konvaObj.on("dragstart", () => {
                    konvaObj.moveTo(this.dragLayer);
                    konvaObj.dragStartX = konvaObj.x();
                    konvaObj.dragStartY = konvaObj.y();
                    console.log(konvaObj.dragStartX, konvaObj.dragStartY);
                });

                konvaObj.on("dragend", () => {
                    const position = this.stage.getPointerPosition();

                    // TODO: socket.playCard()

                    if (position == null) {
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
        let cards = this.hand;

        let initPosition: Vector2d = { x: 350, y: 1 };
        for (let [index, card] of cards.entries()) {
            let cardObject: CardObject = await this.getCardObject(
                card,
                initPosition,
            );

            let v: Vector2d = {
                x: initPosition.x + SPACE * index,
                y: window.innerHeight - cardObject.getHeight(),
            };
            cardObject.setPosition(v);

            this.layer.add(cardObject);
        }
    }

    async visualizeAlly(numberCards: number) {
        let initPosition = { x: 350, y: 0 };

        for (let i = 0; i < numberCards; ++i) {
            let position = { x: initPosition.x + SPACE * i, y: initPosition.y };
            let cardObject = await this.getCardBackObject(position, 0);

            this.layer.add(cardObject);
        }
    }

    async visualizeOpps(numberLeft: number, numberRight: number) {
        let initPositionLeft = { x: 200, y: window.innerHeight / 2 - 300 };
        let initPositionRight = { x: 0, y: window.innerHeight / 2 - 300 };

        for (let i = 0; i < numberLeft; ++i) {
            let position = {
                x: initPositionLeft.x,
                y: initPositionLeft.y + SPACE_VERTICAL * i,
            };
            let cardObject = await this.getCardBackObject(position, 90);

            this.layer.add(cardObject);
        }

        for (let i = 0; i < numberRight; ++i) {
            let position = {
                x: initPositionRight.x,
                y: initPositionRight.y + SPACE_VERTICAL * i,
            };
            let cardObject = await this.getCardBackObject(position, 90);

            let v: Vector2d = {
                x: window.innerWidth - cardObject.getWidth(),
                y: position.y,
            };
            cardObject.setPosition(v);

            this.layer.add(cardObject);
        }
    }
}