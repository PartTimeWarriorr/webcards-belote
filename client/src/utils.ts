import { Suit, Rank } from "@shared/types";

export function getCardImagePath(suit: Suit, rank: Rank) {
    return "/cards/" + rank + suit + ".svg";
}