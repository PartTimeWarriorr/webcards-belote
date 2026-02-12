import Konva from "konva";
import { Board } from "../src/board";
import { updateHand } from "../src/socket";

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
    board.visualizePlayerHand();
    board.visualizeAlly(8);
    board.visualizeOpps(8, 8);

    updateHand((hand) => {
        board.hand = hand;
        console.log(hand);
        board.visualizePlayerHand();
    });
}