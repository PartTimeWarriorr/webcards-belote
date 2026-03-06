import { CardRaw, GameMode, Play, PlayerId, Rank, Seats, Suit } from "@shared/types";
import { ALL_TRUMP_POWER, ALL_TRUMP_SCORE, NO_TRUMP_POWER, NO_TRUMP_SCORE } from "./game-rules";
import { Player } from "./player";

export class GameEngine {

    deck: CardRaw[] = [];
    mode: GameMode;
    seats: Seats;
    playedCards: Array<Play>;
    hands: Record<PlayerId, CardRaw[]>;
    turn: PlayerId = "";
    // players: Map<PlayerId, Player> = new Map();

    // TODO: use composition in room class
    constructor(mode: GameMode, seats: Seats) {
        this.mode = mode;
        this.seats = seats;
        this.playedCards = [];
        this.turn = seats[0];

        this.loadDeck();
        this.hands = {};
        this.deal();
    }

    private loadDeck() {
        for (let s of Object.values(Suit)) {
            for (let r of Object.values(Rank)) {
                this.deck.push({ rank: r, suit: s });
            }
        }
        this.deck.sort(() => Math.random() - 0.5); 
    }

    private deal() {
        this.seats.forEach((pid) => {
            this.hands[pid] = this.deck.splice(0, 8);
        });
    }

    playCard(pid: PlayerId, card: CardRaw): boolean {
        if (!this.hasCard(pid, card)) {
            throw new Error(`Player ${pid} does not hold this card`);
        }

        if (!this.canPlay(pid, card)) {
            return false;
        }

        const hand = this.hands[pid];
        const index = hand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
        hand.splice(index, 1);

        this.playedCards.push({ player: pid, card: card});
        return true;
    }

    private canPlay(playerId: PlayerId, card: CardRaw): boolean {
        if (this.turn !== playerId) return false;

        if (this.playedCards.length === 0) return true;

        const { player: trickPlayer, card: trickCard } = this.playedCards[0];
        const ownTeamTrick = this.isSameTeam(playerId, trickPlayer);
        const trickSuit = trickCard.suit;

        switch (this.mode) {
            case GameMode.ALL_TRUMP:
                if (this.hasSuit(playerId, trickSuit) && card.suit !== trickSuit) return false;

                const highest = this.getHighestCard();
                if (this.getCardPower(highest) > this.getCardPower(card) && this.hasHigher(playerId, highest)) return false;

                return true;
            case GameMode.NO_TRUMP:
                if (this.hasSuit(playerId, trickSuit) && card.suit !== trickSuit) return false;
                return true;
        }
    }

    private getHighestCard(): CardRaw {
        const cards = this.playedCards.map(p => p.card); 
        cards.sort((a, b) => this.getCardPower(b) - this.getCardPower(a));
        return cards[0];
    }

    private isSameTeam(pid_1: PlayerId, pid_2: PlayerId): boolean {
        const ind_1 = this.seats.indexOf(pid_1);
        const ind_2 = this.seats.indexOf(pid_2);

        return Math.abs(ind_1 - ind_2) === 2;
    }

    private hasCard(pid: PlayerId, card: CardRaw): boolean {
        return this.hands[pid].some(c => c.rank === card.rank && c.suit === card.suit); 
    }

    private hasSuit(playerId: PlayerId, suit: Suit): boolean {
        return this.hands[playerId].some(c => c.suit === suit);
    }

    private hasHigher(playerId: PlayerId, card: CardRaw): boolean {
        return this.hands[playerId].some(c => this.getCardPower(c) > this.getCardPower(card));
    }

    private getCardPower(card: CardRaw): number {
        switch (this.mode) {
            case GameMode.ALL_TRUMP:
                return ALL_TRUMP_POWER[card.rank];
            case GameMode.NO_TRUMP:
                return NO_TRUMP_POWER[card.rank]; 
            default:
                return 0;
        } 
    }

    private getCardScore(card: CardRaw): number {
        switch (this.mode) {
            case GameMode.ALL_TRUMP:
                return ALL_TRUMP_SCORE[card.rank];
            case GameMode.NO_TRUMP:
                return NO_TRUMP_SCORE[card.rank]; 
            default:
                return 0;
        } 
    }

}