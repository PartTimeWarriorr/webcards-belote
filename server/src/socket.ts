import { Server } from "socket.io";
import { Player } from "./player";
import { Suit, Rank, BoardState, CardRaw, PlayerRaw } from "@shared/types";
import { dealCards } from "./game";
import { Card } from "./card";
import type { ServerToClientEvents, ClientToServerEvents } from "@shared/events";
import { serializeMap } from "./utils";

const players = new Map<string, Player>();
const playedCards = new Map<string, CardRaw>();

const deck: Array<Card> = new Array();

for (let s of Object.values(Suit)) {
    for (let r of Object.values(Rank)) {
        deck.push(new Card(s as Suit, r));
    }
}

const cards_1 = deck.slice(0,4);
const cards_2 = deck.slice(4, 8);
let flag = false;

// console.log(cards_1);
// console.log(cards_2);

export function setupSocket(server: any) {
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(server);

    io.on("connection", (socket) => {
        console.log(`A user connected: ${socket}`);
        console.log(`User id: ${socket.id}`);

        socket.emit("welcome", socket.id);

        players.set(socket.id, new Player(socket.id, "green"));

        socket.emit("joinTeam", "green");

        players.forEach(p => {
            if (p.id === socket.id) {
                let cards = flag ? cards_2 : cards_1;
                flag = !flag;
                p.dealCards(cards);
            }
        })

        const playersRaw = Array.from(players.values(), (p) => p.toRaw());
        const boardState: BoardState = {
            players: playersRaw,
            turn: socket.id,
            playedCards: serializeMap(playedCards)
        };
        io.emit("updateBoard", boardState);
        // console.log(boardState);

        // if (players.size === 4) {
        //     dealCards(players);
        //     const playersRaw = Array.from(players.values(), (p) => p.toRaw());
        //     const boardState: BoardState = {
        //         players: playersRaw,
        //         turn: socket.id,
        //     };
        //     io.emit("updateBoard", boardState);
        // }

        // if (players.size > 4) {
        //     players.delete(socket.id);
        // }

        socket.on("playCard", (card) => {
            console.log(card);
            players.get(socket.id)?.hand.filter((c) => c.rank !== card.rank || c.suit !== card.suit);
            playedCards.set(socket.id, card);
            const playersRaw = Array.from(players.values(), (p) => p.toRaw());
            const boardState : BoardState = {
                players: playersRaw,
                turn: socket.id,
                playedCards: serializeMap(playedCards)
            };
            // console.log(boardState);
            socket.broadcast.emit("updateBoard", boardState);
        });

        socket.on("disconnect", () => {
            console.log(`A user disconnected: ${socket}`);
            console.log(`User id: ${socket.id}`);
            players.delete(socket.id);
        });
    });
}
