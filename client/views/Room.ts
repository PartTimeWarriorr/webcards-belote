import {
    emitRoomLeave,
    emitRoomMessage,
    emitRoomReady,
    onRoomMessaged,
    onRoomReadied,
    socket,
} from "@/socket";
import { PlayerId } from "@shared/types";
import { navigate } from "../main";
import { View } from "./view";

interface RoomViewElements {
    chatBox: HTMLElement;
    msgBox: HTMLInputElement;
    readyBtn: HTMLInputElement;
    quitBtn: HTMLElement;
}

interface RoomViewState {}

export class RoomView extends View<RoomViewElements, RoomViewState> {
    async setupPage() {
        const app = document.getElementById("app")!;

        app.innerHTML = `
            <div id="roomContainer" class="room-container">
                <button id="quitBtn" class="btn-square"></button>
                <div class="player-list"></div>
                <div id="chatBox" class="chat-box">
                </div> 
                <input type="text" id="msgBox" class="input-box" placeholder="Text...">
                <input type="checkbox" name="readyBtn" id="readyBtn" class="hidden">
                <label for="readyBtn" class="scoreboard-button btn-main">Ready 0/4</label>
            </div>
    `;

        this.elements = {
            chatBox: document.getElementById("chatBox")!,
            msgBox: document.getElementById("msgBox")! as HTMLInputElement,
            readyBtn: document.getElementById("readyBtn")! as HTMLInputElement,
            quitBtn: document.getElementById("quitBtn")!
        };
    }

    attachDomListeners() {
        this.elements.readyBtn.addEventListener("click", () => {
            const isReady = this.elements.readyBtn.checked;
            emitRoomReady(isReady);
        });

        this.elements.msgBox.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                emitRoomMessage(this.elements.msgBox.value.trim());
                this.elements.msgBox.value = "";
            }
        });

        this.elements.quitBtn.addEventListener("click", async () => {
            emitRoomLeave();
            await navigate("home");
        });
    }

    attachSocketListeners() {
        onRoomMessaged((username, msg) => {
            console.log(username, msg);
            const elem = document.createElement("div");
            elem.className = "chat-message";
            elem.innerText = `${username}: ${msg}`;
            this.elements.chatBox.appendChild(elem);
            this.elements.chatBox.lastElementChild?.scrollIntoView(true);
        });

        onRoomReadied(async (readyPlayers: PlayerId[]) => {
            const count = readyPlayers.length;
            this.displayReadyCount(count);
            if (count === 4) {
                await navigate("game");
            }
        });
    }

    private displayReadyCount(count: number) {
        const readyBtn = document.getElementById("readyBtn");
        if (!readyBtn) return;
        readyBtn.innerText = `Ready ${count}/4`;
    }

    detachDomListeners(): void {
        
    }

    detachSocketListeners(): void {
        socket.off("room:messaged"); 
        socket.off("room:readied");
    }
}
