import { PlayerId, Bid, Card, PlayerView, RoomJoinedPayload, Move, GameConfig, GameInitPayload } from "./types";

export interface ClientToServerEvents {
    "room:join": (roomId: string) => void;
    "room:leave": () => void;
    "game:move": (move: Move) => void;
    "game:save": () => void;
    "game:sync": () => void;
    "game:init": () => void;
    "game:advance": () => void;
    "room:ready": (isReady: boolean) => void;
    "room:message": (message: string) => void;
}

export interface ServerToClientEvents {
    "welcome": (pid: PlayerId) => void;
    "game:error": (msg: string) => void;
    "room:log": (msg: string) => void;
    "room:joined": (payload: RoomJoinedPayload) => void;
    "room:left": (payload: RoomJoinedPayload) => void;
    "room:readied": (readyPlayers: PlayerId[]) => void;
    "room:messaged": (username: string, message: string) => void;
    "room:error": (msg: string) => void;
    "game:init": (payload: {gameInit: GameInitPayload, view: PlayerView}) => void;
    "game:state": (payload: PlayerView) => void;
    "game:log": (msg: string) => void;
    "game:revertMove": (card: Card) => void;
    "game:announce": (announcement: string) => void;
}