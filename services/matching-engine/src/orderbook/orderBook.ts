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

    
}