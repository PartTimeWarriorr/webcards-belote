import { renderHome } from "./views/Home";
import { renderGame } from "./views/Game";

let currentPage = "game";

export function navigate(pageName: string) {
    currentPage = pageName;
    render();
}

async function render() {
    if (currentPage === "home") renderHome();
    if (currentPage === "rooms") renderRooms();
    if (currentPage === "game") await renderGame();
}

function renderRooms() {
    const app = document.getElementById("app")!;
    app.innerHTML = `<div class="gamemode-modal">
    <div class="mode-btn btn-club" name="clubs"></div> 
    <div class="mode-btn btn-diamond" name="diamonds"></div> 
    <div class="mode-btn btn-heart" name="hearts"></div> 
    <div class="mode-btn btn-spade" name="spades"></div> 
    <div class="mode-btn" name="NT">NT</div> 
    <div class="mode-btn" name="AT">AT</div> 
    <div class="mode-btn" name="x2">x2</div> 
    <div class="mode-btn" name="x4">x4</div> 
    </div>`;

    // currentPage = "rooms";
}

render();
