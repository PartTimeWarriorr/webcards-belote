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
import {
    addRoundScores,
    addTrickScores,
    allButBidderPassed,
    allPassed,
    canPlay,
    dealFinal,
    dealInitial,
    getNextPlayer,
    getNextToBid,
    getTrickWinner,
    hasCard,
    isRoundFinished,
    shuffle,
} from "./game-actions";

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

        return {
            ok: true,
            state: {
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
                currentPlayer: getNextPlayer(
                    config.players,
                    state.round.dealer,
                ),
                trickStatus: TrickStatus.Playing,
                plays: [],
            },
        };
    }

    if (allPassed({ ...state, passed: newPasses }, config)) {
        const newDealer = getNextPlayer(config.players, state.round.dealer);
        const newState: BiddingState = {
            phase: GamePhase.Bidding,
            round: {
                dealer: newDealer,
                highestBidder: null,
                deck: shuffle(),
                hands: {},
                roundScores: { team1: 0, team2: 0 },
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
            reason: `Cannot play: ${validMove.reason}`
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
    state: ScoringState,
): Result<GameState> {
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
            dealer: dealer,
            highestBidder: null,
            deck: shuffle(),
            hands: {},
            roundScores: { team1: 0, team2: 0 },
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
        const newRoundScores = addTrickScores(config, state, trickWinner, isRoundOver);
        const newState = {
            ...state,
            round: {
                ...state.round,
                roundScores: newRoundScores,
            },
        };
        const { scores, hanging } = addRoundScores(config, newState);

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
            },
        };
    } else {
        const newRoundScores = addTrickScores(config, state, trickWinner, isRoundOver);
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
