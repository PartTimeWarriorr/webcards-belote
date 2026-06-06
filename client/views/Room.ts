import {
    gameSync,
    roomJoin,
    roomMessage,
    roomMessaged,
    roomReadied,
    roomReady,
    welcome,
} from "@/socket";
import { PlayerId } from "@shared/types";
import { navigate } from "../main";

interface RoomViewElements {
    chatBox: HTMLElement;
    msgBox: HTMLInputElement;
    readyBtn: HTMLInputElement
};

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

    const elements: RoomViewElements = {
        chatBox: document.getElementById("chatBox")!,
        msgBox: document.getElementById("msgBox")! as HTMLInputElement,
        readyBtn: document.getElementById("readyBtn")! as HTMLInputElement,
    }

    attachDomListeners(elements);
    attachSocketListeners(elements);
}

function displayReadyCount(count: number) {
    const readyBtn = document.getElementById("readyBtn");
    if (!readyBtn) return;
    readyBtn.innerText = `Ready ${count}/4`;
}

function attachDomListeners(elements: RoomViewElements) {
    elements.readyBtn.addEventListener("click", () => {
        const isReady = elements.readyBtn.checked;
        roomReady(isReady);
    });

    elements.msgBox.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            roomMessage(elements.msgBox.value.trim());
            elements.msgBox.value = "";
        }
    });
}

function attachSocketListeners(elements: RoomViewElements) {
    roomMessaged((username, msg) => {
        console.log(username, msg);
        const elem = document.createElement('div');
        elem.className = "chat-message";
        elem.innerText = `${username}: ${msg}`;
        elements.chatBox.appendChild(elem);
        elements.chatBox.lastElementChild?.scrollIntoView(true);
    });

    // TODO: change
    roomReadied(async (readyPlayers: PlayerId[]) => {
        const count = readyPlayers.length;
        displayReadyCount(count);
        if (count === 4) {
            await navigate("game");
        }
    });

}