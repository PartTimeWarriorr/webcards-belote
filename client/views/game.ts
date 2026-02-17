import Konva from "konva";
import { Board } from "../src/board";
import { joinTeam, updateBoard, welcome } from "../src/socket";
import { BoardState } from "@shared/types";

let playerId : string | null = null;
let playerTeam : string | null = null;
let allyId : string | null = null;
let allyCardCount : number = 0;

export function renderGame() {
    const app = document.getElementById("app")!;
    app.innerHTML = `<div id="container"></div>`;

    const stage = new Konva.Stage({
        container: "container",
        width: window.innerWidth,
        height: window.innerHeight,
    });

    // !SCALE FOR DEMO
    // const GAME_WIDTH = 1920;
    // const GAME_HEIGHT = 1080;

    // const scaleX = window.innerWidth / GAME_WIDTH;
    // const scaleY = window.innerHeight / GAME_HEIGHT;

    // const scale = Math.min(scaleX / 2, scaleY / 2);
    // stage.scale({ x: scale, y: scale });

    const layer = new Konva.Layer();
    const dragLayer = new Konva.Layer();

    let board = new Board(layer, dragLayer, stage);
    // board.visualizePlayerHand();
    // board.visualizeAlly(8);
    // board.visualizeOpps(8, 8);

    // updateHand((hand) => {
    //     board.hand = hand;
    //     console.log(hand);
    //     board.visualizePlayerHand();
    // });

    welcome((id) => {
        playerId = id;
    });

    joinTeam((team) => {
        playerTeam = team;
    })

    updateBoard((boardState: BoardState) => {
        boardState.players.forEach((p) => {
            if (p.id === playerId) {
                board.hand = p.hand;
            }
            if (p.team === playerTeam && p.id !== playerId) {
                allyId = p.id;
                allyCardCount = p.hand.length;
            }
        });

        board.clearAllCards();
        board.visualizePlayerHand();
        board.visualizeAlly(allyCardCount);
        board.visualizeOpps(8, 8);
        board.visualizePlayField(boardState, playerId, allyId);
    });
}