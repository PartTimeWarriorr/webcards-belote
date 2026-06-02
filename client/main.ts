import { renderHome } from "./views/Home";
import { renderRoom } from "./views/Room";
import { renderGame } from "./views/game";
let currentPage = "room";

export async function navigate(pageName: string) {
    currentPage = pageName;
    render();
}

async function render() {
    if (currentPage === "home") renderHome();
    if (currentPage === "room") renderRoom();
    if (currentPage === "game") await renderGame();
}

// function renderRooms() {
//     const app = document.getElementById("app")!;
// }

render();