import io from "socket.io-client";
import { CardRaw } from "@shared/types";
import { Suit, Rank } from "@shared/types";

export const socket = io();

export function updateHand(callback: (cards: Array<CardRaw>) => void) {
    socket.on("updateHand", callback);
}

export function getCardImagePath(suit: Suit, rank: Rank) {
    return "/cards/" + rank + suit + ".svg";
}
