import { navigate } from "main";

export function renderGame() {
    const app = document.getElementById("app")!;
    app.innerHTML = `<div id="container">Game</div>`;
}