import { roomJoin, roomReady } from "@/socket";

let currentUser = null; // ??
export function renderRoom() {
    const app = document.getElementById('app')!;

    app.innerHTML = `
            <div id="roomContainer">
                <div id="chatBox"></div> 
                <input type="checkbox" name="readyButton" id="readyButton" class="hidden">
                <label for="readyButton" class="scoreboard-button btn-main">Ready</label>
            </div>
    `;

    const roomContainer = document.getElementById('roomContainer');
    if (!roomContainer) throw new Error("Room container not found");
    const readyButton: HTMLInputElement = roomContainer.querySelector('#readyButton')!;

    readyButton.addEventListener('click', () => {
        const isReady = readyButton.checked;
        roomReady(isReady); 
    });

    roomJoin("Game_1");
}