import { jest, describe, test, expect } from "@jest/globals";

// Mock EventStore BEFORE importing OrderBook (ESM requires this order)
jest.unstable_mockModule("../orderbook/eventStore.js", () => ({
  EventStore: {
    orderPlaced: jest.fn().mockResolvedValue(undefined),
    orderPartial: jest.fn().mockResolvedValue(undefined),
    orderFilled: jest.fn().mockResolvedValue(undefined),
    orderCancelled: jest.fn().mockResolvedValue(undefined),
    tradeFired: jest.fn().mockResolvedValue(undefined),
    getOpenOrderEvents: jest.fn().mockResolvedValue([]),
    disconnect: jest.fn().mockResolvedValue(undefined),
  },
}));

const { OrderBook } = await import("../orderbook/orderBook.js");
const { createOrder } = await import("../orderbook/orderFactory.js");
const { EventStore } = await import("../orderbook/eventStore.js") as any;

// Clear mock call counts between tests so they don't bleed
beforeEach(() => {
  jest.clearAllMocks();
});

// fresh book for each test so state doesn't bleed between tests
function makeBook() {
  return new OrderBook("BTC-USDT");
}

//  No match scenarios 

describe("No match — spread exists", () => {
  test("buy price below ask price: no trades, both orders stay in book", async () => {
    const book = makeBook();

    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    const sell = createOrder({ side: "sell", price: 110, quantity: 1 });

    const trades1 = await book.addOrder(buy);
    const trades2 = await book.addOrder(sell);

    expect(trades1).toHaveLength(0);
    expect(trades2).toHaveLength(0);

    const snap = book.getSnapshot();
    expect(snap.bids).toHaveLength(1);
    expect(snap.asks).toHaveLength(1);
  });
});

// Full fill 

describe("Full fill — quantities match exactly", () => {
  test("buy 1 BTC at 100, sell 1 BTC at 100: one trade, both orders filled", async () => {
    const book = makeBook();

    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    const sell = createOrder({ side: "sell", price: 100, quantity: 1 });

    await book.addOrder(buy);
    const trades = await book.addOrder(sell);

    expect(trades).toHaveLength(1);
    expect(trades[0]!.quantity).toBe(1);
    expect(trades[0]!.price).toBe(100); // ask price used

    expect(buy.status).toBe("filled");
    expect(buy.remaining).toBe(0);
    expect(sell.status).toBe("filled");
    expect(sell.remaining).toBe(0);

    // Book should be empty
    const snap = book.getSnapshot();
    expect(snap.bids).toHaveLength(0);
    expect(snap.asks).toHaveLength(0);
  });
});

//  Partial fill 

describe("Partial fill", () => {
  test("buy 2 BTC, sell 1 BTC: sell fully filled, buy partial", async () => {
    const book = makeBook();

    const buy = createOrder({ side: "buy", price: 100, quantity: 2 });
    const sell = createOrder({ side: "sell", price: 100, quantity: 1 });

    await book.addOrder(buy);
    const trades = await book.addOrder(sell);

    expect(trades).toHaveLength(1);
    expect(trades[0]!.quantity).toBe(1);

    expect(sell.status).toBe("filled");
    expect(buy.status).toBe("partial");
    expect(buy.remaining).toBe(1); // 1 BTC still in the book

    // Buy order should still be in bids
    const snap = book.getSnapshot();
    expect(snap.bids).toHaveLength(1);
    expect(snap.asks).toHaveLength(0);
  });

  test("buy 1 BTC, sell 3 BTC: buy fully filled, sell partial", async () => {
    const book = makeBook();

    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    const sell = createOrder({ side: "sell", price: 100, quantity: 3 });

    await book.addOrder(buy);
    const trades = await book.addOrder(sell);

    expect(trades).toHaveLength(1);
    expect(trades[0]!.quantity).toBe(1);

    expect(buy.status).toBe("filled");
    expect(sell.status).toBe("partial");
    expect(sell.remaining).toBe(2);

    const snap = book.getSnapshot();
    expect(snap.bids).toHaveLength(0);
    expect(snap.asks).toHaveLength(1);
  });
});

//  Multiple matches in one shot 

describe("Multiple matches", () => {
  test("one large buy fills multiple resting asks", async () => {
    const book = makeBook();

    // Three separate sell orders resting in the book
    const sell1 = createOrder({ side: "sell", price: 99, quantity: 1 });
    const sell2 = createOrder({ side: "sell", price: 100, quantity: 1 });
    const sell3 = createOrder({ side: "sell", price: 101, quantity: 1 });

    await book.addOrder(sell1);
    await book.addOrder(sell2);
    await book.addOrder(sell3);

    // Buy willing to pay up to 100 — should match sell1 and sell2, NOT sell3
    const buy = createOrder({ side: "buy", price: 100, quantity: 2 });
    const trades = await book.addOrder(buy);

    expect(trades).toHaveLength(2);
    expect(trades[0]!.price).toBe(99);  // matched cheapest ask first
    expect(trades[1]!.price).toBe(100);

    expect(buy.status).toBe("filled");
    expect(sell1.status).toBe("filled");
    expect(sell2.status).toBe("filled");
    expect(sell3.status).toBe("open"); // untouched

    const snap = book.getSnapshot();
    expect(snap.asks).toHaveLength(1); // sell3 still resting
  });
});

