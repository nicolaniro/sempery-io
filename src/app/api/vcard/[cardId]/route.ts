import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
    `FN:${profile.displayName}`,
  ];

  // Parse name for N field
  const nameParts = profile.displayName.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  lines.push(`N:${lastName};${firstName};;;`);

  if (profile.title) {
    lines.push(`TITLE:${profile.title}`);
  }

  if (profile.company) {
    lines.push(`ORG:${profile.company}`);
  }

  if (profile.phone) {
    lines.push(`TEL;TYPE=CELL:${profile.phone}`);
  }

  if (profile.contactEmail) {
    lines.push(`EMAIL:${profile.contactEmail}`);
  }

  if (profile.website) {
    lines.push(`URL:${profile.website}`);
  }

  // Social profiles as URLs
  if (profile.socials?.linkedin) {
    lines.push(`URL;TYPE=LinkedIn:${profile.socials.linkedin}`);
  }
  if (profile.socials?.instagram) {
    lines.push(`URL;TYPE=Instagram:${profile.socials.instagram}`);
  }
  if (profile.socials?.twitter) {
    lines.push(`URL;TYPE=Twitter:${profile.socials.twitter}`);
  }
  if (profile.socials?.github) {
    lines.push(`URL;TYPE=GitHub:${profile.socials.github}`);
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
