import { roomJoined, roomJoin, startGame } from "../src/socket";
import { navigate } from "../main";
import { GameConfig } from "@shared/types";

let isAuth = false;
export function renderHome() {
    const app = document.getElementById("app")!;

    app.innerHTML = `
            <div id="joinLobbyModal" class="modal stepper">

            ${
                isAuth
                    ? `

                <div id="joinLobbyTrack" class="stepper-track">
                    <div class="step step-center">
                        <button id="joinLobbyBtn" class="btn-main">
                            Join Lobby
                        </button>
                    </div>
                    <div class="step">
                        <div id="backBtn" class="btn-small">Back</div>
                        <div class="scroll-box">
                            <div class="lobby-box">
                                <div class="lobby-name">Room</div>
                                <div class="lobby-players">4/4</div>
                            </div>
                            <div class="lobby-box">
                                <div class="lobby-name">Room</div>
                                <div class="lobby-players">4/4</div>
                            </div>
                            <div class="lobby-box">
                                <div class="lobby-name">Room</div>
                                <div class="lobby-players">4/4</div>
                            </div>
                        </div>
                    </div>
                </div>
                `
                    : `
                <button id="loginButton" class="btn-main">Login</button>
                `
            }
            </div>
    `;

    const stepper = document.getElementById("joinLobbyTrack");
    const joinLobbyBtn = document.getElementById("joinLobbyBtn");
    const backBtn = document.getElementById("backBtn");

    joinLobbyBtn?.addEventListener("click", () => {
        stepper?.classList.add("step-2");
    });

    backBtn?.addEventListener("click", () => {
        stepper?.classList.remove("step-2");
    });

    const lobbyBoxes = document.querySelectorAll(".lobby-box");
    lobbyBoxes.forEach((box) => {
        box.addEventListener("click", async () => {
            roomJoin("Game_1");
            await navigate("game");
        });
    });
}
