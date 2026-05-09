import { ALL_TRUMP_POWER, NO_TRUMP_POWER } from "./game-rules";
import { GameMode, Bid, Suit, SUIT_ORDER, GameState, Card } from "./types";

function compareSuits(left: Suit, right: Suit) {
    return SUIT_ORDER.indexOf(left) - SUIT_ORDER.indexOf(right);
}

export function compareBids(left: Bid, right: Bid) {
    const modeDiff = left.mode - right.mode;
    if (modeDiff !== 0) return modeDiff;

    if (
        left.mode === GameMode.TRUMP &&
        right.mode === GameMode.TRUMP &&
        left.trump !== right.trump
    ) {
        return compareSuits(left.trump, right.trump);
    }

    const mod_left = "modifier" in left ? (left.modifier ?? 1) : 1;
    const mod_right = "modifier" in right ? (right.modifier ?? 1) : 1;

    return mod_left - mod_right;
}

// <
export function higherBid(low: Bid, high: Bid) {
    return compareBids(low, high) < 0;
}

function getCardPower(state: GameState, card: Card): number {
    switch (state.round.mode) {
        case GameMode.ALL_TRUMP:
            return ALL_TRUMP_POWER[card.rank];
        case GameMode.NO_TRUMP:
            return NO_TRUMP_POWER[card.rank];
        case GameMode.TRUMP:
            if (card.suit === state.round.trump) {
                return ALL_TRUMP_POWER[card.rank];
            } else {
                return NO_TRUMP_POWER[card.rank];
            }
        default:
            return 0;
    }
}

export function compareCardsPower(state: GameState, left: Card, right: Card) {
    return getCardPower(state, left) - getCardPower(state, right);
}
