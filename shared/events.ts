import { PlayerId, Bid, Card, PlayerView, RoomJoinedPayload, Move, GameConfig } from "./types";

export interface ClientToServerEvents {
    "room:join": (roomId: string) => void;
    "room:leave": (roomId: string) => void;
    "game:move": (move: Move) => void;
    "room:ready": (isReady: boolean) => void;
    "room:message": (message: string) => void;
}

export interface ServerToClientEvents {
    "welcome": (pid: PlayerId) => void;
    "client:error": (msg: string) => void;
    "room:log": (msg: string) => void;
    "room:joined": (payload: RoomJoinedPayload) => void;
    "room:left": (payload: RoomJoinedPayload) => void;
    "room:readied": (readyPlayers: PlayerId[]) => void;
    "room:messaged": (username: string, message: string) => void;
    "room:error": (msg: string) => void;
    "game:init": (payload: {config: GameConfig, view: PlayerView}) => void;
    "game:state": (payload: PlayerView) => void;
    "game:log": (msg: string) => void;
    "game:revertMove": (card: Card) => void;
    "game:announce": (announcement: string) => void;
}