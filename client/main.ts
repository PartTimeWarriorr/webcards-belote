import { renderHome } from "./views/home";
import { renderGame } from "./views/game";

let currentPage = "home";

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
