import Konva from "konva";
import {
    BoardState,
    CardPlayedPayload,
    CardRaw,
    Play,
    PlayerId,
    Seats,
} from "../../shared/types.js";
import { Vector2d } from "konva/lib/types";
import { CardObject } from "./types.js";

import { playCard } from "./socket.js";
import { CardBuilder } from "./card-builder.js";

const IMAGE_SCALE: number = 2;
const PLAYFIELD_SCALE = 4;
const SPACE = 150;
const SPACE_VERTICAL = 50;

const PLAY_POSITIONS: Record<number, Vector2d> = {
    0: { x: 900, y: 525 }, //  SOUTH - curr player
    1: { x: 1100, y: 400 },
    2: { x: 900, y: 200 },
    3: { x: 700, y: 400 },
};

const SEATS: Record<number, { position: Vector2d; rotation: number }> = {
    0: { position: { x: 350, y: 0 }, rotation: 0 },
    1: { position: { x: 1800, y: window.innerHeight / 2 - 300 }, rotation: 90 },
    2: { position: { x: 350, y: 0 }, rotation: 0 },
    3: { position: { x: 200, y: window.innerHeight / 2 - 300 }, rotation: 90 },
};

export class Board {
    stage: Konva.Stage;
    layer: Konva.Layer;
    dragLayer: Konva.Layer;

    builder: CardBuilder;

    playerHandGroup = new Konva.Group();
    otherHandGroups = new Map<PlayerId, Konva.Group>();
    playedCards = new Map<PlayerId, CardObject>();

    seats: Seats;

    private constructor(
        layer: Konva.Layer,
        dragLayer: Konva.Layer,
        stage: Konva.Stage,
        seats: Seats,
        builder: CardBuilder,
    ) {
        this.layer = layer;
        this.dragLayer = dragLayer;
        this.stage = stage;
        this.builder = builder;
        this.seats = seats;

        this.layer.add(this.playerHandGroup);

        this.loadPlayField();

        this.stage.add(this.layer);
        this.stage.add(this.dragLayer);
    }

    static async init(
        layer: Konva.Layer,
        dragLayer: Konva.Layer,
        stage: Konva.Stage,
        seats: Seats = ["","","",""],
    ) {
        const builder = new CardBuilder(IMAGE_SCALE);
        await builder.ready;

        return new Board(layer, dragLayer, stage, seats, builder);
    }

    private loadPlayField() {
        const field = new Konva.Rect({
            x: window.screenX + window.innerWidth / PLAYFIELD_SCALE,
            y: window.screenY + window.innerHeight / PLAYFIELD_SCALE,
            width: window.innerWidth / 2,
            height: window.innerHeight / 2,
            fill: "blue",
        }).setAttr("name", "PlayField");

        this.layer.add(field);
    }

    async load(boardState: BoardState) {
        await this.renderHands(boardState);
    }

    async update(boardState: BoardState) {}

    private async renderHands(boardState: BoardState) {
        for (let seatIndex = 0; seatIndex < this.seats.length; ++seatIndex) {
            const playerId = this.seats[seatIndex];
            const seatInfo = this.getSeat(seatIndex);

            // If at player seat (always first)
            if (seatIndex === 0) {
                await this.renderPlayerHand(
                    playerId,
                    boardState.hand ?? [],
                    seatInfo.position,
                );
            } else {
                const cardCount = boardState.cardCounts[playerId] ?? 8;
                await this.renderOtherHand(
                    playerId,
                    cardCount,
                    seatInfo.position,
                    seatInfo.rotation,
                );
            }
        }
    }

