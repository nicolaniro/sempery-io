import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import sharp from "sharp";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Escape special characters for vCard
function escapeVCard(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

// Fetch image, resize it, and convert to base64
// vCard photos should be small (< 100KB) for iOS compatibility
async function fetchImageAsBase64(url: string): Promise<{ base64: string; type: string } | null> {
  try {
    console.log("Fetching image from:", url);
    const response = await fetch(url);
    if (!response.ok) {
      console.log("Image fetch failed:", response.status, response.statusText);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    console.log("Original image size:", inputBuffer.length);

    // Resize and convert to JPEG for best iOS compatibility
    // Max 400x400 pixels, quality 80 - keeps file small
    const resizedBuffer = await sharp(inputBuffer)
      .resize(400, 400, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const base64 = resizedBuffer.toString("base64");
    console.log("Resized image base64 length:", base64.length);

    // Always return JPEG since we convert to JPEG
    return { base64, type: "JPEG" };
  } catch (error) {
    console.error("Error fetching/resizing image:", error);
    return null;
  }
}

// Generate vCard string from profile data
function generateVCard(profile: {
  displayName: string;
  title?: string;
  company?: string;
  phone?: string;
  contactEmail?: string;
  website?: string;
  photoBase64?: string;
  photoType?: string;
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

  // Photo (base64 encoded) - iOS compatible format, all on one line
  if (profile.photoBase64) {
    lines.push(`PHOTO;TYPE=JPEG;ENCODING=b:${profile.photoBase64}`);
  }

  lines.push("END:VCARD");

  return lines.join("\r\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get("debug") === "true";

  if (!cardId) {
    return NextResponse.json({ error: "Card ID required" }, { status: 400 });
  }

  try {
    // Try to fetch card by cardId first
    let card = await convex.query(api.cards.getByCardId, { cardId });
    let profile = null;

    // If card not found, try to find profile by slug and get its card
    if (!card) {
      profile = await convex.query(api.profiles.getBySlug, { slug: cardId });
      if (profile) {
        // Get the card for this profile
        const cards = await convex.query(api.cards.getByProfileId, { profileId: profile._id });
        card = cards?.find((c: { isActive: boolean }) => c.isActive) || cards?.[0];
      }
    }

    if (!card || !card.isActive) {
      if (debug) {
        return NextResponse.json({
          error: "Card not found or inactive",
          cardId,
          cardFound: !!card,
          profileFoundBySlug: !!profile,
          isActive: card?.isActive,
        }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Card not found or inactive" },
        { status: 404 }
      );
    }

    // Fetch profile if not already fetched
    if (!profile) {
      profile = await convex.query(api.profiles.getById, {
        id: card.profileId,
      });
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Fetch photo if available
    let photoBase64: string | undefined;
    let photoType: string | undefined;
    console.log("Profile photoUrl:", profile.photoUrl);
    if (profile.photoUrl) {
      const imageData = await fetchImageAsBase64(profile.photoUrl);
      if (imageData) {
        photoBase64 = imageData.base64;
        photoType = imageData.type;
        console.log("Photo fetched successfully, type:", photoType, "base64 length:", photoBase64.length);
      } else {
        console.log("Failed to fetch photo");
      }
    } else {
      console.log("No photoUrl in profile");
    }

    // Debug mode - return JSON with info
    if (debug) {
      return NextResponse.json({
        profilePhotoUrl: profile.photoUrl,
        photoFetched: !!photoBase64,
        photoType,
        photoBase64Length: photoBase64?.length || 0,
        photoBase64Preview: photoBase64?.substring(0, 100) || null,
      });
    }

    // Generate vCard
    const vcard = generateVCard({
      displayName: profile.displayName,
      title: profile.title,
      company: profile.company,
      phone: profile.phone,
      contactEmail: profile.contactEmail,
      website: profile.website,
      photoBase64,
      photoType,
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
