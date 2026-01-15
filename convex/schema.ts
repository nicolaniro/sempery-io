import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    // Owner info
    email: v.optional(v.string()),

    // Public profile data
    slug: v.string(), // URL-friendly identifier
    displayName: v.string(),
    title: v.optional(v.string()), // es. "Software Engineer"
    company: v.optional(v.string()),
    bio: v.optional(v.string()),
    photoUrl: v.optional(v.string()),

    // Contact info
    phone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    website: v.optional(v.string()),

    // Social links
    socials: v.optional(v.object({
      linkedin: v.optional(v.string()),
      instagram: v.optional(v.string()),
      twitter: v.optional(v.string()),
      github: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      youtube: v.optional(v.string()),
    })),

    // Appearance
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    accentColor: v.optional(v.string()), // hex color for buttons/accents

    // Advanced branding
    branding: v.optional(v.object({
      backgroundColor: v.optional(v.string()), // hex or CSS color
      backgroundGradient: v.optional(v.string()), // CSS gradient
      backgroundImageUrl: v.optional(v.string()), // background image
      logoUrl: v.optional(v.string()), // company logo
      logoPosition: v.optional(v.union(v.literal("top"), v.literal("bottom"))),
      textColor: v.optional(v.string()), // main text color
      secondaryTextColor: v.optional(v.string()), // subtitle/muted text
      buttonStyle: v.optional(v.union(v.literal("solid"), v.literal("outline"), v.literal("gradient"))),
      buttonRadius: v.optional(v.union(v.literal("none"), v.literal("sm"), v.literal("md"), v.literal("lg"), v.literal("full"))),
      cardStyle: v.optional(v.union(v.literal("solid"), v.literal("glass"), v.literal("transparent"))),
    })),
  })
    .index("by_slug", ["slug"]),

  cards: defineTable({
    cardId: v.string(), // UUID written on the NFC card
    profileId: v.id("profiles"),
    isActive: v.boolean(),
    tapCount: v.number(),
    lastTapAt: v.optional(v.number()),
  })
    .index("by_cardId", ["cardId"])
    .index("by_profileId", ["profileId"]),
});
