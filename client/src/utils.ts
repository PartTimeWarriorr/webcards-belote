import { Suit, Rank } from "@shared/types";
import { CardObject } from "./types";

export function getCardImagePath(suit: Suit, rank: Rank): string {
    return `/cards/${rank}${suit}.svg`;
}

export function getCardId(card: CardObject): string {
    return `${card.rank}${card.suit}`;
}

export function getAllCardPaths(): string[] {

    const result : string[] = [];

    for (let suit of Object.values(Suit)) {
        for (let rank of Object.values(Rank)) {
            result.push(`/cards/${rank}${suit}.svg`); 
        }
    }

    result.push( "/cards/1B.svg");

    return result;
}