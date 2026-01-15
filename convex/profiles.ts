import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate short random ID (6 chars)
function generateShortId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getById = query({
  args: { id: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("profiles").collect();
  },
});

export const create = mutation({
  args: {
    slug: v.string(),
    displayName: v.string(),
    title: v.optional(v.string()),
    company: v.optional(v.string()),
    bio: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    website: v.optional(v.string()),
    socials: v.optional(v.object({
      linkedin: v.optional(v.string()),
      instagram: v.optional(v.string()),
      twitter: v.optional(v.string()),
      github: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
    })),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    accentColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Slug already exists");
    }

    // Create profile
    const profileId = await ctx.db.insert("profiles", args);

    // Generate unique short card ID
    let cardId = generateShortId();
    let cardExists = await ctx.db
      .query("cards")
      .withIndex("by_cardId", (q) => q.eq("cardId", cardId))
      .first();

    // Retry if collision (rare)
    while (cardExists) {
      cardId = generateShortId();
      cardExists = await ctx.db
        .query("cards")
        .withIndex("by_cardId", (q) => q.eq("cardId", cardId))
        .first();
    }

    // Create card automatically
    await ctx.db.insert("cards", {
      cardId,
      profileId,
      isActive: true,
      tapCount: 0,
    });

    return profileId;
  },
});

export const update = mutation({
  args: {
    id: v.id("profiles"),
    displayName: v.optional(v.string()),
    title: v.optional(v.string()),
    company: v.optional(v.string()),
    bio: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    website: v.optional(v.string()),
    socials: v.optional(v.object({
      linkedin: v.optional(v.string()),
      instagram: v.optional(v.string()),
      twitter: v.optional(v.string()),
      github: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
    })),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    accentColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, cleanUpdates);
    return await ctx.db.get(id);
  },
});
