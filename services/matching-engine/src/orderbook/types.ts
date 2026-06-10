// shape of the order which will enter the system
export type OrderSide = "buy" | "sell";

export type OrderStatus = | "open" | "filled" | "partial" | "cancelled";

// open - sitting in teh book
// filled - the order which matched fully and  nothing left
// partial - the partially matched order and the remainder is still in book
// cancelled- manually removed order

export interface Order {
    id: string;
    symbol: string;
    side: OrderSide;
    price: number;
    quantity: number;
    filled: number;
    remaining: number;
    status: OrderStatus;
    createdAt: Date;
}

// A trade = one match event between a buy and a sell

export interface Trade {
    id: string;
    symbol: string;
    buyOrderId: string;
    sellOrderId: string;
    price: number;
    quantity: number;
    executedAt: Date;
}