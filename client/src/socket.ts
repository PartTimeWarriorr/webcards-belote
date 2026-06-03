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
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
    // if (!token) {
    //     throw new Error("No token provided");
    // }
    if (!socket) {
        socket = io(SERVER_URL, {
            withCredentials: true,
            transports: ["websocket"],
            // auth: {
            //     token: token,
            // },
        });
    }
    return socket;
}

// Client to Server
export function roomJoin(roomId: string) {
    getSocket().emit("room:join", roomId);
}

export function roomLeave(roomId: string) {
    getSocket().emit("room:leave", roomId);
}

export function gameMove(move: Move) {
    getSocket().emit("game:move", move);
}

export function roomReady(isReady: boolean) {
    getSocket().emit("room:ready", isReady);
}

export function roomMessage(msg: string) {
    getSocket().emit("room:message", msg);
}

// Server to Client
export function welcome(callback: (playerId: string) => void) {
    getSocket().on("welcome", callback);
}

export function roomJoined(callback: (payload: RoomJoinedPayload) => void) {
    getSocket().on("room:joined", callback);
}

export function updateGame(callback: (payload: PlayerView) => void) {
    getSocket().on("game:state", callback);
}

export function startGame(
    callback: (payload: { gameInit: GameInitPayload; view: PlayerView }) => void,
) {
    getSocket().on("game:init", callback);
}

export function clientError(callback: (err: string) => void) {
    getSocket().on("client:error", callback);
}

export function roomReadied(callback: (readyPlayers: PlayerId[]) => void) {
    getSocket().on("room:readied", callback);
}

export function roomMessaged(
    callback: (username: string, msg: string) => void,
) {
    getSocket().on("room:messaged", callback);
}