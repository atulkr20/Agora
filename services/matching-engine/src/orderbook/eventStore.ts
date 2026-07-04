import { PrismaClient, Prisma } from "@prisma/client";
import type { Order, Trade } from "./types.js";

const prisma = new PrismaClient();

// This type represents the normal prisma client or a transaction client that prisma passes inside $transaction().
// we will use this so every write method can work in both contexts (Prisma client or Transaction Client)
type PrismaTransactionClient = Prisma.TransactionClient;

export const EventStore = {

    // Write events 
    // Every write method now accepts an optional 'tx' (transaction client).
    // If tx is provided, the write happens inside that transaction 
    // if not, it uses the global prisma client as normal

    async orderPlaced(order: Order, tx?: PrismaTransactionClient): Promise<void> {
        const client = tx ?? prisma;
        await client.orderEvent.create({
            data: {
                orderId: order.id,
                symbol: order.symbol,
                eventType: "ORDER_PLACED",
                payload: order as any,
            },
            
        });
    },

    async orderPartial(order: Order, tx?: PrismaTransactionClient): Promise<void> {
        const client = tx ?? prisma;
        await client.orderEvent.create({
            data: {
                orderId: order.id,
                symbol: order.symbol,
                eventType: "ORDER_PARTIAL",
                payload: order as any,
            },
        });
    },

    async orderFilled(order: Order, tx?: PrismaTransactionClient): Promise<void> {
        const client = tx ?? prisma;
        await client.orderEvent.create({
            data: {
                orderId: order.id,
                symbol: order.symbol,
                eventType: "ORDER_FILLED",
                payload: order as any,
            },
        });
    },

    async orderCancelled(order: Order, tx?: PrismaTransactionClient): Promise<void> {
        const client = tx ?? prisma;
        await client.orderEvent.create({
            data: {
                orderId: order.id,
                symbol: order.symbol,
                eventType: "ORDER_CANCELLED",
                payload: order as any,
            },
        });
    },

    async tradeFired(trade: Trade, tx?: PrismaTransactionClient): Promise<void> {
        const client = tx ?? prisma;
        await client.trade.create({
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

    // Transactional Write ( we'll be using it inside match() )
    // we'll be wrapping trade + both fill events in a single postgres transaction.
    // All three succees or all three are rolled back. Nothing in between

    async persistMatchResult(
        trade: Trade,
        filledBid: Order,
        filledAsk: Order 
    ): Promise<void> {
        await prisma.$transaction(async (tx) => {

            // Record the trade
            await EventStore.tradeFired(trade, tx);

            // Record bid's new state (filled or partial)

            if (filledBid.status === "filled") {
                await EventStore.orderFilled(filledBid, tx);
            } else {
                await EventStore.orderPartial(filledBid, tx);
            }


            // Record ask's new state (filled or partal)
            if(filledAsk.status === "filled") {
                await EventStore.orderFilled(filledAsk, tx);
            } else {
                await EventStore.orderPartial(filledAsk, tx);
            }

            // if anything above throws error, postgres rolls back all three writes
            // and the next time match() runs, and it retries from a clean state

        });
    },

    // Read Events ------
    



    
 }