import Konva from "konva";
import { BoardState, CardRaw, PlayerId, Seats } from "../../shared/types.js";
import { Vector2d } from "konva/lib/types";
import { CardObject } from "./types.js";

import { playCard } from "./socket.js";
import { CardBuilder } from "./card-builder.js";

const IMAGE_SCALE = 2;
const INIT_POSITION: Vector2d = { x: 0, y: 0 };
const SPACE = 150;
const SPACE_VERTICAL = 50;
const PLAYFIELD_SCALE = 4;

// Playfield
const SOUTH: Vector2d = { x: 900, y: 525 };
const EAST: Vector2d = { x: 1100, y: 400 };
const NORTH: Vector2d = { x: 900, y: 200 };
const WEST: Vector2d = { x: 700, y: 400 };

function getPlayPosition(index: number) : Vector2d {
    if (index === 0) {
        return SOUTH;
    } else if (index === 1) {
        return EAST;
    } else if (index === 2) {
        return NORTH;
    } else if (index === 3) {
        return WEST;
    } else {
        throw new Error("Invalid index");
    }
}

// TODO
const SEAT_POSITIONS: { [index: number]: { pos: Vector2d; rotation: number } } =
    {
        0: { pos: { x: 350, y: 0 }, rotation: 0 },
        1: { pos: { x: 200, y: window.innerHeight / 2 - 300 }, rotation: 90 },
        2: { pos: { x: 350, y: 0 }, rotation: 0 },
        3: { pos: { x: 1800, y: window.innerHeight / 2 - 300 }, rotation: 90 },
    };

// TODO: inefficient
export class Board {
    layer: Konva.Layer;
    dragLayer: Konva.Layer;
    stage: Konva.Stage;

    builder = new CardBuilder(IMAGE_SCALE);

    hand: Array<CardRaw> = new Array();
    cardCounts: Record<PlayerId, number> = {};
    playedCards: Record<PlayerId, CardRaw> = {};

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
        if (boardState.hand) {
            this.hand = boardState.hand;
        }
        this.clearAllCards();
        this.renderHands(boardState, seats);
        this.renderPlayedCards(boardState, seats);
    }

    async renderHands(boardState: BoardState, seats: Seats) {
        for (let seatIndex = 0; seatIndex < seats.length; ++seatIndex) {
            const playerId = seats[seatIndex];
            const seatInfo = SEAT_POSITIONS[seatIndex];

            // If at player seat (always first)
            if (seatIndex === 0) {
                await this.renderPlayerHand(this.hand, seatInfo.pos);
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
            const cardObject: CardObject = await this.builder.buildFrontCard(
                card,
                initPos,
                {
                    draggable: true,
                    dragOptions: {
                        stage: this.stage,
                        dragLayer: this.dragLayer,
                        isValidDrop: (pos) => {
                            const shape = this.layer.getIntersection(pos);
                            return shape?.getAttr("name") === "PlayField";
                        },
                        onValidDrop: (card, obj) => {
                            playCard(card, (success: boolean) => {
                                if (success) {
                                    // obj.draggable(false);
                                    // obj.setPosition(SOUTH);
                                    obj.destroy();
                                } else {
                                    obj.setPosition(obj.dragStart);
                                }
                            });
                        }
                    }
                }
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
            const cardObject = await this.builder.buildBackCard(position, rotation);

            this.layer.add(cardObject);
        }
    }

    async renderPlayedCards(boardState: BoardState, seats: Seats) {
        for (let i = 0; i < seats.length; ++i) {
            const playedCard = boardState.playedCards.find(play => play.player === seats[i]);
            if (playedCard) {
                const c = await this.builder.buildFrontCard(playedCard.card, getPlayPosition(i))
                this.layer.add(c);
            }
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
}