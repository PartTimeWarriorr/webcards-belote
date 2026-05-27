import {
    Card,
    Suit,
    Rank,
    GameConfig,
    PlayerId,
    GameState,
} from "@shared/types";
import { compareCardsFull } from "./compare";

// Deck actions
export function shuffle(): Card[] {
    const deck = getFullDeck();
    return deck.sort(() => Math.random() - 0.5);
}

function getFullDeck(): Card[] {
    const deck: Card[] = [];
    for (let s of Object.values(Suit)) {
        for (let r of Object.values(Rank)) {
            deck.push({ rank: r, suit: s });
        }
    }
    return deck;
}

export function dealInitial(
    state: GameState,
    config: GameConfig,
): [Card[], Record<PlayerId, Card[]>] {
    const deck = state.round.deck;
    const hands = state.round.hands;

    config.players.forEach((p) => {
        hands[p] = deck.splice(0, 5);
    });

    return [deck, hands];
}

export function dealFinal(
    state: GameState,
    config: GameConfig,
): [Card[], Record<PlayerId, Card[]>] {
    const deck = state.round.deck;
    const hands = state.round.hands;

    config.players.forEach((p) => {
        hands[p] = hands[p].concat(deck.splice(0, 3));
    });

    return [deck, hands];
}

// Hand actions
export function sortHandsDesc(
    config: GameConfig,
    state: GameState,
): Record<PlayerId, Card[]> {
    const hands = state.round.hands;
    for (const p of config.players) {
        hands[p].sort((a, b) => compareCardsFull(b, a));
    }
    return hands;
}

export function sortHandsAsc(
    config: GameConfig,
    state: GameState,
): Record<PlayerId, Card[]> {
    const hands = state.round.hands;
    for (const p of config.players) {
        hands[p].sort((a, b) => compareCardsFull(a, b));
    }
    return hands;
}

// Card actions
export function getCardsOfSuit(cards: Card[], suit: Suit): Card[] {
    return cards.filter((c) => c.suit === suit);
}
