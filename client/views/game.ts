import Konva from "konva";
import { Board } from "../src/board";
import { joinTeam, startGame, updateBoard, welcome } from "../src/socket";
import { BoardState, GameConfig, Seats } from "@shared/types";
import { LocalGameConfig } from "@/types";

let config : LocalGameConfig | null = null; 

export function renderGame() {

    // !SCALE FOR DEMO
    // const GAME_WIDTH = 1920;
    // const GAME_HEIGHT = 1080;

    // const scaleX = window.innerWidth / GAME_WIDTH;
    // const scaleY = window.innerHeight / GAME_HEIGHT;

    // const scale = Math.min(scaleX / 2, scaleY / 2);
    // stage.scale({ x: scale, y: scale });

    const app = document.getElementById("app")!;
    app.innerHTML = `<div id="container"></div>`;

    const stage = new Konva.Stage({
        container: "container",
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const layer = new Konva.Layer();
    const dragLayer = new Konva.Layer();

    let board = new Board(layer, dragLayer, stage);

    // welcome((id) => {
    //     playerId = id;
    // });

    // joinTeam((team) => {
    //     playerTeam = team;
    // });

    startGame((gameConfig: GameConfig) => {
        const rotated = rotateSeats(gameConfig.seats, gameConfig.playerId); 
        const allyId = getAllyId(gameConfig.teams, gameConfig.playerId);
        let gc : LocalGameConfig = {
            playerId: gameConfig.playerId,
            allyId: allyId, 
            seats: rotated as Seats,
            teams: gameConfig.teams
        };

        config = gc;
        console.log(config);
        // visualize
    });

    updateBoard((boardState: BoardState) => {
        board.hand = boardState.hand;
        board.cardCounts = boardState.cardCounts;
        board.turn = boardState.turn;
        console.log(boardState); 
    });

    // startGame((boardState: BoardState) => {
    //     boardState.players.forEach((p) => {
    //         if (p.id === playerId) {
    //             board.hand = p.hand;
    //         }
    //         if (p.team === playerTeam && p.id !== playerId) {
    //             allyId = p.id;
    //         }
    //     })

    //     board.clearAllCards();
    //     board.visualizePlayerHand();
    //     board.visualizeAlly(8);
    //     board.visualizeOpps(8, 8);
    // });

    // updateBoard((boardState: BoardState) => {
        // boardState.players.forEach((p) => {
        //     if (p.id === playerId) {
        //         board.hand = p.hand;
        //     }
        //     if (p.team === playerTeam && p.id !== playerId) {
        //         allyId = p.id;
        //         allyCardCount = p.hand.length;
        //     }
        // });

        // board.clearAllCards();
        // board.visualizePlayerHand();
        // board.visualizeAlly(allyCardCount);
        // board.visualizeOpps(8, 8);
        // board.visualizePlayField(boardState, playerId, allyId);
    // });
}

function rotateSeats(seats: Seats, playerId: string) {
    // Rotate the player positions so player is at south
    const playerIndex = seats.findIndex( id => id === playerId);
    return [...seats.slice(playerIndex), ...seats.slice(0, playerIndex)];
}

function getAllyId(teams: Record<string, string>, playerId: string) : string {
    const team = teams[playerId];
    const allyId = Object.keys(teams).find(
        id => { teams[id] === team && id !== playerId 
    });
    if (!allyId) throw new Error("No ally found");
    return allyId[0];
}