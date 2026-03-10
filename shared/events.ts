import { BoardState, CardRaw, GameConfig, JoinRoomPayload, PlayedCardPayload } from "./types";

export interface ClientToServerEvents {
    playCard: (card: CardRaw, ack: (success: boolean) => void) => void;
    joinRoom: (payload: JoinRoomPayload) => void;
}

export interface ServerToClientEvents {
    updateBoard: (boardState: BoardState) => void;
    welcome: (playerId: string) => void;
    joinTeam: (team: string) => void;
    joinedRoom: (payload: JoinRoomPayload) => void;
    startGame: (gameConfig: GameConfig) => void;
    playedCard: (payload: PlayedCardPayload) => void;
}