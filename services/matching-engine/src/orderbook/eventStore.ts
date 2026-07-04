import { PrismaClient, Prisma } from "@prisma/client";
import { Order, Trade } from "./types.js";

const prisma = new PrismaClient();

// This ttype represents the normal prisma client or a transaction client that prisma passes inside $transaction().
// we will use this so every write method can work in both context ( Prisma client or Transaction CLient)

type PrismaTransactionClient = Omit<
PrismaClient,
"$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "extends"
>;

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

    
 }