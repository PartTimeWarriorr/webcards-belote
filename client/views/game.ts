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

    const layer = new Konva.Layer();
    const dragLayer = new Konva.Layer();

    let board = new Board(layer, dragLayer, stage);
    board.visualizePlayerHand();
    board.visualizeAlly(8);
    board.visualizeOpps(8, 8);

    updateHand(hand => {
        board.hand = hand;
        console.log(hand);
        board.visualizePlayerHand();
    });
}