import Konva from "konva";
import { Card, GamePhase, Move, Play, PlayerId, PlayerView, Seats } from "@shared/types.js";
import { Vector2d } from "konva/lib/types";
import { CardObject } from "./types.js";

import { CardBuilder } from "./card-builder.js";
import { emitGameMove } from "../../../../src/socket.js";

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

const getCardId = (card: Card) => `${card.rank}${card.suit}`;

export class Board {
    stage: Konva.Stage;
    layer: Konva.Layer;
    dragLayer: Konva.Layer;

    builder: CardBuilder;

    playerHandGroup = new Konva.Group();
    otherHandGroups = new Map<PlayerId, Konva.Group>();
    playedCards = new Map<PlayerId, CardObject>();

    playFieldBounds = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };

    async render(seats: Seats, gameView: PlayerView) {
        switch (gameView.phase) {
            case GamePhase.Bidding: {
                await this.clearHands();
                await this.clearPlayed();
                await this.renderHands(seats, gameView);
                break;
            }
            case GamePhase.Playing: {
                await this.clearHands();
                await this.clearPlayed();
                await this.renderTrick(seats, gameView);
                await this.renderHands(seats, gameView);
                break;
            }
            case GamePhase.Scoring: {
                await this.clearHands();
                await this.clearPlayed();
                break;
            }
        }
    }

    private constructor(
        layer: Konva.Layer,
        dragLayer: Konva.Layer,
        stage: Konva.Stage,
        builder: CardBuilder,
    ) {
        this.layer = layer;
        this.dragLayer = dragLayer;
        this.stage = stage;
        this.builder = builder;

        this.layer.add(this.playerHandGroup);

        this.loadPlayField();

        this.stage.add(this.layer);
        this.stage.add(this.dragLayer);
    }

    static async init(layer: Konva.Layer, dragLayer: Konva.Layer, stage: Konva.Stage) {
        const builder = new CardBuilder(IMAGE_SCALE);
        await builder.ready;

        return new Board(layer, dragLayer, stage, builder);
    }

    private loadPlayField() {
        const field = new Konva.Rect({
            x: window.screenX + window.innerWidth / PLAYFIELD_SCALE,
            y: window.screenY + window.innerHeight / PLAYFIELD_SCALE,
            width: window.innerWidth / 2,
            height: window.innerHeight / 2,
            fill: "#48c357",
        }).setAttr("name", "PlayField");

        this.layer.add(field);
        field.moveToBottom();
        this.playFieldBounds = {
            x: field.x(),
            y: field.y(),
            width: field.width(),
            height: field.height(),
        };
    }

    private async renderHands(seats: Seats, gameView: PlayerView) {
        for (let seatIndex = 0; seatIndex < seats.length; ++seatIndex) {
            const playerId = seats[seatIndex];
            const seatInfo = this.getSeat(seatIndex);

            // If at player seat (always first)
            if (seatIndex === 0) {
                await this.renderPlayerHand(playerId, gameView.round.hand ?? [], seatInfo.position);
            } else {
                const cardCount = gameView.round.numCards[playerId] ?? 8;
                await this.renderOtherHand(
                    playerId,
                    cardCount,
                    seatInfo.position,
                    seatInfo.rotation,
                );
            }
        }
    }

    private async renderPlayerHand(playerId: PlayerId, hand: Array<Card>, initPos: Vector2d) {
        for (const [index, card] of hand.entries()) {
            const cardObject: CardObject = await this.builder.buildFrontCard(card, initPos, {
                draggable: true,
                dragOptions: {
                    stage: this.stage,
                    dragLayer: this.dragLayer,
                    isValidDrop: (pos) => {
                        const bounds = this.playFieldBounds;
                        return (
                            pos.x >= bounds.x &&
                            pos.x <= bounds.x + bounds.width &&
                            pos.y >= bounds.y &&
                            pos.y <= bounds.y + bounds.height
                        );
                    },
                    onValidDrop: (card, obj) => {
                        const move: Move = {
                            type: "PLAY",
                            player: playerId,
                            card: card,
                        };
                        emitGameMove(move);
                        obj.setPosition(obj.dragStart);
                    },
                },
            });

            const v: Vector2d = {
                x: initPos.x + SPACE * index,
                y: window.innerHeight - cardObject.getHeight(),
            };
            cardObject.setPosition(v);

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
            const cardObject = await this.builder.buildBackCard(position, rotation);

            if (!this.otherHandGroups.has(playerId)) {
                this.otherHandGroups.set(playerId, new Konva.Group());
                this.layer.add(this.otherHandGroups.get(playerId)!);
            }
            this.otherHandGroups.get(playerId)?.add(cardObject);
        }
    }

    async renderTrick(seats: Seats, gameView: PlayerView) {
        if (gameView.phase !== GamePhase.Playing) return;
        for (let i = 0; i < seats.length; ++i) {
            const playedCard = gameView.plays.find((play) => play.player === seats[i]);
            if (playedCard) {
                const c = await this.builder.buildFrontCard(
                    playedCard.card,
                    this.getPlayPosition(i),
                );
                this.playedCards.set(playedCard.player, c);
                this.layer.add(c);
            }
        }
    }

    private async clearPlayed() {
        this.playedCards.forEach((obj, _) => {
            obj.destroy();
        });
    }

    private async clearHands() {
        this.playerHandGroup.destroyChildren();
        for (const [_, group] of this.otherHandGroups) {
            group.destroyChildren();
        }
    }

    private getPlayPosition(index: number): Vector2d {
        return PLAY_POSITIONS[index];
    }

    private getSeat(index: number): { position: Vector2d; rotation: number } {
        return SEATS[index];
    }
}
