import { HomeView } from "./views/home";
import { RoomView } from "./views/room";
import { GameView } from "./views/game";


type ViewKey = "home" | "room" | "game";

type ViewMap = {
    home: HomeView;
    room: RoomView;
    game: GameView;
};

const views: ViewMap = {
    home: new HomeView(),
    room: new RoomView(),
    game: new GameView(),
};

export async function navigate(pageName: ViewKey) {
    currentView?.unmount();

    currentView = views[pageName];
    await currentView.mount();
}

let currentView: ViewMap[ViewKey] | undefined = views.home;

// await currentView?.mount();
await navigate("home");
