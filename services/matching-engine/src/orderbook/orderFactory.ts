import type { Order, OrderSide } from "./types";
import { randomUUID } from "crypto";

interface CreateOrderParams {
  symbol?: string;
  side: OrderSide;
  price: number;
  quantity: number;
}

export function createOrder(params: CreateOrderParams): Order {
  return {
    id: randomUUID(),
    symbol: params.symbol ?? "BTC-USDT",
    side: params.side,
    price: params.price,
    quantity: params.quantity,
    filled: 0,
    remaining: params.quantity, // starts equal to quantity
    status: "open",
    createdAt: new Date(),
  };
}