import {
    connectSocket,
    emitRoomJoin,
    onRoomJoined,
    onWelcome,
    socket,
} from "../src/socket";
import { navigate } from "../main";
import { GameConfig, PlayerId, RoomJoinedPayload } from "@shared/types";
import {
    createRoom,
    getLocalUser,
    getRooms,
    getUser,
    login,
    register,
    Room,
    setUser,
    User,
} from "@/api";
import { View } from "./view";

export let userId: PlayerId | undefined = undefined;
const ROOMS_LIMIT: number = 10;

interface HomeViewElements {
    // Guest
    registerForm?: HTMLFormElement;
    loginForm?: HTMLFormElement;
    // Logged in
    stepper?: HTMLElement;
    joinLobbyBtn?: HTMLElement;
    createLobbyBtn?: HTMLElement;
    backBtn?: HTMLElement;
    scrollBox?: HTMLElement;
    backFromCreateBtn?: HTMLElement;
    submitCreateRoomBtn?: HTMLElement;
    roomNameInput?: HTMLInputElement;
    roomsNextBtn?: HTMLElement,
    roomsPrevBtn?: HTMLElement,
    roomsPageLabel?: HTMLElement,
    roomsSearchBar?: HTMLInputElement,
}

interface HomeViewState {
    roomsPage: number,
    roomsSearchFilter: string,
}

export class HomeView extends View<HomeViewElements, HomeViewState> {
    async setupPage() {
        const user = getLocalUser();
        if (!user) {
            await this.setupPageGuest();
        } else {
            await this.setupPageUser(user);
        }
    }

    async setupPageGuest() {
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

        this.elements = {
            registerForm: document.getElementById(
                "registerForm",
            ) as HTMLFormElement,
            loginForm: document.getElementById("loginForm") as HTMLFormElement,
        };
    }

    async setupPageUser(user: User) {
        const app = document.getElementById("app")!;

        this.viewState = {
            roomsPage: 1,
            roomsSearchFilter: "",
        }

        let rooms: Room[] = [];
        try {
            const response = await getRooms({ page: this.viewState.roomsPage.toString(), limit: ROOMS_LIMIT.toString(), name: this.viewState.roomsSearchFilter });
            rooms = response.data;
        } catch (err) {
            console.error(err);
        }
        const roomsHTML =
            rooms.length > 0
                ? rooms.map((r) => this.renderRoom(r)).join("")
                : "<div>No rooms found.</div>";
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
                    <div class="step-header">
                        <div id="backBtn" class="btn-small">Back</div>
                        <input id="roomsSearchBar" class="input input-box" placeholder="Search by name...">
                    </div>
                    <div id="scrollBox" class="scroll-box">
                        ${roomsHTML}
                    </div>
                    <div class="pagination-controls">
                        <button id="roomsPrevBtn" class="btn-main pagination-btn">
                            ← Previous
                        </button>

                        <span class="pagination-page">
                            Page ${this.viewState.roomsPage}
                        </span>

                        <button id="roomsNextBtn" class="btn-main pagination-btn">
                            Next →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

        this.elements = {
            stepper: document.getElementById("joinLobbyTrack")!,
            joinLobbyBtn: document.getElementById("joinLobbyBtn")!,
            createLobbyBtn: document.getElementById("createLobbyBtn")!,
            backBtn: document.getElementById("backBtn")!,
            scrollBox: document.getElementById("scrollBox")!,
            backFromCreateBtn: document.getElementById("backFromCreateBtn")!,
            submitCreateRoomBtn: document.getElementById(
                "submitCreateRoomBtn",
            )!,
            roomNameInput: document.getElementById(
                "roomNameInput",
            )! as HTMLInputElement,
            roomsNextBtn: document.getElementById("roomsNextBtn")!,
            roomsPrevBtn: document.getElementById("roomsPrevBtn")!,
            roomsPageLabel: document.querySelector(".pagination-page")!,
            roomsSearchBar: document.getElementById("roomsSearchBar")! as HTMLInputElement,
        };
    }

    private renderRoom(room: Room) {
        return `
                            <div class="lobby-box">
                                <div class="lobby-name">${room.name}</div>
                                <div class="lobby-players">4/4</div>
                            </div>
        `;
    }

