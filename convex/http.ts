import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Escape special characters for vCard
function escapeVCard(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

// Generate vCard string from profile data
function generateVCard(profile: {
  displayName: string;
  title?: string;
  company?: string;
  phone?: string;
  contactEmail?: string;
  website?: string;
  socials?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    github?: string;
  };
}): string {
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "PRODID:-//Sempery//Digital Card//EN",
  ];

  // FN is required
  lines.push(`FN:${escapeVCard(profile.displayName)}`);

  // Parse name for N field (required for iOS)
  const nameParts = profile.displayName.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  lines.push(`N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`);

  if (profile.title) {
    lines.push(`TITLE:${escapeVCard(profile.title)}`);
  }

  if (profile.company) {
    lines.push(`ORG:${escapeVCard(profile.company)}`);
  }

  if (profile.phone) {
    const cleanPhone = profile.phone.replace(/[^\d+]/g, "");
    lines.push(`TEL;TYPE=CELL:${cleanPhone}`);
  }

  if (profile.contactEmail) {
    lines.push(`EMAIL;TYPE=INTERNET:${profile.contactEmail}`);
  }

  if (profile.website) {
    lines.push(`URL:${profile.website}`);
  }

  // Social profiles using X-SOCIALPROFILE (iOS standard)
  if (profile.socials?.linkedin) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${profile.socials.linkedin}`);
  }
  if (profile.socials?.instagram) {
    lines.push(`X-SOCIALPROFILE;TYPE=instagram:${profile.socials.instagram}`);
  }
  if (profile.socials?.twitter) {
    lines.push(`X-SOCIALPROFILE;TYPE=twitter:${profile.socials.twitter}`);
  }
  if (profile.socials?.github) {
    lines.push(`X-SOCIALPROFILE;TYPE=github:${profile.socials.github}`);
  }

  lines.push("END:VCARD");

  return lines.join("\r\n");
}

// HTTP endpoint to download vCard for a card
http.route({
  path: "/vcard/{cardId}",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Extract cardId from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const cardId = pathParts[pathParts.length - 1];

    if (!cardId) {
      return new Response("Card ID required", { status: 400 });
    }

    // Fetch card
    const card = await ctx.runQuery(api.cards.getByCardId, { cardId });

    if (!card || !card.isActive) {
      return new Response("Card not found or inactive", { status: 404 });
    }

    // Fetch profile
    const profile = await ctx.runQuery(api.profiles.getById, {
      id: card.profileId,
    });

    if (!profile) {
      return new Response("Profile not found", { status: 404 });
    }

    // Generate vCard
    const vcard = generateVCard({
      displayName: profile.displayName,
      title: profile.title,
      company: profile.company,
      phone: profile.phone,
      contactEmail: profile.contactEmail,
      website: profile.website,
      socials: profile.socials,
    });

    const filename = profile.displayName.replace(/\s+/g, "_");

    // Return vCard with proper headers - this is what makes it work on ALL devices
    return new Response(vcard, {
      status: 200,
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.vcf"`,
        "Cache-Control": "no-cache",
      },
    });
  }),
});

export default http;
