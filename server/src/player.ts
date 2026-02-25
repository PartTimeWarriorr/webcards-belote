import { CardRaw, PlayerRaw } from "@shared/types";
import { Card } from "./card";
import { Room } from "./room";
export class Player {
    id: string;
    hand: Array<Card> = new Array<Card>();

    constructor(id: string) {
        this.id = id;
    }

    dealCards(cards: Array<Card>) {
        this.hand = cards;
    }

    toRaw(room?: Room): PlayerRaw {
        return {
            id: this.id,
            hand: this.hand.map((c) => c.toRaw()),
            team: room?.getPlayerTeam(this.id),
        };
    }

    hasCard(card: CardRaw): boolean {
        return this.hand.some(
            (c) => c.rank === card.rank && c.suit === card.suit,
        );
    }

    removeCard(card: CardRaw) {
        this.hand = this.hand.filter(c => c.rank !== card.rank && c.suit !== card.suit);
    }
}