    attachDomListeners(): void {
        const user = getLocalUser();
        console.log(user);
        if (!user) {
            if (!this.elements.loginForm || !this.elements.registerForm)
                throw new Error("Missing DOM elements");
            this.elements.registerForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const data = new FormData(this.elements.registerForm);
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

            this.elements.loginForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const data = new FormData(this.elements.loginForm);
                try {
                    const response = await login({
                        email: data.get("email") as string,
                        password: data.get("password") as string,
                    });
                    const user = await getUser();
                    setUser(user);
                    // Rerender to change UI
                    await navigate("home");
                    // await this.unmount();
                    // await this.mount();
                } catch (err) {
                    console.error(err);
                }
            });
        } else {
            if (
                !this.elements.stepper ||
                !this.elements.joinLobbyBtn ||
                !this.elements.createLobbyBtn ||
                !this.elements.backBtn ||
                !this.elements.scrollBox ||
                !this.elements.backFromCreateBtn ||
                !this.elements.submitCreateRoomBtn ||
                !this.elements.roomNameInput
            )
                throw new Error("Missing DOM elements");

            this.elements.submitCreateRoomBtn.addEventListener(
                "click",
                async () => {
                    const name = this.elements.roomNameInput?.value.trim();
                    if (!name) {
                        console.error("Name empty");
                        return;
                    }

                    try {
                        const response = await createRoom({ name: name });
                        console.log(
                            `Room ${response.data.name} created successfully`,
                        );
                        connectSocket();
                        emitRoomJoin(name);
                    } catch (err) {
                        console.error(err);
                    }
                },
            );

            const goToStep = (stepIndex: number) => {
                this.elements.stepper!.style.transform = `translateX(-${stepIndex * 100}%`;
            };
            goToStep(1);

            this.elements.joinLobbyBtn.addEventListener("click", () => {
                goToStep(2);
            });

            this.elements.createLobbyBtn.addEventListener("click", () => {
                goToStep(0);
            });

            this.elements.backBtn.addEventListener("click", () => {
                goToStep(1);
            });

            this.elements.backFromCreateBtn.addEventListener("click", () => {
                goToStep(1);
            });

            this.elements.scrollBox.addEventListener("click", async (e) => {
                const box = (e.target as HTMLElement).closest(".lobby-box");
                const name = box?.querySelector(".lobby-name")?.textContent;
                if (!name) {
                    console.error("Cannot join");
                    return;
                }
                connectSocket();
                emitRoomJoin(name);
            });

            this.elements.roomsSearchBar?.addEventListener("keydown", async (e) => {
                if (e.key === "Enter") {
                    
                }
            });

            this.elements.roomsNextBtn?.addEventListener("click", async () => {
                let rooms: Room[] = [];
                try {
                    const response = await getRooms({ page: (++this.viewState.roomsPage).toString(), limit: ROOMS_LIMIT.toString(), name: this.viewState.roomsSearchFilter});
                    rooms = response.data;
                } catch (err) {
                    console.error(err);
                }
                const roomsHTML =
                    rooms.length > 0
                        ? rooms.map((r) => this.renderRoom(r)).join("")
                        : "<div>No rooms found.</div>";
                this.elements.scrollBox!.innerHTML = roomsHTML;
                this.elements.roomsPageLabel!.textContent = `Page ${this.viewState.roomsPage}`;
            });

            this.elements.roomsPrevBtn?.addEventListener("click", async () => {
                if (this.viewState.roomsPage === 1) return;
                let rooms: Room[] = [];
                try {
                    const response = await getRooms({ page: (--this.viewState.roomsPage).toString(), limit: ROOMS_LIMIT.toString(), name: this.viewState.roomsSearchFilter});
                    rooms = response.data;
                } catch (err) {
                    console.error(err);
                }
                const roomsHTML =
                    rooms.length > 0
                        ? rooms.map((r) => this.renderRoom(r)).join("")
                        : "<div>No rooms found.</div>";
                this.elements.scrollBox!.innerHTML = roomsHTML;
                this.elements.roomsPageLabel!.textContent = `Page ${this.viewState.roomsPage}`;
            })
        }
    }

    attachSocketListeners(): void {
        const user = getLocalUser();
        if (user) {
            onRoomJoined(async (payload: RoomJoinedPayload) => {
                if (payload.isGameActive) {
                    console.log("Joining game");
                    await navigate("game");
                } else {
                    console.log("Joining room");
                    await navigate("room");
                }
            });

            onWelcome((id) => {
                userId = id;
                console.log(userId);
            });
        }
    }

    detachDomListeners(): void {
    }

    detachSocketListeners(): void {
        socket.off("room:joined");
        socket.off("welcome");
    }
}
