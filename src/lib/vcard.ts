interface VCardData {
  displayName: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  photoBase64?: string; // Base64 encoded image (without data:image prefix)
  socials?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    github?: string;
  };
}

export function generateVCard(data: VCardData): string {
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${data.displayName}`,
  ];

  // Parse name for N field (simplified)
  const nameParts = data.displayName.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  lines.push(`N:${lastName};${firstName};;;`);

  if (data.title) {
    lines.push(`TITLE:${data.title}`);
  }

  if (data.company) {
    lines.push(`ORG:${data.company}`);
  }

  if (data.phone) {
    lines.push(`TEL;TYPE=CELL:${data.phone}`);
  }

  if (data.email) {
    lines.push(`EMAIL:${data.email}`);
  }

  if (data.website) {
    lines.push(`URL:${data.website}`);
  }

  // Social profiles as URLs
  if (data.socials?.linkedin) {
    lines.push(`URL;TYPE=LinkedIn:${data.socials.linkedin}`);
  }
  if (data.socials?.instagram) {
    lines.push(`URL;TYPE=Instagram:${data.socials.instagram}`);
  }
  if (data.socials?.twitter) {
    lines.push(`URL;TYPE=Twitter:${data.socials.twitter}`);
  }
  if (data.socials?.github) {
    lines.push(`URL;TYPE=GitHub:${data.socials.github}`);
  }

  // Photo (Base64 encoded)
  // Important: For iOS to show the photo, it needs to be properly formatted
  if (data.photoBase64) {
    // Split base64 into 75-char lines for vCard compliance
    const photoLines = data.photoBase64.match(/.{1,75}/g) || [];
    lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${photoLines[0]}`);
    for (let i = 1; i < photoLines.length; i++) {
      lines.push(` ${photoLines[i]}`);
    }
  }

  lines.push("END:VCARD");

  return lines.join("\r\n");
}

export async function downloadVCard(vcard: string, filename: string) {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Create file for sharing/downloading
  const file = new File([vcard], `${filename}.vcf`, { type: "text/vcard" });

  // Try Web Share API first on mobile (most reliable for iOS/Android)
  if (isMobile && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return; // Success
    } catch (err) {
      // User cancelled or share failed, fall through to fallback
      if ((err as Error).name === "AbortError") {
        return; // User cancelled, don't try fallback
      }
    }
  }

  // Fallback: Create blob and download
  const blob = new Blob([vcard], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);

  if (isIOS) {
    // iOS fallback: open in new tab - Safari recognizes vCard MIME type
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } else {
    // Desktop & Android fallback: standard download
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.vcf`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }
}
