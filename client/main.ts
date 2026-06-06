import { renderHome } from "./views/home";
import { renderRoom } from "./views/room";
import { renderGame } from "./views/game";
let currentPage = "home";

export async function navigate(pageName: string) {
    currentPage = pageName;
    render();
}

async function render() {
    if (currentPage === "home") renderHome();
    if (currentPage === "room") renderRoom();
    if (currentPage === "game") await renderGame();
}

render();