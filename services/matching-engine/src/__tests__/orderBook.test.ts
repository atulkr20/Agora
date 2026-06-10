import { OrderBook } from "../orderbook/orderBook";
import { createOrder } from "../orderbook/orderFactory";

// fresh book for each test so state doesn't bleed between tests
function makeBook(): OrderBook {
  return new OrderBook("BTC-USDT");
}

//  No match scenarios 

describe("No match — spread exists", () => {
  test("buy price below ask price: no trades, both orders stay in book", () => {
    const book = makeBook();

    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    const sell = createOrder({ side: "sell", price: 110, quantity: 1 });

    const trades1 = book.addOrder(buy);
    const trades2 = book.addOrder(sell);

    expect(trades1).toHaveLength(0);
    expect(trades2).toHaveLength(0);

    const snap = book.getSnapshot();
    expect(snap.bids).toHaveLength(1);
    expect(snap.asks).toHaveLength(1);
  });
});

// Full fill 

describe("Full fill — quantities match exactly", () => {
  test("buy 1 BTC at 100, sell 1 BTC at 100: one trade, both orders filled", () => {
    const book = makeBook();

    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    const sell = createOrder({ side: "sell", price: 100, quantity: 1 });

    book.addOrder(buy);
    const trades = book.addOrder(sell);

    expect(trades).toHaveLength(1);
    expect(trades[0].quantity).toBe(1);
    expect(trades[0].price).toBe(100); // ask price used

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
  test("buy 2 BTC, sell 1 BTC: sell fully filled, buy partial", () => {
    const book = makeBook();

    const buy = createOrder({ side: "buy", price: 100, quantity: 2 });
    const sell = createOrder({ side: "sell", price: 100, quantity: 1 });

    book.addOrder(buy);
    const trades = book.addOrder(sell);

    expect(trades).toHaveLength(1);
    expect(trades[0].quantity).toBe(1);

    expect(sell.status).toBe("filled");
    expect(buy.status).toBe("partial");
    expect(buy.remaining).toBe(1); // 1 BTC still in the book

    // Buy order should still be in bids
    const snap = book.getSnapshot();
    expect(snap.bids).toHaveLength(1);
    expect(snap.asks).toHaveLength(0);
  });

  test("buy 1 BTC, sell 3 BTC: buy fully filled, sell partial", () => {
    const book = makeBook();

    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    const sell = createOrder({ side: "sell", price: 100, quantity: 3 });

    book.addOrder(buy);
    const trades = book.addOrder(sell);

    expect(trades).toHaveLength(1);
    expect(trades[0].quantity).toBe(1);

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
  test("one large buy fills multiple resting asks", () => {
    const book = makeBook();

    // Three separate sell orders resting in the book
    const sell1 = createOrder({ side: "sell", price: 99, quantity: 1 });
    const sell2 = createOrder({ side: "sell", price: 100, quantity: 1 });
    const sell3 = createOrder({ side: "sell", price: 101, quantity: 1 });

    book.addOrder(sell1);
    book.addOrder(sell2);
    book.addOrder(sell3);

    // Buy willing to pay up to 100 — should match sell1 and sell2, NOT sell3
    const buy = createOrder({ side: "buy", price: 100, quantity: 2 });
    const trades = book.addOrder(buy);

    expect(trades).toHaveLength(2);
    expect(trades[0].price).toBe(99);  // matched cheapest ask first
    expect(trades[1].price).toBe(100);

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
  test("best bid matched first — higher price wins", () => {
    const book = makeBook();

    const bid1 = createOrder({ side: "buy", price: 95, quantity: 1 });
    const bid2 = createOrder({ side: "buy", price: 100, quantity: 1 }); // better bid

    book.addOrder(bid1);
    book.addOrder(bid2);

    const sell = createOrder({ side: "sell", price: 95, quantity: 1 });
    const trades = book.addOrder(sell);

    // bid2 (100) should match, not bid1 (95) — even though bid1 was added first
    expect(trades[0].buyOrderId).toBe(bid2.id);
    expect(bid2.status).toBe("filled");
    expect(bid1.status).toBe("open"); // still in book
  });
});

// Cancel 

describe("Cancel order", () => {
  test("cancel a resting bid removes it from the book", () => {
    const book = makeBook();
    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    book.addOrder(buy);

    const cancelled = book.cancelOrder(buy.id);

    expect(cancelled).not.toBeNull();
    expect(cancelled!.status).toBe("cancelled");

    const snap = book.getSnapshot();
    expect(snap.bids).toHaveLength(0);
  });

  test("cancel non-existent order returns null", () => {
    const book = makeBook();
    const result = book.cancelOrder("does-not-exist");
    expect(result).toBeNull();
  });

  test("cancelled order cannot be matched", () => {
    const book = makeBook();
    const buy = createOrder({ side: "buy", price: 100, quantity: 1 });
    book.addOrder(buy);
    book.cancelOrder(buy.id);

    // Now add a matching sell — should produce no trades
    const sell = createOrder({ side: "sell", price: 100, quantity: 1 });
    const trades = book.addOrder(sell);

    expect(trades).toHaveLength(0);
  });
});

//  Wrong symbol 

describe("Symbol validation", () => {
  test("throws if order symbol doesn't match book symbol", () => {
    const book = makeBook(); // BTC-USDT book
    const wrongOrder = createOrder({
      side: "buy",
      price: 100,
      quantity: 1,
      symbol: "ETH-USDT", // wrong!
    });

    expect(() => book.addOrder(wrongOrder)).toThrow();
  });
});