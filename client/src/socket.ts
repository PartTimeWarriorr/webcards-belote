import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@shared/events";
import { Card, GameConfig, Move, PlayerId, PlayerView, RoomJoinedPayload } from "@shared/types";


const SERVER_URL = "http://localhost:8080";
export const socket : Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {transports: ["websocket"]});

// Client to Server
export function roomJoin(roomId: string) {
    socket.emit("room:join", roomId);
}

export function roomLeave(roomId: string) {
    socket.emit("room:leave", roomId);
}

export function gameMove(move: Move) {
    socket.emit("game:move", move);
}

export function roomReady(isReady: boolean) {
    socket.emit("room:ready", isReady);
}

// Server to Client
export function welcome(callback: (playerId: string) => void) {
    socket.on("welcome", callback);
}

export function roomJoined(callback: (payload: RoomJoinedPayload) => void) {
    socket.on("room:joined", callback);
}

export function updateGame(callback: (payload: PlayerView) => void) {
    socket.on("game:state", callback);
}

export function startGame(callback: (payload: {config: GameConfig, view: PlayerView}) => void) {
    socket.on("game:init", callback);
}

export function clientError(callback: (err: string) => void) {
    socket.on("client:error", callback);
}

export function roomReadied(callback: (readyPlayers: PlayerId[]) => void) {
    socket.on("room:readied", callback);
}