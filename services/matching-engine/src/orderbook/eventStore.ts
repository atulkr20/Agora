import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import type { Order, Trade } from "./types.js";
import "dotenv/config"; // Ensure dotenv loads DATABASE_URL

// This is the connection to postgres, here we will create one instance and use it everywhere
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const EventStore = {

    // Writing events


    // call this when an order is placed
    async orderPlaced(order: Order): Promise<void> {
        await prisma.orderEvent.create({
            data: {
                orderId: order.id,
                symbol: order.symbol,
                eventType: "ORDER_PLACED",
                payload: order as any, // store the full order object as JSON
            },
        });
    },


    // Call this when an order gets partially filled
    async orderPartial(order: Order): Promise<void> {
        await prisma.orderEvent.create({
            data: {
                orderId: order.id,
                symbol: order.symbol,
                eventType: "ORDER_PARTIAL",
                payload: order as any,
            },
        });
    },

    // call this when an order is fully filled
    async orderFilled(order: Order): Promise<void> {
        await prisma.orderEvent.create({
            data: {
                orderId: order.id,
                symbol: order.symbol,
                eventType: "ORDER_FILLED",
                payload: order as any,
            },
        });
    },

    // Call this when an order is cancelled 
    async orderCancelled(order: Order): Promise<void> {
        await prisma.orderEvent.create({
            data: {
                orderId: order.id,
                symbol: order.symbol,
                eventType: "ORDER_CANCELLED",
                payload: order as any,
            },
        });
    },

    // Call this when two orders match and a trade happens
    async tradeFired(trade: Trade): Promise<void> {
        await prisma.trade.create({
            data: {
                id: trade.id,
                symbol: trade.symbol,
                buyOrderId: trade.buyOrderId,
                sellOrderId: trade.sellOrderId,
                price: trade.price,
                quantity: trade.quantity,
                executedAt: trade.executedAt,
            },
        });
    },


    // Now reading events
    // Here we will return all ORDER_PLACED events for a symbol that were never fully filled or cancelled
    // We neeed to repllay these into the in-memory book on restart

    async getOpenOrderEvents(symbol: string): Promise<Order[]> {
        // here we will not replay the orders which is fully filled or cancelled

        const terminalEvents = await prisma.orderEvent.findMany({
            where: {
                symbol,
                eventType: { in: ["ORDER_FILLED", "ORDER_CANCELLED"]},
            },
            select: { orderId: true },  // we only need the IDs, not full rows
        });

        // Here we will build a set of terminal orderIds for fast lookup,
        // A set lets us check " is this ID in the set" in O(1) time
        const terminalIds = new Set(terminalEvents.map((e) => e.orderId));

        // Now we wil get the latest event for every order this symbol
        const allEvents = await prisma.orderEvent.findMany({
            where: { symbol },
            orderBy: { createdAt: "asc" }, // object first so that we can process in order
        });

        // Here we keep only the most recent event per orderId
        // we use a map here: Key = orderID, value = latest event 
        // Each iteration overwrites the previous entry so we end up with only the last event per order

        const latestEventPerOrder = new Map<string, typeof allEvents[0]>();
        for (const event of allEvents) {
            latestEventPerOrder.set(event.orderId, event);
        }

        // filter out terminal orders and extract the order from paylaod
        const openOrders: Order[] = [];

        for (const [orderId, event] of latestEventPerOrder) {
            // Skip orders tat are fully filled or cancelled 
            if(terminalIds.has(orderId)) continue;

            // The payload column holds the full order objects we stored as JSON
            //we cast it back to order shape here
            const order = event.payload as unknown as Order;

            // restore the Date object - JSON serialization turns date into strings
            order.createdAt = new Date(order.createdAt);

            openOrders.push(order);
        }

        return openOrders;
    },

    // Clean Disconnect - we'll call this when the processes shuts down
    async disconnect(): Promise<void> {
        await prisma.$disconnect();
    },

};