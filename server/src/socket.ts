import { Server } from "socket.io";
import { Player } from "./player";
import { Card } from "./card";
import { Suit, Rank } from "../../shared/types";

const players = new Map<string, Player>();

const deck: Array<Card> = new Array();

// Add all cards to deck
for (let s of Object.values(Suit)) {
    for (let r of Object.values(Rank).filter(
        (v): v is Rank => typeof v === "number",
    )) {
        deck.push(new Card(s, r));
    }
}

export function setupSocket(server: any) {
    const io = new Server(server);

    io.on("connection", (socket) => {
        console.log(`A user connected: ${socket}`);
        console.log(`User id: ${socket.id}`);
        players.set(socket.id, new Player(socket.id));

        setTimeout(() => {
            // console.log("aaa");
            io.to(socket.id).emit("updateHand", [
                new Card(Suit.Clubs, Rank.Ace),
            ]);
        }, 3000);

        socket.on("disconnect", () => {
            console.log(`A user disconnected: ${socket}`);
            console.log(`User id: ${socket.id}`);
            players.delete(socket.id);
        });
    });
}
