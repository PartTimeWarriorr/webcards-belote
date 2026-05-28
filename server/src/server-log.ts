import { Bid, Card, GameMode, Move, Play, PlayerId } from "@shared/types";

export class ServerLogger {
    public log(msg: string) {
        console.log(msg);
    }

    public logMove(move: Move, player: PlayerId) {
        switch(move.type) {
            case 'BID': {
                console.log(`Player ${player} made a ${move.type}. bid: ${this.stringifyBid(move.bid)}`);
                break;
            }
            case 'PLAY': {
                console.log(`Player ${player} played ${this.stringifyCard(move.card)}`);
                break;
            }
        }
    }

    private stringifyBid(bid: Bid): string {
        switch(bid.mode) {
            case GameMode.ALL_TRUMP:
            case GameMode.NO_TRUMP: {
                return `{mode: ${bid.mode}, modifier: ${bid.modifier ?? 0}`
            }
            case GameMode.TRUMP: {
                return `{mode: ${bid.mode}, trump: ${bid.trump}, modifier: ${bid.modifier ?? 0}`
            }
        }
    }

    private stringifyCard(card: Card): string {
        return `${card.rank} of ${card.suit}`;
    }
}