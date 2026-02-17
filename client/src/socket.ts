import io from "socket.io-client";
import { CardRaw, BoardState, JoinRoomPayload } from "@shared/types";
import type { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@shared/events";

export const socket : Socket<ServerToClientEvents, ClientToServerEvents> = io();

export function updateBoard(callback: (state: BoardState) => void) {
    socket.on("updateBoard", callback);
}

export function playCard(card: CardRaw) {
    socket.emit("playCard", card);
}

export function welcome(callback: (playerId: string) => void) {
    socket.on("welcome", callback);
}

// export function updateHand(callback: (cards: Array<CardRaw>) => void) {
//     socket.on("updateHand", callback);
// }

export function joinTeam(callback: (team: string) => void) {
    socket.on("joinTeam", callback);
}

export function joinRoom(room: string, teamPref: string) {
    const payload : JoinRoomPayload = { roomName: room, teamPref: teamPref };
    socket.emit("joinRoom", payload);
}

export function joinedRoom(callback: (payload: JoinRoomPayload) => void) {
    socket.on("joinedRoom", callback);
}