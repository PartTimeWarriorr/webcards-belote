import { BoardState, CardPlayedPayload, CardRaw, GameConfig, JoinRoomPayload, PlayerId } from "./types";

export interface ClientToServerEvents {
    playCard: (card: CardRaw, ack: (success: boolean) => void) => void;
    joinRoom: (payload: JoinRoomPayload) => void;

    clientReady: () => void;
    
    // New events
    requestBoard: (playerId: PlayerId) => void;
}

export interface ServerToClientEvents {
    initGame: (gameConfig: GameConfig, boardState: BoardState) => void;
    updateBoard: (boardState: BoardState) => void;
    welcome: (playerId: PlayerId) => void;
    joinTeam: (team: string) => void;
    joinedRoom: (payload: JoinRoomPayload) => void;
    startGame: (gameConfig: GameConfig) => void;

    // New events
    setBoard: (boardState: BoardState) => void;
    cardPlayed: (payload: CardPlayedPayload) => void;
    finishTrick: () => void;
}