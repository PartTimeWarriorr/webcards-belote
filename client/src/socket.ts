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

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(import.meta.env.VITE_SERVER_URL, {
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
export function emitRoomJoin(roomId: string) {
    socket.emit("room:join", roomId);
}

export function emitRoomLeave() {
    socket.emit("room:leave");
}

export function emitGameMove(move: Move) {
    socket.emit("game:move", move);
}

export function emitRoomReady(isReady: boolean) {
    socket.emit("room:ready", isReady);
}

export function emitRoomMessage(msg: string) {
    socket.emit("room:message", msg);
}

// requestGameStep()???
export function requestGameSync() {
    socket.emit("game:sync");
}

export function requestGameInit() {
    socket.emit("game:init");
}

export function requestGameAdvance() {
    socket.emit("game:advance");
}

export function requestRoomInit() {
    socket.emit("room:init");
}

// Server to Client
export function onWelcome(callback: (playerId: string) => void) {
    socket.on("welcome", callback);
}

export function onRoomJoined(callback: (payload: RoomJoinedPayload) => void) {
    socket.on("room:joined", callback);
}

export function onGameState(callback: (payload: PlayerView) => void) {
    socket.on("game:state", callback);
}

export function onGameInit(
    callback: (payload: { gameInit: GameInitPayload; view: PlayerView }) => void,
) {
    socket.on("game:init", callback);
}

export function onRoomInit(callback: (payload: {messages: string[], joinedPlayers: string[]}) => void) {
    socket.on("room:init", callback);
};

export function onGameError(callback: (err: string) => void) {
    socket.on("game:error", callback);
}

export function onRoomReadied(callback: (readyPlayers: PlayerId[]) => void) {
    socket.on("room:readied", callback);
}

export function onRoomMessaged(
    callback: (username: string, msg: string) => void,
) {
    socket.on("room:messaged", callback);
}

export function onRoomLeft(callback: (payload: RoomJoinedPayload) => void) {
    socket.on("room:left", callback);
}

export function onRoomLog(callback: (log: string) => void) {
    socket.on("room:log", callback);
}