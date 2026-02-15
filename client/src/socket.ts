import io from "socket.io-client";
import { Suit, Rank, CardRaw, BoardState } from "@shared/types";

export const socket = io();

export function updateHand(callback: (cards: Array<CardRaw>) => void) {
    socket.on("updateHand", callback);
}

export function updateBoard(callback: (state: BoardState) => void) {
    socket.on("updateBoard", callback);
}

export function playCard(card: CardRaw) {
    socket.emit("playCard", card);
}

export function welcome(callback: (playerId: string) => void) {
    socket.on("welcome", callback);
}

export function getCardImagePath(suit: Suit, rank: Rank) {
    return "/cards/" + rank + suit + ".svg";
}
