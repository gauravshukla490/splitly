import { Request, Response } from "express";
import { db } from "../../db";
import { groups, groupMember, users } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export const createGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, groupPhoto, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const [newGroup] = await db
      .insert(groups)
      .values({ name, groupPhoto, createdBy: userId, isOneOnOne: false })
      .returning();

    const memberRows = [{ groupId: newGroup.id, userId }];

    if (Array.isArray(memberIds)) {
      for (const id of memberIds) {
        if (id !== userId) {
          memberRows.push({ groupId: newGroup.id, userId: id });
        }
      }
    }

    await db.insert(groupMember).values(memberRows);

    return res.status(201).json({ message: "Group created", group: newGroup });
  } catch (error) {
    console.error("Create group error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const addMember = async (req: Request, res: Response) => {
  try {
    const requesterId = req.userId!;
    const { groupId } = req.params;
    const { userId: newMemberId } = req.body;

    if (!newMemberId) {
      return res.status(400).json({ message: "userId to add is required" });
    }

    const [requesterMembership] = await db
      .select()
      .from(groupMember)
      .where(
        and(
          eq(groupMember.groupId, groupId),
          eq(groupMember.userId, requesterId),
          eq(groupMember.isActive, true)
        )
      )
      .limit(1);

    if (!requesterMembership) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const [existingRow] = await db
      .select()
      .from(groupMember)
      .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, newMemberId)))
      .limit(1);

    if (existingRow) {
      if (existingRow.isActive) {
        return res.status(409).json({ message: "User is already a member" });
      }
      await db
        .update(groupMember)
        .set({ isActive: true })
        .where(eq(groupMember.id, existingRow.id));
    } else {
      await db.insert(groupMember).values({ groupId, userId: newMemberId });
    }

    return res.status(200).json({ message: "Member added" });
  } catch (error) {
    console.error("Add member error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const requesterId = req.userId!;
    const { groupId, memberId } = req.params;

    const [requesterMembership] = await db
      .select()
      .from(groupMember)
      .where(
        and(
          eq(groupMember.groupId, groupId),
          eq(groupMember.userId, requesterId),
          eq(groupMember.isActive, true)
        )
      )
      .limit(1);

    if (!requesterMembership) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    await db
      .update(groupMember)
      .set({ isActive: false })
      .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, memberId)));

    return res.status(200).json({ message: "Member removed" });
  } catch (error) {
    console.error("Remove member error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const leaveGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { groupId } = req.params;

    await db
      .update(groupMember)
      .set({ isActive: false })
      .where(and(eq(groupMember.groupId, groupId), eq(groupMember.userId, userId)));

    return res.status(200).json({ message: "You have left the group" });
  } catch (error) {
    console.error("Leave group error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getGroupDetails = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const members = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        profilePhotoUrl: users.profilePhotoUrl,
      })
      .from(groupMember)
      .innerJoin(users, eq(groupMember.userId, users.id))
      .where(and(eq(groupMember.groupId, groupId), eq(groupMember.isActive, true)));

    return res.status(200).json({ group, members });
  } catch (error) {
    console.error("Get group details error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};