    private async renderPlayerHand(
        playerId: PlayerId,
        hand: Array<CardRaw>,
        initPos: Vector2d,
    ) {
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
                                    const found = this.playerHandGroup.findOne(
                                        `${card.rank}${card.suit}`,
                                    );
                                    if (!found)
                                        throw new Error(
                                            `Card ${obj.id()} not found`,
                                        );

                                    found.moveTo(this.layer);    
                                    this.playedCards.set(playerId, obj);
                                    obj.setPosition(PLAY_POSITIONS[0]);
                                    this.layer.batchDraw();
                                } else {
                                    obj.setPosition(obj.dragStart);
                                }
                            });
                        },
                    },
                },
            );

            const v: Vector2d = {
                x: initPos.x + SPACE * index,
                y: window.innerHeight - cardObject.getHeight(),
            };
            cardObject.setPosition(v);

            this.layer.add(cardObject);
            this.playerHandGroup.add(cardObject);
        }
    }

    private async renderOtherHand(
        playerId: PlayerId,
        numCards: number,
        initPos: Vector2d,
        rotation: number,
    ) {
        for (let i = 0; i < numCards; ++i) {
            const offsetX = rotation === 0 ? SPACE * i : 0;
            const offsetY = rotation === 90 ? SPACE_VERTICAL * i : 0;

            const position = { x: initPos.x + offsetX, y: initPos.y + offsetY };
            const cardObject = await this.builder.buildBackCard(
                position,
                rotation,
            );

            // this.layer.add(cardObject);

            if (!this.otherHandGroups.has(playerId)) {
                this.otherHandGroups.set(playerId, new Konva.Group());
                this.layer.add(this.otherHandGroups.get(playerId)!);
            }
            this.otherHandGroups.get(playerId)?.add(cardObject);
        }
    }

    // async renderPlayedCards(boardState: BoardState) {
    //     for (let i = 0; i < this.seats.length; ++i) {
    //         const playedCard = boardState.playedCards.find(play => play.player === this.seats[i]);
    //         if (playedCard) {
    //             const c = await this.builder.buildFrontCard(playedCard.card, this.getPlayPosition(i))
    //             this.layer.add(c);
    //         }
    //     }
    // }
    // async onCardPlayed(boardState: BoardState) {
    //     for (let i = 0; i < this.seats.length; ++i) {
    //         const play = boardState.playedCards.find(
    //             (play) => play.player === this.seats[i],
    //         );
    //         if (play) {
    //             const cardObject = await this.builder.buildFrontCard(
    //                 play.card,
    //                 this.getPlayPosition(i),
    //             );
    //             this.layer.add(cardObject);
    //             this.playedCards.set(play.player, cardObject);
    //         }
    //     }
    // }

    private async updateOtherHands(boardState: BoardState) {
        const cardCounts = boardState.cardCounts;

        for (const [pid, group] of this.otherHandGroups) {
            const current = group.children.length;
            const expected = cardCounts[pid];
            const diff = current - expected;

            if (diff > 0) {
                // remove
                for (let i = 0; i < diff; ++i) {
                    group.children[group.children.length - 1].destroy();
                }
            } else if (diff < 0) {
                // add
                const seatIndex = this.seats.findIndex((p) => p === pid);
                const { position: initPos, rotation } = this.getSeat(seatIndex);

                for (let i = 0; i < Math.abs(diff); ++i) {
                    const offsetX =
                        rotation === 0 ? SPACE * group.children.length - 1 : 0;
                    const offsetY =
                        rotation === 90
                            ? SPACE_VERTICAL * group.children.length - 1
                            : 0;

                    const position = {
                        x: initPos.x + offsetX,
                        y: initPos.y + offsetY,
                    };
                    const card = await this.builder.buildBackCard(
                        position,
                        rotation,
                    );
                    group.add(card);
                }
            }
        }

        this.layer.batchDraw();
    }

    removeCardBack(payload: CardPlayedPayload) {
        const { playerId } = payload;
        const oppHand = this.otherHandGroups.get(playerId)?.getChildren();
        if (!oppHand) throw new Error("No such player found");
        oppHand[oppHand?.length - 1].destroy();
    }

    async onCardPlayed(payload: CardPlayedPayload) {
        const { playerId, card } = payload;
        const seatIndex = this.seats.findIndex(p => p === playerId);
        const position = this.getPlayPosition(seatIndex);
        const obj = await this.builder.buildFrontCard(card, position);
        this.playedCards.set(playerId, obj);
        this.layer.add(obj);
    }

    // async renderPlayedCards() {
    //     for (const [playerId, obj] of this.playedCards) {
    //         const seatIndex = this.seats.findIndex(p => p === playerId);
    //         const position = PLAY_POSITIONS[seatIndex];

            
    //     }
    // }

    async resetPlayed() {
        this.playedCards.forEach((obj, _) => {
            obj.destroy();
        });
    }

    private getPlayPosition(index: number): Vector2d {
        return PLAY_POSITIONS[index];
    }

    private getSeat(index: number): { position: Vector2d; rotation: number } {
        return SEATS[index];
    }
}
