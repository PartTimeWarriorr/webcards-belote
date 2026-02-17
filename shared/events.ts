import { BoardState, CardRaw } from "./types";

export interface ClientToServerEvents {
    playCard: (card: CardRaw) => void;
}

export interface ServerToClientEvents {
    updateBoard: (boardState: BoardState) => void;
    welcome: (playerId: string) => void;
    joinTeam: (team: string) => void;
}