import io from "socket.io-client";
import { CardRaw, BoardState, JoinRoomPayload, GameConfig, CardPlayedPayload } from "@shared/types";
import type { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@shared/events";
import { CardObject } from "./types";
import { Vector2d } from "konva/lib/types";

export const socket : Socket<ServerToClientEvents, ClientToServerEvents> = io();

export function updateBoard(callback: (state: BoardState) => void) {
    socket.on("updateBoard", callback);
}

export function playCard(card: CardRaw, callback: (success: boolean) => void) {
    socket.emit("playCard", card, callback);
}

export function welcome(callback: (playerId: string) => void) {
    socket.on("welcome", callback);
}

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

export function startGame(callback: (gameConfig: GameConfig) => void) {
    socket.on("startGame", callback);
}

export function cardPlayed(callback: (payload: CardPlayedPayload) => void) {
    socket.on("cardPlayed", callback);
}