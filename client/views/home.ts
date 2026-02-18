import { joinedRoom, joinRoom, startGame } from "../src/socket";
import { navigate } from "../main";
import { GameConfig } from "@shared/types";

export function renderHome() {
    const app = document.getElementById("app")!;

    app.innerHTML = `        <div id="joinLobbyModal" class="modal stepper">
            <div id="joinLobbyTrack" class="stepper-track">
                <div class="step">
                    <button id="joinLobbyBtn" class="btn-main btn-slider">Join Lobby</button>
                </div>
                <div class="step">
                    <button id="joinBlueBtn" class="btn-blue">Blue</button>
                    <button id="joinYellowBtn" class="btn-yellow">Yellow</button>
                </div>
            </div>
        </div>`

    const stepper = document.getElementById("joinLobbyTrack");
    const joinLobbyBtn = document.getElementById("joinLobbyBtn");
    
    joinLobbyBtn?.addEventListener('click', () => {
        stepper?.classList.add("step-2");
    });

    const joinBlueBtn = document.getElementById("joinBlueBtn");
    const joinYellowBtn = document.getElementById("joinYellowBtn");

    joinBlueBtn?.addEventListener('click', () => {
        joinRoom("Game_1", "blue");
    });

    joinYellowBtn?.addEventListener('click', () => {
        joinRoom("Game_1", "yellow");
    });

    startGame((gameConfig: GameConfig) => {
        console.log(gameConfig);
    });
}