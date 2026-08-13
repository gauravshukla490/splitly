import { Request, Response } from "express";
import { db } from "../../db/index.js";
import { settlements } from "../../db/schema.js";
import { eq } from "drizzle-orm";


export const createSettlement = async (req: Request, res: Response) => {
  try {
    const fromUser = req.userId!;
    const { toUser, amount, currency, note } = req.body;

    if (!toUser || !amount || !currency) {
      return res.status(400).json({ message: "toUser, amount, and currency are required" });
    }

    const [newSettlement] = await db
      .insert(settlements)
      .values({
        fromUser,
        toUser,
        amount,
        currency,
        note,
        fromConfirmed: true,
        toConfirmed: false,
      })
      .returning();

    return res.status(201).json({
      message: "Settlement recorded, awaiting confirmation",
      settlement: newSettlement,
    });
  } catch (error) {
    console.error("Create settlement error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


export const confirmSettlement = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { settlementId } = req.params;

    const [settlement] = await db
      .select()
      .from(settlements)
      .where(eq(settlements.id, settlementId))
      .limit(1);

    if (!settlement) {
      return res.status(404).json({ message: "Settlement not found" });
    }

    if (settlement.toUser !== userId) {
      return res.status(403).json({ message: "Only the recipient can confirm this settlement" });
    }

    if (settlement.toConfirmed) {
      return res.status(409).json({ message: "Already confirmed" });
    }

    await db
      .update(settlements)
      .set({ toConfirmed: true })
      .where(eq(settlements.id, settlementId));

    return res.status(200).json({ message: "Settlement confirmed" });
  } catch (error) {
    console.error("Confirm settlement error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getMySettlements = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const sent = await db
      .select()
      .from(settlements)
      .where(eq(settlements.fromUser, userId));

    const received = await db
      .select()
      .from(settlements)
      .where(eq(settlements.toUser, userId));

    return res.status(200).json({ sent, received });
  } catch (error) {
    console.error("Get settlements error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};