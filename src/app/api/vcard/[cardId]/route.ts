import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
    // Clean phone number - remove spaces and special chars for better compatibility
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  if (!cardId) {
    return NextResponse.json({ error: "Card ID required" }, { status: 400 });
  }

  try {
    // Fetch card from Convex
    const card = await convex.query(api.cards.getByCardId, { cardId });

    if (!card || !card.isActive) {
      return NextResponse.json(
        { error: "Card not found or inactive" },
        { status: 404 }
      );
    }

    // Fetch profile from Convex
    const profile = await convex.query(api.profiles.getById, {
      id: card.profileId,
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
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

    // Return vCard with proper headers
    return new NextResponse(vcard, {
      status: 200,
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.vcf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating vCard:", error);
    return NextResponse.json(
      { error: "Failed to generate vCard" },
      { status: 500 }
    );
  }
}
