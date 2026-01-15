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

// Fetch image and convert to base64, returns { base64, type }
async function fetchImageAsBase64(url: string): Promise<{ base64: string; type: string } | null> {
  try {
    console.log("Fetching image from:", url);
    const response = await fetch(url);
    if (!response.ok) {
      console.log("Image fetch failed:", response.status, response.statusText);
      return null;
    }

    // Detect image type from Content-Type header
    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    let imageType = "JPEG";
    if (contentType.includes("png")) {
      imageType = "PNG";
    } else if (contentType.includes("gif")) {
      imageType = "GIF";
    }
    console.log("Image Content-Type:", contentType, "-> vCard type:", imageType);

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    console.log("Image converted to base64, length:", base64.length);
    return { base64, type: imageType };
  } catch (error) {
    console.error("Error fetching image:", error);
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

  // Photo (base64 encoded) - use iOS compatible format
  if (profile.photoBase64) {
    const photoType = profile.photoType || "JPEG";
    lines.push(`PHOTO;ENCODING=BASE64;TYPE=${photoType}:`);
    lines.push(` ${profile.photoBase64}`);
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
