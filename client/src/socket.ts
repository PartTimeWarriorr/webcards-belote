import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import type {
    ServerToClientEvents,
    ClientToServerEvents,
} from "@shared/events";
import {
    Card,
    GameConfig,
    GameInitPayload,
    Move,
    PlayerId,
    PlayerView,
    RoomJoinedPayload,
} from "@shared/types";

const SERVER_URL = "http://localhost:8080";
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: false,
});

export function connectSocket() {
    if (!socket.connected)
        socket.connect();
}

export function disconnectSocket() {
    if (socket.connected) {
        socket.disconnect();
    }
}

// Client to Server
export function roomJoin(roomId: string) {
    socket.emit("room:join", roomId);
}

export function roomLeave() {
    socket.emit("room:leave");
}

export function gameMove(move: Move) {
    socket.emit("game:move", move);
}

export function roomReady(isReady: boolean) {
    socket.emit("room:ready", isReady);
}

export function roomMessage(msg: string) {
    socket.emit("room:message", msg);
}

export function gameSync() {
    socket.emit("game:sync");
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

export function startGame(
    callback: (payload: { gameInit: GameInitPayload; view: PlayerView }) => void,
) {
    socket.on("game:init", callback);
}

export function clientError(callback: (err: string) => void) {
    socket.on("client:error", callback);
}

export function roomReadied(callback: (readyPlayers: PlayerId[]) => void) {
    socket.on("room:readied", callback);
}

export function roomMessaged(
    callback: (username: string, msg: string) => void,
) {
    socket.on("room:messaged", callback);
}