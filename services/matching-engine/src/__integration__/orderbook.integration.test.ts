import { describe, test, expect, beforeEach, afterAll } from "@jest/globals";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { OrderBook } from "../orderbook/orderBook.js";
import { createOrder } from "../orderbook/orderFactory.js";
import { EventStore } from "../orderbook/eventStore.js";
import { recoverOrderBooks } from "../orderbook/recovery.js";
import "dotenv/config";

// Real Prisma client — this hits your actual Docker Postgres
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TEST_SYMBOL = "BTC-USDT";

// Before each test: wipe all rows for our test symbol so tests don't
// bleed into each other. We delete trades first because of foreign key
// considerations, then order events.
beforeEach(async () => {
  await prisma.trade.deleteMany({ where: { symbol: TEST_SYMBOL } });
  await prisma.orderEvent.deleteMany({ where: { symbol: TEST_SYMBOL } });
});

// After all tests finish: disconnect cleanly so Jest doesn't hang
afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
  await EventStore.disconnect();
});

// ─── Test 1: Basic write to real DB ───────────────────────────────

describe("EventStore writes to real Postgres", () => {
  test("orderPlaced creates a row in OrderEvent table", async () => {
    const order = createOrder({ side: "buy", price: 100, quantity: 1, symbol: TEST_SYMBOL });

    await EventStore.orderPlaced(order);

    // Go directly to Prisma to verify the row exists
    const rows = await prisma.orderEvent.findMany({
      where: { orderId: order.id },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]!.eventType).toBe("ORDER_PLACED");
    expect(rows[0]!.symbol).toBe(TEST_SYMBOL);

    // Verify payload stored correctly — we need this for replay
    const payload = rows[0]!.payload as any;
    expect(payload.id).toBe(order.id);
    expect(payload.price).toBe(100);
    expect(payload.remaining).toBe(1);
  });
});

// ─── Test 2: Full match writes trade + fill events atomically ──────

describe("persistMatchResult writes atomically", () => {
  test("a full match writes one trade row and two fill events", async () => {
    const book = new OrderBook(TEST_SYMBOL);

    const buy = createOrder({ side: "buy", price: 100, quantity: 1, symbol: TEST_SYMBOL });
    const sell = createOrder({ side: "sell", price: 100, quantity: 1, symbol: TEST_SYMBOL });

    await book.addOrder(buy);
    const trades = await book.addOrder(sell);

    expect(trades).toHaveLength(1);

    // Check trade row exists in DB
    const tradeRows = await prisma.trade.findMany({
      where: { symbol: TEST_SYMBOL },
    });
    expect(tradeRows).toHaveLength(1);
    expect(tradeRows[0]!.price).toBe(100);
    expect(tradeRows[0]!.quantity).toBe(1);

    // Check fill events exist — both orders should show ORDER_FILLED
    const fillEvents = await prisma.orderEvent.findMany({
      where: {
        symbol: TEST_SYMBOL,
        eventType: "ORDER_FILLED",
      },
    });
    expect(fillEvents).toHaveLength(2);
  });
});

// ─── Test 3: getOpenOrderEvents filters correctly ──────────────────

describe("getOpenOrderEvents", () => {
  test("returns only orders that are still open — not filled or cancelled", async () => {
    const book = new OrderBook(TEST_SYMBOL);

    // This order will be fully filled
    const buy1 = createOrder({ side: "buy", price: 100, quantity: 1, symbol: TEST_SYMBOL });
    // This order will be cancelled
    const buy2 = createOrder({ side: "buy", price: 99, quantity: 1, symbol: TEST_SYMBOL });
    // This order stays open — no matching sell
    const buy3 = createOrder({ side: "buy", price: 98, quantity: 1, symbol: TEST_SYMBOL });
    // Sell that matches buy1 only
    const sell = createOrder({ side: "sell", price: 100, quantity: 1, symbol: TEST_SYMBOL });

    await book.addOrder(buy1);
    await book.addOrder(buy2);
    await book.addOrder(buy3);
    await book.addOrder(sell); // matches buy1, fills it

    await book.cancelOrder(buy2.id); // cancel buy2

    // buy1 is filled, buy2 is cancelled — only buy3 should come back
    const openOrders = await EventStore.getOpenOrderEvents(TEST_SYMBOL);

    expect(openOrders).toHaveLength(1);
    expect(openOrders[0]!.id).toBe(buy3.id);
    expect(openOrders[0]!.price).toBe(98);
    expect(openOrders[0]!.remaining).toBe(1);
  });

  test("returns partial order with correct remaining quantity", async () => {
    const book = new OrderBook(TEST_SYMBOL);

    // Buy 3, only 1 sell available — buy ends up partial
    const buy = createOrder({ side: "buy", price: 100, quantity: 3, symbol: TEST_SYMBOL });
    const sell = createOrder({ side: "sell", price: 100, quantity: 1, symbol: TEST_SYMBOL });

    await book.addOrder(buy);
    await book.addOrder(sell);

    const openOrders = await EventStore.getOpenOrderEvents(TEST_SYMBOL);

    expect(openOrders).toHaveLength(1);
    expect(openOrders[0]!.id).toBe(buy.id);
    // After 1 filled, 2 should remain
    expect(openOrders[0]!.remaining).toBe(2);
    expect(openOrders[0]!.status).toBe("partial");
  });
});

