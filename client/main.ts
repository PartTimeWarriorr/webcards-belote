import { renderHome } from "./views/Home";
import { renderGame } from "./views/Game";

let currentPage = "game";

export function navigate(pageName: string) {
    currentPage = pageName;
    render();
}

function render() {
    if (currentPage === "home") renderHome();
    if (currentPage === "rooms") renderRooms();
    if (currentPage === "game") renderGame();
}

function renderRooms() {
    // app!.innerHTML = `<div id="container">Rooms</div>`
    // currentPage = "rooms";
}

render();
