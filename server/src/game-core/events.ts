import { PlayerId, Bid, Card, PlayerView, RoomJoinedPayload, Move } from "./types";

export interface ClientToServerEvents {
    "room:join": (roomId: string) => void;
    "room:leave": (roomId: string) => void;
    "game:move": (move: Move) => void;
}

export interface ServerToClientEvents {
    "welcome": (pid: PlayerId) => void;
    "client:error": (msg: string) => void;
    "room:log": (msg: string) => void;
    "room:joined": (payload: RoomJoinedPayload) => void;
    "room:left": (payload: RoomJoinedPayload) => void;
    "room:error": (msg: string) => void;
    "game:state": (payload: PlayerView) => void;
    "game:log": (msg: string) => void;
}
