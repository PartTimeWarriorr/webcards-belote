import Konva from "konva";
import { Board } from "../src/board";
import { joinTeam, startGame, updateBoard, welcome } from "../src/socket";
import { BoardState, GameConfig, Seats } from "@shared/types";

let playerId : string | null = null;
let playerTeam : string | null = null;
let allyId : string | null = null;
let allyCardCount : number = 0;

let south : string | null = null;
let west : string | null = null;
let north : string | null = null;
let east : string | null = null;

let teams;

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

    welcome((id) => {
        playerId = id;
    });

    joinTeam((team) => {
        playerTeam = team;
    });

    startGame((gameConfig: GameConfig) => {
        playerId = gameConfig.playerId;
        allyId = gameConfig.allyId;
        const rotated = rotateSeats(gameConfig.seats);
        let south = rotated[0];
        let west = rotated[1];
        let north = rotated[2];
        let east = rotated[3];

        teams = gameConfig.teams; 
    });

    updateBoard((boardState: BoardState) => {
        board.hand = boardState.hand;
        
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



function rotateSeats(seats: Seats) {
    // Rotate the player positions so player is at south
    const playerIndex = seats.findIndex( id => id === playerId);
    return [...seats.slice(playerIndex), ...seats.slice(0, playerIndex)];
}