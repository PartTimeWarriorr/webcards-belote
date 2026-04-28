import Konva from "konva";
import { Board } from "../src/board-new";
import { cardPlayed, clientReady, finishTrick, initGame, joinTeam, startGame, updateBoard, welcome } from "../src/socket";
import { BoardState, CardPlayedPayload, GameConfig, GameMode, GameModePayload, Seats, Suit } from "@shared/types";
import { LocalGameConfig } from "@/types";

let config: LocalGameConfig | null = null;

const payloadMap: Record<string, GameModePayload> = {
    "clubs": { mode: GameMode.TRUMP, trump: Suit.Clubs },
    "diamonds": { mode: GameMode.TRUMP, trump: Suit.Diamonds },
    "heart": { mode: GameMode.TRUMP, trump: Suit.Hearts },
    "spades": { mode: GameMode.TRUMP, trump: Suit.Spades },
    "NT" : { mode: GameMode.NO_TRUMP },
    "AT": { mode: GameMode.ALL_TRUMP }
};

export async function renderGame() {
    // !SCALE FOR DEMO
    // const GAME_WIDTH = 1920;
    // const GAME_HEIGHT = 1080;

    // const scaleX = window.innerWidth / GAME_WIDTH;
    // const scaleY = window.innerHeight / GAME_HEIGHT;

    // const scale = Math.min(scaleX / 2, scaleY / 2);
    // stage.scale({ x: scale, y: scale });

    const app = document.getElementById("app")!;
    app.innerHTML = `<div id="container"></div>
    <div class="gamemode-modal">
        <div class="mode-btn btn-club" name="clubs"></div> 
        <div class="mode-btn btn-diamond" name="diamonds"></div> 
        <div class="mode-btn btn-heart" name="hearts"></div> 
        <div class="mode-btn btn-spade" name="spades"></div> 
        <div class="mode-btn" name="NT">NT</div> 
        <div class="mode-btn" name="AT">AT</div> 
        <div class="mode-btn" name="x2">x2</div> 
        <div class="mode-btn" name="x4">x4</div> 
    </div>
    `;

    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const name = btn.getAttribute('name');
            console.log(name);
            if (!name) return;

             
        });
    });

    const stage = new Konva.Stage({
        container: "container",
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const layer = new Konva.Layer();
    const dragLayer = new Konva.Layer();

    let board = await Board.init(layer, dragLayer, stage);

    cardPlayed((payload: CardPlayedPayload) => {
        console.log(`Received play: ${payload.playerId}, ${payload.card}`);
        board.onCardPlayed(payload);
        board.removeCardBack(payload);
    });

    initGame((gameConfig: GameConfig, boardState: BoardState) => {
        console.log(`Received config:`);
        console.log(gameConfig);
        console.log(`Received board:`);
        console.log(boardState);
        const rotated = rotateSeats(gameConfig.seats, gameConfig.playerId);
        const allyId = getAllyId(gameConfig.teams, gameConfig.playerId);
        config = {
            playerId: gameConfig.playerId,
            allyId: allyId,
            seats: rotated as Seats,
            teams: gameConfig.teams
        };

        board.seats = config.seats;
        board.load(boardState);
    });

    finishTrick(() => {
        board.finishTrick(); 
    });

    clientReady();
}

function rotateSeats(seats: Seats, playerId: string) {
    // Rotate the player positions so player is at south
    const playerIndex = seats.findIndex((id) => id === playerId);
    return [...seats.slice(playerIndex), ...seats.slice(0, playerIndex)];
}

function getAllyId(teams: Record<string, string>, playerId: string): string {
    const team = teams[playerId];
    const allyId = Object.keys(teams).find(
        (id) => teams[id] === team && id !== playerId,
    );
    if (!allyId) throw new Error("No ally found");
    return allyId;
}
