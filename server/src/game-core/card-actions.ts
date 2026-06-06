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
    deck: Card[],
    hands: Record<PlayerId, Card[]>,
    config: GameConfig,
): {deck: Card[], hands: Record<PlayerId, Card[]>} {
    const newDeck = structuredClone(deck);
    const newHands = structuredClone(hands);

    config.players.forEach((p) => {
        newHands[p] = newDeck.splice(0, 1);
    });

    return {deck: newDeck, hands: newHands};
}

export function dealFinal(
    deck: Card[],
    hands: Record<PlayerId, Card[]>,
    config: GameConfig,
): {deck: Card[], hands: Record<PlayerId, Card[]>} {
    const newDeck = structuredClone(deck);
    const newHands = structuredClone(hands);

    config.players.forEach((p) => {
        newHands[p] = newHands[p].concat(newDeck.splice(0, 1));
    });

    return {deck: newDeck, hands: newHands};
}

// Hand actions
export function sortHandsDesc(
    config: GameConfig,
    hands: Record<PlayerId, Card[]>
): Record<PlayerId, Card[]> {
    const newHands = structuredClone(hands);
    for (const p of config.players) {
        newHands[p].sort((a, b) => compareCardsFull(b, a));
    }
    return newHands;
}

export function sortHandsAsc(
    config: GameConfig,
    hands: Record<PlayerId, Card[]>
): Record<PlayerId, Card[]> {
    const newHands = structuredClone(hands);
    for (const p of config.players) {
        newHands[p].sort((a, b) => compareCardsFull(a, b));
    }
    return newHands;
}

// Card actions
export function getCardsOfSuit(cards: Card[], suit: Suit): Card[] {
    return cards.filter((c) => c.suit === suit);
}
