import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    return await ctx.db.insert("profiles", args);
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
