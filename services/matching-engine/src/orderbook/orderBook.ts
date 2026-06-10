import { Order, Trade, OrderSide} from "./types";
import { randomUUID } from "crypto";

export class OrderBook {
    private symbol: string;

    // bids = buy orders. we need the highest price first 
    private bids: Order[] = [];

    // asks = sell order. we need the lowest price first 
    private asks: Order[] = [];

    constructor(symbol:  string) {
        this.symbol = symbol;
    }

    // Public API

    addOrder(order: Order): Trade[] {
        // validate the order belongs to this book

        if(order.symbol !== this.symbol) {
            throw new Error(
                `Order symbol ${order.symbol} does not match book symbol ${this.symbol}`
            );
        }

        if(order.side === "buy") {
            this.bids.push(order);
            this.sortBids();  // Highest bid first
        } else {
            this.asks.push(order);
            this.sortAsks(); // lowest ask first
        }

        // try to match after every new order
        return this.match();
    }

    cancelOrder(orderId: string): Order | null {
        // Try9 bids first

        const bidIndex = this.bids.findIndex((o) => o.id === orderId);
        if(bidIndex !== -1) {
            const [order] = this.bids.splice(bidIndex, 1);
            order.status = "cancelled"
            return order;
        }

        // Now asks
        const askIndex = this.asks.findIndex((o) => o.id === orderId);
        if(askIndex !== -1) {
            const [order] = this.asks.splice(askIndex, 1);
            order.status = "cancelled";
            return order;
        }

        return null; // order not found
    }

    // snapshot of the current book, this will be useful for websocket broadcasts later
    getSnapshot(): { bids: Order[]; asks: Order[]} {
        return {
            bids: [...this.bids],
            asks: [...this.asks],
        };
    }

    // Sorting

    private sortBids(): void {
        // Descending - buyer who is willing to pay the most is at index 0
        this.bids.sort((a, b) => b.price - a.price);
    }

    private sortAsks(): void {
        // Ascending - seller willing to accept the latest is at index 0
        this.asks.sort((a, b) => a.price - b.price);
    }

    // Matching Engine

    private match(): Trade[] {
        const trades: Trade[] = [];

        // keep looping as long as there are orders on both sides
        // and the best bid price >= best ask price

        while (this.bids.length > 0 && this.asks.length > 0) {
            const  bestBid = this.bids[0]; // highest buyer
            const bestAsk = this.asks[0]; // lowest buyer

            // No match possible if
            if (bestBid.price < bestAsk.price) {
                break;
            }

            // A match
            const tradeQty = Math.min(bestBid.remaining, bestAsk.remaining);

            // price convention: we'll use the resting order's price (the ask, since it was in the book first)
            const tradePrice = bestAsk.price;

            // Record the trade
            const trade: Trade = {
                id: randomUUID(),
                symbol: this.symbol,
                buyOrderId: bestBid.id,
                sellOrderId: bestAsk.id,
                price: tradePrice,
                quantity: tradeQty,
                executedAt: new Date(),
            };
            trades.push(trade);

            // update both order
            this.applyfill(bestBid, tradeQty);
            this.applyFill(bestAsk, tradeQty);

            // Remove fully filled orders from the book
            if (bestBid.remaining === 0) {
                this.bids.shift();  // remove from front
            }
            if(bestAsk.remaining === 0) {
                this.asks.shift();   // remove from front
            }
        }

        return trades;
    }

    private applyFill(order: Order,  qty: number): void {
        order.filled += qty;
        order.remaining -= qty;

        if(order.remaining === 0) {
            order.status = "filled";
        } else {
            // has been partially matched but still has the quantity left
            order.status = "partial";
        }
    }


}