import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import sharp from "sharp";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Max dimensions for different image types
const MAX_SIZES = {
  photo: 800,      // Profile photos
  logo: 400,       // Company logos
  background: 1200 // Background images
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "photo";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get max size for this type
    const maxSize = MAX_SIZES[type as keyof typeof MAX_SIZES] || 800;

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    console.log("Original image size:", inputBuffer.length);

    // Resize and optimize with sharp
    // .rotate() auto-rotates based on EXIF orientation data
    const resizedBuffer = await sharp(inputBuffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(maxSize, maxSize, {
        fit: "inside",           // Keep aspect ratio, fit within bounds
        withoutEnlargement: true // Don't upscale small images
      })
      .jpeg({ quality: 85 })    // Convert to JPEG, good quality
      .toBuffer();

    console.log("Resized image size:", resizedBuffer.length);

    // Get upload URL from Convex
    const uploadUrl = await convex.mutation(api.files.generateUploadUrl, {});

    // Upload resized image to Convex (convert Buffer to Uint8Array for fetch compatibility)
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/jpeg" },
      body: new Uint8Array(resizedBuffer),
    });

    if (!uploadResponse.ok) {
      throw new Error("Upload to Convex failed");
    }

    const { storageId } = await uploadResponse.json();

    // Get the public URL
    const publicUrl = await convex.mutation(api.files.getUrlMutation, { storageId });

    if (!publicUrl) {
      throw new Error("Failed to get file URL");
    }

    return NextResponse.json({
      url: publicUrl,
      originalSize: inputBuffer.length,
      optimizedSize: resizedBuffer.length
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
