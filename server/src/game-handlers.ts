import {
    BiddingState,
    GameMode,
    GameState,
    PlayerId,
    PlayingState,
    Result,
    ScoringState,
    TrickStatus,
} from "@shared/types";
import { Bid, Card, GameConfig, GamePhase } from "@shared/types";
import { higherBid } from "./compare";
import { addRoundScores, addTrickScores, getGameWinner } from "./scoring";
import { allButBidderPassed, allPassed, isRoundFinished } from "./transitions";
import { calcAnnScores } from "./scoring";
import { findAnns } from "./announcements";
import { getTrickWinner, hasCard, canPlay } from "./play-rules";
import { dealFinal, dealInitial, shuffle} from "./card-actions";
import { getNextPlayer, getNextToBid } from "./player-utils";

export function handleBid(
    config: GameConfig,
    state: BiddingState,
    player: PlayerId,
    bid: Bid,
): Result<GameState> {
    if (state.phase !== GamePhase.Bidding)
        return {
            ok: false,
            reason: "Game is not in bidding phase.",
        };

    if (state.highestBid !== null && !higherBid(state.highestBid[1], bid)) {
        return {
            ok: false,
            reason: "Bid isn't higher than current highest bid.",
        };
    }

    if (state.currentBidder !== player) {
        return {
            ok: false,
            reason: "Player is not in turn to bid.",
        };
    }

    return {
        ok: true,
        state: {
            ...state,
            highestBid: [player, bid],
            currentBidder: getNextToBid(state, config),
            passed: new Set(),
        },
    };
}

export function handlePass(
    config: GameConfig,
    state: BiddingState,
    player: PlayerId,
): Result<GameState> {
    if (state.phase !== GamePhase.Bidding)
        return {
            ok: false,
            reason: "Game is not in bidding phase.",
        };

    const newPasses = new Set(state.passed);
    newPasses.add(player);

    if (allButBidderPassed({ ...state, passed: newPasses }, config)) {
        const [newDeck, newHands] = dealFinal(state, config);
        const tempState: PlayingState = {
            ...state,
            phase: GamePhase.Playing,
            round: {
                ...state.round,
                highestBidder: state.highestBid?.[0] ?? "",
                deck: newDeck,
                hands: newHands,
                mode: state.highestBid?.[1].mode ?? GameMode.ALL_TRUMP,
                trump:
                    state.highestBid?.[1].mode === GameMode.TRUMP
                        ? state.highestBid[1].trump
                        : undefined,
                modifier: state.highestBid?.[1].modifier,
                roundScores: { team1: 0, team2: 0 },
            },
            currentPlayer: getNextPlayer(config.players, state.round.dealer),
            trickStatus: TrickStatus.Playing,
            plays: [],
        };

        const announcements =
            tempState.round.mode === GameMode.NO_TRUMP
                ? {}
                : findAnns(config, tempState);
        return {
            ok: true,
            state: {
                ...tempState,
                round: {
                    ...tempState.round,
                    announcements: announcements,
                },
            },
        };
    }

    if (allPassed({ ...state, passed: newPasses }, config)) {
        const newDealer = getNextPlayer(config.players, state.round.dealer);
        const newState: BiddingState = {
            phase: GamePhase.Bidding,
            round: {
                announcements: {},
                dealer: newDealer,
                highestBidder: null,
                deck: shuffle(),
                hands: {},
                roundScores: { team1: 0, team2: 0 },
                announcementScores: { team1: 0, team2: 0 },
            },
            totalScores: state.totalScores,
            hangingScore: state.hangingScore,
            highestBid: null,
            currentBidder: getNextPlayer(config.players, newDealer),
            passed: new Set(),
        };
        const [newDeck, newHands] = dealInitial(newState, config);

        return {
            ok: true,
            state: {
                ...newState,
                round: {
                    ...newState.round,
                    deck: newDeck,
                    hands: newHands,
                },
            },
        };
    }

    // Else continue bidding
    return {
        ok: true,
        state: {
            ...state,
            currentBidder: getNextToBid(state, config),
            passed: newPasses,
        },
    };
}

export function handlePlay(
    config: GameConfig,
    state: PlayingState,
    player: PlayerId,
    card: Card,
): Result<GameState> {
    if (state.phase !== GamePhase.Playing)
        return {
            ok: false,
            reason: "Game is not in playing phase.",
        };
    if (!hasCard(state, player, card)) {
        return {
            ok: false,
            reason: `Player ${player} doesn't have this card: ${card.rank}${card.suit}`,
        };
    }

    // if (!canPlay(state, player, card, config)) {
    //     return {
    //         ok: false,
    //         reason: `Player ${player} cannot play card: ${card.rank}${card.suit}`,
    //     };
    // }
    const validMove = canPlay(state, player, card, config);
    if (!validMove.ok) {
        return {
            ok: false,
            reason: `Cannot play: ${validMove.reason}`,
        };
    }

    const newHands = state.round.hands;
    const cardIndex = newHands[player].findIndex(
        (c) => c.rank === card.rank && c.suit === card.suit,
    );
    newHands[player].splice(cardIndex, 1);

    const newPlays = state.plays;
    newPlays.push({ player: player, card: card });

    if (newPlays.length === 4) {
        return {
            ok: true,
            state: {
                phase: GamePhase.Playing,
                round: {
                    ...state.round,
                    hands: newHands,
                },
                totalScores: state.totalScores,
                hangingScore: state.hangingScore,
                currentPlayer: getNextPlayer(config.players, player),
                trickStatus: TrickStatus.Resolving,
                plays: newPlays,
            },
        };
    }

    return {
        ok: true,
        state: {
            phase: GamePhase.Playing,
            round: {
                ...state.round,
                hands: newHands,
            },
            totalScores: state.totalScores,
            hangingScore: state.hangingScore,
            currentPlayer: getNextPlayer(config.players, player),
            trickStatus: TrickStatus.Playing,
            plays: newPlays,
        },
    };
}

