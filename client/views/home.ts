import { navigate } from "../main";

export function renderHome() {
    const app = document.getElementById("app")!;

    app.innerHTML = `<div class="main-menu">
        <button id="createLobbyBtn" class="btn-main">Create Lobby</button>
        <button id="joinLobbyBtn" class="btn-main">Join Lobby</button>
    </div>
    <script type="module" src="src/home.ts"></script>
    `;

    const joinLobbyBtn = document.getElementById("joinLobbyBtn");
    joinLobbyBtn?.addEventListener('click', () => {
        navigate("game");    
    });
}