//  Price-time priority (sorting) 

describe("Price priority", () => {
  test("best bid matched first — higher price wins", async () => {
    const book = makeBook();

    const bid1 = createOrder({ side: "buy", price: 95, quantity: 1 });
    const bid2 = createOrder({ side: "buy", price: 100, quantity: 1 }); // better bid

    await book.addOrder(bid1);
    await book.addOrder(bid2);

    const sell = createOrder({ side: "sell", price: 95, quantity: 1 });
    const trades = await book.addOrder(sell);

    // bid2 (100) should match, not bid1 (95) — even though bid1 was added first
    expect(trades[0]!.buyOrderId).toBe(bid2.id);
    expect(bid2.status).toBe("filled");
    expect(bid1.status).toBe("open"); // still in book
  });
});

// Cancel 

describe("Cancel order", () => {
  test("cancel a resting bid removes it from the book", async () => {
    const book = makeBook();
    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    await book.addOrder(buy);

    const cancelled = await book.cancelOrder(buy.id);

    expect(cancelled).not.toBeNull();
    expect(cancelled!.status).toBe("cancelled");

    const snap = book.getSnapshot();
    expect(snap.bids).toHaveLength(0);
  });

  test("cancel non-existent order returns null", async () => {
    const book = makeBook();
    const result = await book.cancelOrder("does-not-exist");
    expect(result).toBeNull();
  });

  test("cancelled order cannot be matched", async () => {
    const book = makeBook();
    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    await book.addOrder(buy);
    await book.cancelOrder(buy.id);

    // Now add a matching sell — should produce no trades
    const sell = createOrder({ side: "sell", price: 100, quantity: 1 });
    const trades = await book.addOrder(sell);

    expect(trades).toHaveLength(0);
  });
});

//  Wrong symbol 

describe("Symbol validation", () => {
  test("throws if order symbol doesn't match book symbol", async () => {
    const book = makeBook(); // BTC-USDT book
    const wrongOrder = createOrder({
      side: "buy",
      price: 100,
      quantity: 1,
      symbol: "ETH-USDT", // wrong!
    });

    await expect(book.addOrder(wrongOrder)).rejects.toThrow();
  });
});

// ─── EventStore integration contract ──────────────────────────────
// These tests don't care about matching logic — they only verify
// that OrderBook is actually calling EventStore at the right moments.
// This is what protects us if someone accidentally deletes a write call.

describe("EventStore calls", () => {
  test("addOrder calls EventStore.orderPlaced exactly once with the order", async () => {
    const book = makeBook();
    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });

    await book.addOrder(buy);

    expect(EventStore.orderPlaced).toHaveBeenCalledTimes(1);
    expect(EventStore.orderPlaced).toHaveBeenCalledWith(buy);
  });

  test("a full fill calls tradeFired once and orderFilled for both sides", async () => {
    const book = makeBook();
    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    const sell = createOrder({ side: "sell", price: 100, quantity: 1 });

    await book.addOrder(buy);
    await book.addOrder(sell);

    expect(EventStore.tradeFired).toHaveBeenCalledTimes(1);

    // Both orders ended up fully filled, so orderFilled should fire for each
    expect(EventStore.orderFilled).toHaveBeenCalledTimes(2);
    expect(EventStore.orderFilled).toHaveBeenCalledWith(buy);
    expect(EventStore.orderFilled).toHaveBeenCalledWith(sell);

    // Neither was a partial fill, so orderPartial should never fire here
    expect(EventStore.orderPartial).not.toHaveBeenCalled();
  });

  test("a partial fill calls orderPartial for the side with quantity left over", async () => {
    const book = makeBook();
    const buy = createOrder({ side: "buy", price: 100, quantity: 2 });
    const sell = createOrder({ side: "sell", price: 100, quantity: 1 });

    await book.addOrder(buy);
    await book.addOrder(sell);

    // sell filled completely, buy has 1 left over — it's "partial"
    expect(EventStore.orderFilled).toHaveBeenCalledWith(sell);
    expect(EventStore.orderPartial).toHaveBeenCalledWith(buy);
  });

  test("cancelOrder calls EventStore.orderCancelled with the cancelled order", async () => {
    const book = makeBook();
    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    await book.addOrder(buy);

    await book.cancelOrder(buy.id);

    expect(EventStore.orderCancelled).toHaveBeenCalledTimes(1);
    // by the time this is called, status should already be "cancelled"
    expect(EventStore.orderCancelled).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled" })
    );
  });

  test("a no-match scenario never calls tradeFired or any fill event", async () => {
    const book = makeBook();
    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    const sell = createOrder({ side: "sell", price: 110, quantity: 1 });

    await book.addOrder(buy);
    await book.addOrder(sell);

    expect(EventStore.tradeFired).not.toHaveBeenCalled();
    expect(EventStore.orderFilled).not.toHaveBeenCalled();
    expect(EventStore.orderPartial).not.toHaveBeenCalled();
  });
});