// ─── Test 4: Full crash recovery round-trip ────────────────────────
// This is the big one — proves the entire event sourcing system works
// end to end. Simulates a crash by creating a new OrderBook instance
// (empty memory) and recovering it from DB.

describe("Crash recovery via recoverOrderBooks", () => {
  test("a fresh OrderBook recovered from DB matches the pre-crash state", async () => {
    // --- Before "crash" ---
    const bookBeforeCrash = new OrderBook(TEST_SYMBOL);

    const buy1 = createOrder({ side: "buy", price: 100, quantity: 2, symbol: TEST_SYMBOL });
    const buy2 = createOrder({ side: "buy", price: 95, quantity: 1, symbol: TEST_SYMBOL });
    const sell = createOrder({ side: "sell", price: 100, quantity: 1, symbol: TEST_SYMBOL });

    await bookBeforeCrash.addOrder(buy1); // goes in as open
    await bookBeforeCrash.addOrder(buy2); // goes in as open
    await bookBeforeCrash.addOrder(sell); // matches buy1 partially (1 of 2 filled)

    // At this point: buy1 has remaining=1 (partial), buy2 has remaining=1 (open)
    // sell is fully filled and gone

    // --- Simulate crash: create a brand new empty book ---
    const recoveredBooks = await recoverOrderBooks([TEST_SYMBOL]);
    const bookAfterCrash = recoveredBooks.get(TEST_SYMBOL)!;

    // --- Verify recovered state matches pre-crash state ---
    const snap = bookAfterCrash.getSnapshot();

    // Both buy1 (partial) and buy2 (open) should be restored
    expect(snap.bids).toHaveLength(2);

    // Best bid should be buy1 at price 100 (highest price first)
    expect(snap.bids[0]!.price).toBe(100);
    expect(snap.bids[0]!.remaining).toBe(1); // only 1 left after partial fill
    expect(snap.bids[0]!.id).toBe(buy1.id);

    // Second bid is buy2 at price 95
    expect(snap.bids[1]!.price).toBe(95);
    expect(snap.bids[1]!.remaining).toBe(1);

    // Asks should be empty — sell was fully filled
    expect(snap.asks).toHaveLength(0);
  });

  test("recovered book can continue matching new orders correctly", async () => {
    // Place an open buy before the "crash"
    const bookBeforeCrash = new OrderBook(TEST_SYMBOL);
    const buy = createOrder({ side: "buy", price: 100, quantity: 2, symbol: TEST_SYMBOL });
    await bookBeforeCrash.addOrder(buy);

    // Recover
    const recoveredBooks = await recoverOrderBooks([TEST_SYMBOL]);
    const bookAfterCrash = recoveredBooks.get(TEST_SYMBOL)!;

    // Now add a new sell against the recovered book
    const sell = createOrder({ side: "sell", price: 100, quantity: 2, symbol: TEST_SYMBOL });
    const trades = await bookAfterCrash.addOrder(sell);

    // Should match correctly against the restored buy
    expect(trades).toHaveLength(1);
    expect(trades[0]!.quantity).toBe(2);
    expect(trades[0]!.buyOrderId).toBe(buy.id);

    const snap = bookAfterCrash.getSnapshot();
    expect(snap.bids).toHaveLength(0);
    expect(snap.asks).toHaveLength(0);
  });
});