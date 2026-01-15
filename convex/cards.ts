import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByCardId = query({
  args: { cardId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cards")
      .withIndex("by_cardId", (q) => q.eq("cardId", args.cardId))
      .first();
  },
});

export const getByProfileId = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cards")
      .withIndex("by_profileId", (q) => q.eq("profileId", args.profileId))
      .collect();
  },
});

export const create = mutation({
  args: {
    cardId: v.string(),
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    // Check if cardId already exists
    const existing = await ctx.db
      .query("cards")
      .withIndex("by_cardId", (q) => q.eq("cardId", args.cardId))
      .first();

    if (existing) {
      throw new Error("Card ID already registered");
    }

    return await ctx.db.insert("cards", {
      cardId: args.cardId,
      profileId: args.profileId,
      isActive: true,
      tapCount: 0,
    });
  },
});

export const recordTap = mutation({
  args: { cardId: v.string() },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("cards")
      .withIndex("by_cardId", (q) => q.eq("cardId", args.cardId))
      .first();

    if (!card) {
      return null;
    }

    await ctx.db.patch(card._id, {
      tapCount: card.tapCount + 1,
      lastTapAt: Date.now(),
    });

    return card;
  },
});

export const deactivate = mutation({
  args: { cardId: v.string() },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("cards")
      .withIndex("by_cardId", (q) => q.eq("cardId", args.cardId))
      .first();

    if (!card) {
      throw new Error("Card not found");
    }

    await ctx.db.patch(card._id, { isActive: false });
  },
});

export const activate = mutation({
  args: { cardId: v.string() },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("cards")
      .withIndex("by_cardId", (q) => q.eq("cardId", args.cardId))
      .first();

    if (!card) {
      throw new Error("Card not found");
    }

    await ctx.db.patch(card._id, { isActive: true });
  },
});
