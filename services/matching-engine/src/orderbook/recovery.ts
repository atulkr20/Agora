import { OrderBook } from "./orderBook.js";
import { EventStore } from "./eventStore.js";
import type { Order } from "./types.js";

export async function recoverOrderBooks(
  symbols: string[]
): Promise<Map<string, OrderBook>> {
  const books = new Map<string, OrderBook>();
  for (const symbol of symbols) {
    const book = new OrderBook(symbol);
    const openOrders = await EventStore.getOpenOrderEvents(symbol);
    book.loadOrders(openOrders);
    books.set(symbol, book);
  }
  return books;
}
