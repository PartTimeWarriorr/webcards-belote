import {
    emitRoomLeave,
    emitRoomMessage,
    emitRoomReady,
    onRoomInit,
    onRoomJoined,
    onRoomLog,
    onRoomMessaged,
    onRoomReadied,
    requestRoomInit,
    socket,
} from "@/socket";
import { PlayerId, RoomJoinedPayload } from "@shared/types";
import { navigate } from "../main";
import { View } from "./view";

interface RoomViewElements {
    chatBox: HTMLElement;
    msgBox: HTMLInputElement;
    readyBtn: HTMLInputElement;
    quitBtn: HTMLElement;
    joinedPlayers: HTMLElement;
}

interface RoomViewState {}

export class RoomView extends View<RoomViewElements, RoomViewState> {
    async setupPage() {
        const app = document.getElementById("app")!;

        app.innerHTML = `
            <div id="roomContainer" class="room-container">
                <button id="quitBtn" class="btn-square"></button>
                <div id="joinedPlayers" class="joined-tab"></div>
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
            quitBtn: document.getElementById("quitBtn")!,
            joinedPlayers: document.getElementById("joinedPlayers")!,
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
            const elem = document.createElement("div");
            elem.className = "chat-message";
            elem.textContent = `${username}: ${msg}`;
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

        onRoomJoined((payload: RoomJoinedPayload) => {
            const newPlayer = document.createElement("div");
            newPlayer.className = "joined-player";
            newPlayer.textContent = payload.player;
            this.elements.joinedPlayers.appendChild(newPlayer);
        });
        
        onRoomLog((log: string) => {
            const elem = document.createElement("div");
            elem.className = "chat-message";
            elem.textContent = log;
            this.elements.chatBox.appendChild(elem);
            this.elements.chatBox.lastElementChild?.scrollIntoView(true);
        });

        onRoomInit((payload: {messages: string[], joinedPlayers: string[]}) => {
            payload.joinedPlayers.forEach(p => {
                const newPlayer = document.createElement("div");
                newPlayer.className = "joined-player";
                newPlayer.textContent = p;
                this.elements.joinedPlayers.appendChild(newPlayer);
            });
        });

        requestRoomInit();
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
        socket.off("room:joined");
        socket.off("room:init");
        socket.off("room:log");
    }
}
