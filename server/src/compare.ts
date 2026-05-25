import { ALL_TRUMP_POWER, ANNOUNCE_ORDER, NO_TRUMP_POWER } from "./game-rules";
import { GameMode, Bid, Suit, SUIT_ORDER, GameState, Card, Announcement, AnnouncementType, ANNOUNCEMENT_LENGTH } from "@shared/types";

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

function getCardOrder(card: Card): number {
    return ANNOUNCE_ORDER[card.rank];
}

export function compareCardsFull(left: Card, right: Card) {
    if (left.suit !== right.suit) {
        return compareSuits(left.suit, right.suit);
    } else if (left.rank !== right.rank) {
        return getCardOrder(left) - getCardOrder(right);
    } else {
        return 0;
    }
}

export function compareSequences(left: Announcement, right: Announcement) {
    if (left.type === AnnouncementType.Square || left.type === AnnouncementType.Belot || right.type === AnnouncementType.Square || right.type === AnnouncementType.Belot)
        return 0;

    if (left.type === right.type) 
        return ANNOUNCE_ORDER[left.highestCard] - ANNOUNCE_ORDER[right.highestCard];

    return ANNOUNCEMENT_LENGTH[left.type] - ANNOUNCEMENT_LENGTH[right.type];
}