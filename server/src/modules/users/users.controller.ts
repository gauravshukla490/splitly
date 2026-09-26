import { Request, Response } from "express";
import { and, ilike, ne, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { getUserById, publicUser } from "../../utils/ledger.js";

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.userId!);
    if (!user) return res.status(404).json({ message: "User Not Found" });
    return res.status(200).json({ user: publicUser(user) });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Search other users by name or email
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = String(req.query.query ?? "").trim();

    // Don't search if the query is too short
    if (query.length < 2) return res.status(200).json({ users: [] });

    const pattern = `%${query}%`;
    const found = await db
      .select()
      .from(users)
      .where(
        and(
          ne(users.id, req.userId!),
          or(ilike(users.name, pattern), ilike(users.email, pattern))
        )
      );

    return res.status(200).json({ users: found.map(publicUser) });
  } catch (error) {
    console.error("Search users error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
