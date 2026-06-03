import {
    GamePhase,
    GameState,
    GameConfig,
    Move,
    Result,
    TrickStatus,
    PlayingState,
    BiddingState,
} from "@shared/types";
import * as handlers from "./game-handlers";
import { canPlay } from "./play-rules";
import { createReplay } from "src/db";
import { Replay } from "prisma/generated/client";

export class Game {
    private state: GameState;
    private config: GameConfig;

    private initialState: GameState;
    private history: Array<Move> = [];

    constructor(config: GameConfig) {
        this.config = config;
        // const result = handlers.handleStartNewRound(this.config);
        const result = this.applyMove({ type: "START_NEW_ROUND" });
        if (!result.ok) throw new Error(result.reason);
        this.state = result.state;
        this.initialState = this.state;
    }

    getState() {
        return this.state;
    }

    applyMove(move: Move): Result<GameState> {
        let result: Result<GameState>;
        switch (move.type) {
            case "BID": {
                if (this.state.phase !== GamePhase.Bidding) {
                    return {
                        ok: false,
                        reason: `Game not in ${GamePhase.Bidding} phase, instead: ${this.state.phase}`,
                    };
                }
                result = handlers.handleBid(
                    this.config,
                    this.state,
                    move.player,
                    move.bid,
                );
                break;
            }
            case "PASS": {
                if (this.state.phase !== GamePhase.Bidding) {
                    return {
                        ok: false,
                        reason: `Game not in ${GamePhase.Bidding} phase, instead: ${this.state.phase}`,
                    };
                }
                result = handlers.handlePass(
                    this.config,
                    this.state,
                    move.player,
                );
                break;
            }
            case "PLAY": {
                if (this.state.phase !== GamePhase.Playing) {
                    return {
                        ok: false,
                        reason: `Game not in ${GamePhase.Playing} phase, instead: ${this.state.phase}`,
                    };
                }
                result = handlers.handlePlay(
                    this.config,
                    this.state,
                    move.player,
                    move.card,
                );
                break;
            }
            case "RESOLVE_TRICK": {
                if (this.state.phase !== GamePhase.Playing) {
                    return {
                        ok: false,
                        reason: `Game not in ${GamePhase.Playing} phase, instead: ${this.state.phase}`,
                    };
                }
                result = handlers.handleResolveTrick(this.config, this.state);
                break;
            }
            case "START_NEW_ROUND": {
                if (!this.state) {
                    result = handlers.handleStartNewRound(this.config);
                    break;
                }
                if (this.state.phase !== GamePhase.Scoring) {
                    return {
                        ok: false,
                        reason: `Game not in ${GamePhase.Scoring} phase, instead: ${this.state.phase}`,
                    };
                }
                result = handlers.handleStartNewRound(this.config, this.state);
                break;
            }
        }
        if (result.ok) {
            this.history.push(move);
            this.state = result.state;
        }

        while (this.isBotTurn()) {
            const m: Move | undefined = this.botMove();
            if (m) {
                switch (m.type) {
                    case "PASS": {
                        result = handlers.handlePass(
                            this.config,
                            this.state as BiddingState,
                            m.player,
                        );
                        if (result.ok) {
                            this.history.push(move);
                            this.state = result.state;
                        }
                        break;
                    }
                    case "PLAY": {
                        result = handlers.handlePlay(
                            this.config,
                            this.state as PlayingState,
                            m.player,
                            m.card,
                        );
                        if (result.ok) {
                            this.history.push(move);
                            this.state = result.state;
                        }
                        break;
                    }
                }
            }
        }

        return result;
    }

    isBotTurn() {
        switch (this.state.phase) {
            case GamePhase.Bidding: {
                return this.isBot(this.state.currentBidder);
            }
            case GamePhase.Playing: {
                return (
                    this.isBot(this.state.currentPlayer) &&
                    this.state.trickStatus === TrickStatus.Playing
                );
            }
        }

        return false;
    }

    isBot(name: string) {
        return name.startsWith("bot");
    }

    botMove(): Move | undefined {
        switch (this.state.phase) {
            case GamePhase.Bidding: {
                return { type: "PASS", player: this.state.currentBidder };
            }
            case GamePhase.Playing: {
                const botId = this.state.currentPlayer;
                const botHand = this.state.round.hands[botId];
                const card = botHand.find(
                    (c) =>
                        canPlay(
                            this.state as PlayingState,
                            botId,
                            c,
                            this.config,
                        ).ok,
                )!;
                return { type: "PLAY", player: botId, card: card };
            }
        }
    }

    async saveReplay(userId: string): Promise<Replay>  {
        return createReplay(userId, this.initialState, this.history);
    }
}
