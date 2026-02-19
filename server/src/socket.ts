import { Server } from "socket.io";
import { Player } from "./player";
import { Suit, Rank, BoardState, CardRaw, PlayerRaw, GameConfig, Seats } from "@shared/types";
import { dealCards } from "./game";
import { Card } from "./card";
import type { ServerToClientEvents, ClientToServerEvents } from "@shared/events";
import { serializeMap } from "./utils";
import { instrument } from '@socket.io/admin-ui';
import { Room } from "./room";

const players = new Map<string, Player>();
const playedCards = new Map<string, CardRaw>();

const room = new Room("Game_1");

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
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
        cors: {
            origin: ["https://admin.socket.io"],
            credentials: true
        }
    });

    instrument(io, {
        auth: false
    });

    io.on("connection", (socket) => {

        socket.emit("welcome", socket.id);
        players.set(socket.id, new Player(socket.id));

        const seats : Seats = [socket.id, "Player2", "Player3", "Player4"];
        const pId = socket.id; 
        const team = { pId : "blue", "Player2" : "yellow", "Player3" : "blue", "Player4" : "yellow"}; 
        const gameConfig : GameConfig = {
            playerId: socket.id,
            allyId: "Player3",
            seats,
            teams : team 
        };
        socket.emit("startGame", gameConfig);
        
// export interface BoardState {
//     hand: Array<CardRaw>;
//     cardCounts: Record<string, number>;
//     turn: string,
//     playedCards: Array<[string, CardRaw]>;
// }
        const hand = [new Card(Suit.Diamonds, Rank.Ace), new Card(Suit.Clubs, Rank.Queen),
                          new Card(Suit.Clubs, Rank.Jack)  
        ].map( (c) => c.toRaw());
        const cardCounts = { "Player2" : 4, "Player3" : 5, "Player4" : 6};
        const playedCards = { pId: new Card(Suit.Clubs, Rank.Queen).toRaw(), 
            "Player3" : new Card(Suit.Spades, Rank.Jack).toRaw()
        };
        const boardState : BoardState = {
            hand: hand,
            cardCounts,
            turn: pId,
            playedCards
        }
        socket.emit("updateBoard", boardState);
        // console.log(`A user connected: ${socket}`);
        // console.log(`User id: ${socket.id}`);

        // socket.emit("welcome", socket.id);
        // players.set(socket.id, new Player(socket.id));

        // socket.emit("joinTeam", "green");

        // players.forEach(p => {
        //     if (p.id === socket.id) {
        //         let cards = flag ? cards_2 : cards_1;
        //         flag = !flag;
        //         p.dealCards(cards);
        //     }
        // });

        // const playersRaw = Array.from(players.values(), (p) => p.toRaw());
        // const boardState: BoardState = {
        //     players: playersRaw,
        //     turn: socket.id,
        //     playedCards: serializeMap(playedCards)
        // };
        // io.emit("updateBoard", boardState);
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

        // socket.on("joinRoom", (payload) => {
        //     const { roomName, teamPref } = {...payload};
        //     const player = players.get(socket.id);

        //     if (!player) {
        //         console.log(`Player not found ${socket.id}`);
        //         return;
        //     }
        //     room.join(player, teamPref as "blue" | "yellow", socket);
        //     socket.emit("joinedRoom", payload);

        //     // TODO: Add players starting game
        //     if (room.isFull()) {
        //         const playersRaw = Array.from(players.values(), (p) => p.toRaw(room));
        //         const boardState : BoardState = {
        //             players: playersRaw,
        //             turn: socket.id,
        //             playedCards: serializeMap(playedCards)
        //         }
        //         // const teams = new Record
        //         const playerIds = Array.from(players.keys());
        //         const teams = playerIds.reduce((acc, key) => {
        //             acc[key] = room.getPlayerTeam(key);
        //             return acc;
        //         }, {} as Record<string, string>) 
        //         const gameConfig : GameConfig = {
        //             playerId: socket.id,
        //             seats: room.getSeats(),
        //             teams: teams
        //         };
        //         io.to(room.name).emit("startGame", gameConfig);
        //         io.to(room.name).emit("updateBoard", boardState);
        //     }

        // });

        // socket.on("playCard", (card) => {
        //     console.log(card);
        //     players.get(socket.id)?.hand.filter((c) => c.rank !== card.rank || c.suit !== card.suit);
        //     playedCards.set(socket.id, card);
        //     const playersRaw = Array.from(players.values(), (p) => p.toRaw(room));
        //     const boardState : BoardState = {
        //         players: playersRaw,
        //         turn: socket.id,
        //         playedCards: serializeMap(playedCards)
        //     };
        //     // console.log(boardState);
        //     socket.broadcast.emit("updateBoard", boardState);
        // });

        socket.on("disconnect", () => {
            console.log(`A user disconnected: ${socket}`);
            console.log(`User id: ${socket.id}`);
            players.delete(socket.id);
        });
    });
}
