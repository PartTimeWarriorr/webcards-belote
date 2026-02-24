import Konva from "konva";
import { BoardState, CardRaw, Seats } from "../../shared/types.js";
import { Vector2d } from "konva/lib/types";
import { CardObject } from "./types.js";

import { getCardImagePath } from "./utils.js";
import { playCard } from "./socket.js";

const cardBack = "/cards/1B.svg";
const IMAGE_SCALE = 2;
const INIT_POSITION: Vector2d = { x: 0, y: 0 };
const SPACE = 150;
const SPACE_VERTICAL = 50;
const PLAYFIELD_SCALE = 4;

// Playfield
const SOUTH: Vector2d = { x: 900, y: 525 };
const WEST: Vector2d = { x: 700, y: 400 };
const NORTH: Vector2d = { x: 900, y: 200 };
const EAST: Vector2d = { x: 1100, y: 400 };

const SEAT_POSITIONS: { [index: number]: { pos: Vector2d; rotation: number } } =
    {
        0: { pos: { x: 350, y: 0 }, rotation: 0 },
        1: { pos: { x: 200, y: window.innerHeight / 2 - 300 }, rotation: 90 },
        2: { pos: { x: 350, y: 0 }, rotation: 0 },
        3: { pos: { x: 1800, y: window.innerHeight / 2 - 300 }, rotation: 90 },
    };

export class Board {
    layer: Konva.Layer;
    dragLayer: Konva.Layer;
    stage: Konva.Stage;

    hand: Array<CardRaw> = new Array();
    cardCounts: Record<string, number> = {};

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

    async render(boardState: BoardState, seats: Seats) {
        this.clearAllCards();
        this.renderHands(boardState, seats);
    }

    async renderHands(boardState: BoardState, seats: Seats) {
        for (let seatIndex = 0; seatIndex < seats.length; ++seatIndex) {
            const playerId = seats[seatIndex];
            const seatInfo = SEAT_POSITIONS[seatIndex];

            // If at player seat (always first)
            if (seatIndex === 0) {
                await this.renderPlayerHand(boardState.hand, seatInfo.pos);
            } else {
                const cardCount = boardState.cardCounts[playerId] ?? 8;
                await this.renderOtherHand(
                    cardCount,
                    seatInfo.pos,
                    seatInfo.rotation,
                );
            }
        }
    }

    async renderPlayerHand(hand: Array<CardRaw>, initPos: Vector2d) {
        for (const [index, card] of hand.entries()) {
            const cardObject: CardObject = await this.getCardObject(
                card,
                initPos,
            );

            const v: Vector2d = {
                x: initPos.x + SPACE * index,
                y: window.innerHeight - cardObject.getHeight(),
            };
            cardObject.setPosition(v);

            this.layer.add(cardObject);
        }
    }

    async renderOtherHand(
        numCards: number,
        initPos: Vector2d,
        rotation: number,
    ) {
        for (let i = 0; i < numCards; ++i) {
            const offsetX = rotation === 0 ? SPACE * i : 0;
            const offsetY = rotation === 90 ? SPACE_VERTICAL * i : 0;

            const position = { x: initPos.x + offsetX, y: initPos.y + offsetY };
            const cardObject = await this.getCardBackObject(position, rotation);

            this.layer.add(cardObject);
        }
    }
    clearAllCards() {
        const children = [...this.layer.children];
        children.forEach((c) => {
            if (c.className === "Image") {
                c.destroy();
            }
        });
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

    async getCardObject(
        card: CardRaw,
        position: Vector2d,
    ): Promise<CardObject> {
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
                    const position = this.stage.getPointerPosition()!;

                    // TODO: socket.playCard()
                    // const shape = this.layer.getIntersection(position);

                    // let name = "";
                    // if (shape != null) {
                    //     name = shape.getAttr("name") ?? name;
                    // }
                    const name =
                        this.layer.getIntersection(position)?.getAttr("name") ??
                        "";

                    const startPosition: Vector2d = {
                        x: konvaObj.dragStartX,
                        y: konvaObj.dragStartY,
                    };

                    if (name == "PlayField") {
                        playCard(card);
                    } else {
                        konvaObj.setPosition(startPosition);
                    }
                });

                resolve(konvaObj);
            };
        });
    }

    async visualizePlayField(
        boardState: BoardState,
        playerId: string | null,
        allyId: string | null,
    ) {
        // const playerHand : CardRaw[] = boardState.players.find(p => p.id === playerId)?.hand ?? [];
        const playedCards = boardState.playedCards;

        // for (const pid of playedCards.keys()) {
        //     if (pid === allyId) {
        //         let north = await this.getCardObject(playedCards.get(allyId)!, NORTH);
        //         this.layer.add(north);
        //     }
        // }
        // const card = playedCards?.get(allyId!);
        // if (card) {
        //     const north = await this.getCardObject(card, NORTH);
        //     this.layer.add(north);
        // }

        // for (const [pid, card] of playedCards) {
        //     if (pid === allyId) {
        //         let north = await this.getCardObject(card, NORTH);
        //         this.layer.add(north);
        //     }
        // }

        // Object.entries(playedCards).forEach(([pid, card]) => {
        //     if (pid === allyId) {
        //         let north = await this.getCardObject(card, NORTH);
        //         this.layer.add(north);
        //     }
        // })
    }
}
