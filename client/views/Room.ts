import {
    roomJoin,
    roomMessage,
    roomMessaged,
    roomReadied,
    roomReady,
    welcome,
} from "@/socket";
import { PlayerId } from "@shared/types";
import { navigate } from "../main";

export let userId: PlayerId | undefined = undefined;

export function renderRoom() {
    const app = document.getElementById("app")!;

    app.innerHTML = `
            <div id="roomContainer" class="room-container">
                <div id="chatBox" class="chat-box">
                </div> 
                <input type="text" id="msgBox" class="input-box" placeholder="Text...">
                <input type="checkbox" name="readyBtn" id="readyBtn" class="hidden">
                <label for="readyBtn" class="scoreboard-button btn-main">Ready 0/4</label>
            </div>
    `;

    const roomContainer = document.getElementById("roomContainer")!;
    const readyBtn = document.getElementById("readyBtn") as HTMLInputElement;

    readyBtn?.addEventListener("click", () => {
        const isReady = readyBtn.checked;
        roomReady(isReady);
    });

    const chatBox = document.getElementById("chatBox");
    const msgBox = document.getElementById("msgBox") as HTMLInputElement;

    msgBox?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            roomMessage(msgBox.value.trim());
            msgBox.value = "";
        }
    });

    // roomMessaged((username, msg) => {
    //     const elem = document.createElement('div');
    //     elem.innerText = renderMessage(username, msg);
    //     chatBox?.appendChild(elem);
    // });

    roomReadied(async (readyPlayers: PlayerId[]) => {
        const count = readyPlayers.length;
        displayReadyCount(count);
        if (count === 4) {
            await navigate("game");
        }
    });

    welcome((id) => {
        userId = id;
        console.log(userId);
    });
}

function renderMessage(username: string, msg: string) {
    return `<div class="chat-message">${username}:${msg}</div>`;
}

function displayReadyCount(count: number) {
    const readyBtn = document.getElementById("readyBtn");
    if (!readyBtn) return;
    readyBtn.innerText = `Ready ${count}/4`;
}
