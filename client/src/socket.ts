import io from "socket.io-client";
import { Card } from "../../shared/card";

export const socket = io();

export function updateHand(callback: (cards: Array<Card>) => void) {
    socket.on("updateHand", callback);
}

export function getCardImagePath(suit: string, rank: string) {
    return '/cards/' + rank + suit + '.svg'; 
}