export function handleStartNewRound(
    config: GameConfig,
    state?: GameState,
): Result<GameState> {
    if (!state) {
        // Is first round of the game
        const dealer =
            config.players[Math.floor(Math.random() * config.players.length)];

        const tempState: BiddingState = {
            phase: GamePhase.Bidding,
            round: {
                announcements: {},
                dealer: dealer,
                highestBidder: null,
                deck: shuffle(),
                hands: {},
                roundScores: { team1: 0, team2: 0 },
                announcementScores: { team1: 0, team2: 0 },
            },
            totalScores: { team1: 0, team2: 0 },
            hangingScore: 0,
            highestBid: null,
            currentBidder: getNextPlayer(config.players, dealer),
            passed: new Set(),
        };

        const [newDeck, newHands] = dealInitial(tempState, config);
        const state = {
            ...tempState,
            round: {
                ...tempState.round,
                deck: newDeck,
                hands: newHands,
            },
        };
        return {
            ok: true,
            state: state,
        };
    } else {
        // Is 2nd or later round of the game
        if (state.phase !== GamePhase.Scoring)
            return {
                ok: false,
                reason: "Game is not in scoring phase.",
            };

        if (!isRoundFinished(state)) {
            return {
                ok: false,
                reason: "Round is not over yet",
            };
        }

        const dealer = getNextPlayer(config.players, state.round.dealer);
        const newState: BiddingState = {
            phase: GamePhase.Bidding,
            round: {
                announcements: {},
                dealer: dealer,
                highestBidder: null,
                deck: shuffle(),
                hands: {},
                roundScores: { team1: 0, team2: 0 },
                announcementScores: { team1: 0, team2: 0 },
            },
            totalScores: state.totalScores,
            hangingScore: state.hangingScore,
            highestBid: null,
            currentBidder: getNextPlayer(config.players, dealer),
            passed: new Set(),
        };

        const [newDeck, newHands] = dealInitial(newState, config);

        return {
            ok: true,
            state: {
                ...newState,
                round: {
                    ...newState.round,
                    deck: newDeck,
                    hands: newHands,
                },
            },
        };
    }
}

export function handleResolveTrick(
    config: GameConfig,
    state: PlayingState,
): Result<GameState> {
    if (state.phase !== GamePhase.Playing)
        return {
            ok: false,
            reason: "Game is not in playing phase.",
        };
    if (state.trickStatus !== TrickStatus.Resolving) {
        return {
            ok: false,
            reason: "Trick is still being played",
        };
    }

    const isRoundOver = isRoundFinished(state);
    const trickWinner = getTrickWinner(state);

    if (isRoundOver) {
        const newRoundScores = addTrickScores(
            config,
            state,
            trickWinner,
            isRoundOver,
        );
        const annScores = calcAnnScores(config, state);
        const newState = {
            ...state,
            round: {
                ...state.round,
                roundScores: newRoundScores,
                announcementScores: annScores,
            },
        };
        const { scores, hanging, condition } = addRoundScores(config, newState);
        const winner = getGameWinner(scores);

        if (winner && condition !== "Valat") {
            return {
                ok: true,
                state: {
                    phase: GamePhase.Finished,
                    round: {
                        ...state.round,
                        roundScores: newRoundScores,
                    },
                    totalScores: {
                        team1: scores.team1,
                        team2: scores.team2,
                    },
                    hangingScore: hanging,
                    winningTeam: winner,
                    condition,
                },
            };
        } else {
            return {
                ok: true,
                state: {
                    phase: GamePhase.Scoring,
                    round: {
                        ...state.round,
                        roundScores: newRoundScores,
                    },
                    totalScores: {
                        team1: scores.team1,
                        team2: scores.team2,
                    },
                    hangingScore: hanging,
                    condition,
                },
            };
        }
    } else {
        const newRoundScores = addTrickScores(
            config,
            state,
            trickWinner,
            isRoundOver,
        );
        return {
            ok: true,
            state: {
                ...state,
                round: {
                    ...state.round,
                    roundScores: newRoundScores,
                },
                currentPlayer: trickWinner,
                trickStatus: TrickStatus.Playing,
                plays: [],
            },
        };
    }
}
