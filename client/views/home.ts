import { roomJoined, roomJoin, startGame } from "../src/socket";
import { navigate } from "../main";
import { GameConfig } from "@shared/types";
import { createRoom, getLocalUser, getRooms, getUser, login, register, Room, setUser, User } from "@/auth";

export async function renderHome() {
    const user = getLocalUser();
    if (!user) {
        await renderGuest();
    } else {
        await renderLoggedIn(user);
    }
}

async function renderLoggedIn(user: User) {
    const app = document.getElementById("app")!;

    let rooms: Room[] = [];    
    try {
        const response = await getRooms({page: "1", limit: "10"});
        rooms = response.data;
    } catch (err) {
        console.error(err);
    }
    const roomsHTML = rooms.length > 0 ? rooms.map(r => renderRoom(r)).join('') : "<div>No rooms found.</div>"
    app.innerHTML = `
        <div id="joinLobbyModal" class="modal stepper">
            <div id="joinLobbyTrack" class="stepper-track">

                <div class="step">
                    <div class="step-header">
                        <div id="backFromCreateBtn" class="btn-small">Back</div>
                        <h2>Create Room</h2>
                    </div>

                    <div class="step-content">
                        <input
                            id="roomNameInput"
                            class="input"
                            placeholder="Room name..."
                        />

                        <button id="submitCreateRoomBtn" class="btn-main">
                            Create Room
                        </button>
                    </div>
                </div>

                <div class="step step-center">
                    <button id="joinLobbyBtn" class="btn-main">
                        Join Lobby
                    </button>
                    <button id="createLobbyBtn" class="btn-main">
                        Create Lobby
                    </button>
                </div>

                <div class="step">
                    <div id="backBtn" class="btn-small">Back</div>
                    <div id="scrollBox" class="scroll-box">
                        ${roomsHTML}
                    </div>
                </div>
            </div>
        </div>
    `;

    const stepper = document.getElementById("joinLobbyTrack")!;
    const joinLobbyBtn = document.getElementById("joinLobbyBtn");
    const createLobbyBtn = document.getElementById("createLobbyBtn");
    const backBtn = document.getElementById("backBtn");
    const scrollBox = document.getElementById("scrollBox");
    const backFromCreateBtn = document.getElementById("backFromCreateBtn");

    const submitCreateRoomBtn = document.getElementById("submitCreateRoomBtn");
    const roomNameInput = document.getElementById("roomNameInput") as HTMLInputElement;

    submitCreateRoomBtn?.addEventListener("click", async () => {
        const name = roomNameInput.value.trim();
        if (!name) {
            console.error("Name empty");
            return;
        }

        try {
            const response = await createRoom({name: name});
            console.log(`Room ${response.data.name} created successfully`);
            roomJoin(name);
            await navigate("room");
        } catch (err) {
            console.error(err);
        }

    });

    const goToStep = (stepIndex: number) => {
        stepper.style.transform = `translateX(-${stepIndex * 100}%`;
    }
    goToStep(1);

    joinLobbyBtn?.addEventListener("click", () => {
        goToStep(2);
    });

    createLobbyBtn?.addEventListener("click", () => {
        goToStep(0);
    });

    backBtn?.addEventListener("click", () => {
        goToStep(1);
    });

    backFromCreateBtn?.addEventListener("click", () => {
        goToStep(1);
    });

    scrollBox?.addEventListener("click", async (e) => {
        const box = (e.target as HTMLElement).closest('.lobby-box');
        const name = box?.querySelector('.lobby-name')?.textContent;
        if (!name) {
            console.error("Cannot join");
            return;
        }
        roomJoin(name);
        await navigate("room");
    });
}

function renderRoom(room: Room) {
    return `
                        <div class="lobby-box">
                            <div class="lobby-name">${room.name}</div>
                            <div class="lobby-players">4/4</div>
                        </div>
    `;
}

async function renderGuest() {
    const app = document.getElementById("app")!;
    app.innerHTML = `
        <div id="joinLobbyModal" class="modal stepper">
                <div class="auth-grid">
                    <form id="registerForm">
                        <label for="email">Email:</label>
                        <input type="text" id="email" name="email">
                        <label for="username">Username:</label>
                        <input type="text" id="username" name="username">
                        <label for="password">Password:</label>
                        <input type="text" id="password" name="password">
                        <button id="registerBtn" class="btn-main">Register</button>
                    </form>

                    <form id="loginForm">
                        <label for="email">Email:</label>
                        <input type="text" id="email" name="email">
                        <label for="password">Password:</label>
                        <input type="text" id="password" name="password">
                        <button id="loginBtn" class="btn-main">Login</button>
                    </form>
                </div>
        </div>
    `;
    const registerForm = document.getElementById(
        "registerForm",
    ) as HTMLFormElement;
    const loginForm = document.getElementById("loginForm") as HTMLFormElement;

    registerForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = new FormData(registerForm);
        try {
            const response = await register({
                email: data.get("email") as string,
                username: data.get("username") as string,
                password: data.get("password") as string,
            });
            console.log(response.message);
        } catch (err) {
            console.error(err);
        }
    });

    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = new FormData(loginForm);
        try {
            const response = await login({
                email: data.get("email") as string,
                password: data.get("password") as string,
            });
            const user = await getUser();
            setUser(user);
            // Rerender to change UI
            renderHome();
        } catch (err) {
            console.error(err);
        }
    });
}