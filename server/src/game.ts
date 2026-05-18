import { GamePhase, GameState, GameConfig, Move, Result } from "@shared/types";
import { dealInitial, getNextPlayer, shuffle } from "./game-actions";
import * as handlers from "./game-handlers";

export class Game {
    private state: GameState;
    private config: GameConfig;

    private history: Array<GameState> = [];

    constructor(config: GameConfig) {
        const dealer =
            config.players[Math.floor(Math.random() * config.players.length)];
        this.state = {
            phase: GamePhase.Bidding,
            round: {
                dealer: dealer,
                highestBidder: null,
                deck: shuffle(),
                hands: {},
                roundScores: { team1: 0, team2: 0 },
            },
            totalScores: { team1: 0, team2: 0 },
            hangingScore: 0,
            highestBid: null,
            currentBidder: getNextPlayer(config.players, dealer),
            passed: new Set(),
        };
        const [newDeck, newHands] = dealInitial(this.state, config);
        this.state = {
            ...this.state,
            round: {
                ...this.state.round,
                deck: newDeck,
                hands: newHands,
            },
        };
        this.config = config;
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
            this.history.push(result.state);
            this.state = result.state;
        }

        return result;
    }
}
