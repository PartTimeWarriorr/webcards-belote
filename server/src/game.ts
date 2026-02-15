import { Card } from "./card";
import { Player } from "./player";
import { Suit, Rank } from "../../shared/types";

export function dealCards(players: Map<string, Player>) {
    const deck: Array<Card> = new Array();

    for (let s of Object.values(Suit)) {
        for (let r of Object.values(Rank)) {
            deck.push(new Card(s as Suit, r));
        }
    }

    deck.sort(() => Math.random() - 0.5); 
    players.forEach((pl) => {
        pl.dealCards(deck.splice(0, 8));
    });
}