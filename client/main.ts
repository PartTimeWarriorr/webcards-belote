import { renderHome } from "./views/Home";
import { renderGame } from "./views/Game";
let currentPage = "game";

export async function navigate(pageName: string) {
    currentPage = pageName;
    render();
}

async function render() {
    if (currentPage === "home") renderHome();
    // if (currentPage === "rooms") renderRooms();
    if (currentPage === "game") await renderGame();
}

// function renderRooms() {
//     const app = document.getElementById("app")!;
// }

render();
