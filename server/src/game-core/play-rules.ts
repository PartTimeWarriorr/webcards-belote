import { GameState, PlayerId, Card, Rank, Suit, PlayingState, Play, GameConfig, GameMode, Result } from "@shared/types";
import { compareCardsPower } from "./compare";
import { isSameTeam } from "./player-utils";

export function canPlay(
    state: PlayingState,
    player: PlayerId,
    card: Card,
    config: GameConfig,
): Result<boolean> {
    if (state.currentPlayer !== player)
        return { ok: false, reason: "It's not this player's turn" };
    if (!hasCard(state, player, card))
        return { ok: false, reason: "Player doesn't have this card" };

    if (state.plays.length === 0) return { ok: true, state: true };
    if (state.plays.length === 4)
        return { ok: false, reason: "Trick is complete already" };

    const { player: trickPlayer, card: trickCard } = state.plays[0];
    const trickSuit = trickCard.suit;

    switch (state.round.mode) {
        case GameMode.ALL_TRUMP: {
            if (hasSuit(state, player, trickSuit) && card.suit !== trickSuit)
                return {
                    ok: false,
                    reason: "ALL_TRUMP mode: Player has correct suit but not playing it.",
                };

            const { card: highest } = getHighestPlay(state);
            if (
                compareCardsPower(state, highest, card) > 0 &&
                hasHigherSameSuit(state, player, highest)
            )
                return {
                    ok: false,
                    reason: "ALL_TRUMP mode: Player has higher card of suit, but not playing it.",
                };

            return { ok: true, state: true };
        }
        case GameMode.NO_TRUMP: {
            if (hasSuit(state, player, trickSuit) && card.suit !== trickSuit)
                return {
                    ok: false,
                    reason: "NO_TRUMP mode: Player has correct suit but not playing it.",
                };

            return { ok: true, state: true };
        }
        case GameMode.TRUMP: {
            if (!state.round.trump) {
                throw new Error("No trump selected in TRUMP GameMode");
            }

            if (hasSuit(state, player, trickSuit) && card.suit !== trickSuit)
                return {
                    ok: false,
                    reason: "TRUMP mode: Player has correct suit but not playing it.",
                };

            const trickWinner = getTrickWinner(state);
            if (
                !isSameTeam(config, trickWinner, player) &&
                !hasSuit(state, player, trickSuit) &&
                hasSuit(state, player, state.round.trump) &&
                card.suit !== state.round.trump
            )
                return {
                    ok: false,
                    reason: "TRUMP mode: The winner is the opposing team and the player has a trump they can play.",
                };

            const highestOppTrump = getHighestOppTrump(config, state, player);
            if (
                !isSameTeam(config, trickWinner, player) &&
                highestOppTrump &&
                compareCardsPower(state, highestOppTrump, card) > 0 &&
                hasHigherSameSuit(state, player, highestOppTrump)
            )
                return {
                    ok: false,
                    reason: "TRUMP mode: Player has higher trump than the opponent but not playing it.",
                };

            return { ok: true, state: true };
        }
        default:
            return { ok: false, reason: "Default" };
    }
}


export function getTrickWinner(state: PlayingState): PlayerId {
    const { card: trickCard } = state.plays[0];
    const trickSuit = trickCard.suit;

    switch (state.round.mode) {
        case GameMode.ALL_TRUMP:
        case GameMode.NO_TRUMP: {
            const highestOfSuit = getHighestPlayOfSuit(state, trickSuit);

            return highestOfSuit.player;
        }
        case GameMode.TRUMP: {
            if (!state.round.trump) {
                throw new Error("No trump selected in TRUMP GameMode");
            }

            if (isTrumpPlayed(state, state.round.trump)) {
                const highestOfSuit = getHighestPlayOfSuit(
                    state,
                    state.round.trump,
                );

                return highestOfSuit.player;
            } else {
                const highestOfSuit = getHighestPlayOfSuit(state, trickSuit);

                return highestOfSuit.player;
            }
        }
    }

    return "";
}

export function hasCard(
    state: GameState,
    player: PlayerId,
    card: Card,
): boolean {
    return state.round.hands[player].some(
        (c) => c.rank === card.rank && c.suit === card.suit,
    );
}

export function hasRank(state: GameState, player: PlayerId, rank: Rank): boolean {
    return state.round.hands[player].some((c) => c.rank === rank);
}

export function hasSuit(
    state: GameState,
    player: PlayerId,
    suit: Suit,
): boolean {
    return state.round.hands[player].some((c) => c.suit === suit);
}

export function hasHigherSameSuit(
    state: GameState,
    player: PlayerId,
    card: Card,
): boolean {
    return state.round.hands[player].some(
        (c) => compareCardsPower(state, c, card) > 0 && c.suit === card.suit,
    );
}

export function getHighestPlay(state: PlayingState): Play {
    const plays = state.plays;
    plays.sort((left, right) =>
        compareCardsPower(state, left.card, right.card),
    );
    return plays[0];
}

export function getHighestPlayOfSuit(state: PlayingState, suit: Suit): Play {
    const filtered = state.plays.filter((p) => p.card.suit === suit);
    filtered.sort((left, right) =>
        compareCardsPower(state, right.card, left.card),
    );
    return filtered[0];
}

export function getHighestOppTrump(
    config: GameConfig,
    state: PlayingState,
    player: PlayerId,
): Card {
    const oppTrumps = state.plays
        .filter(
            (play) =>
                play.card.suit === state.round.trump &&
                !isSameTeam(config, play.player, player),
        )
        .map((play) => play.card);
    oppTrumps.sort((left, right) => compareCardsPower(state, left, right));
    return oppTrumps[0];
}

export function isTrumpPlayed(state: PlayingState, trump: Suit): boolean {
    if (state.round.mode !== GameMode.TRUMP)
        throw new Error("This is not a TRUMP mode game");

    return state.plays.some((play) => play.card.suit === trump);
}
