import { BoardState, CardRaw, JoinRoomPayload } from "./types";

export interface ClientToServerEvents {
    playCard: (card: CardRaw) => void;
    joinRoom: (payload: JoinRoomPayload) => void;
}

export interface ServerToClientEvents {
    updateBoard: (boardState: BoardState) => void;
    welcome: (playerId: string) => void;
    joinTeam: (team: string) => void;
    joinedRoom: (payload: JoinRoomPayload) => void;
}