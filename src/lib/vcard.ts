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

// Escape special characters for vCard
function escapeVCard(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

export function generateVCard(data: VCardData): string {
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "PRODID:-//Sempery//Digital Card//EN",
  ];

  // FN is required
  lines.push(`FN:${escapeVCard(data.displayName)}`);

  // Parse name for N field (required for iOS)
  const nameParts = data.displayName.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  lines.push(`N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`);

  if (data.title) {
    lines.push(`TITLE:${escapeVCard(data.title)}`);
  }

  if (data.company) {
    lines.push(`ORG:${escapeVCard(data.company)}`);
  }

  if (data.phone) {
    // Clean phone number for better compatibility
    const cleanPhone = data.phone.replace(/[^\d+]/g, "");
    lines.push(`TEL;TYPE=CELL:${cleanPhone}`);
  }

  if (data.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${data.email}`);
  }

  if (data.website) {
    lines.push(`URL:${data.website}`);
  }

  // Social profiles using X-SOCIALPROFILE (iOS standard)
  if (data.socials?.linkedin) {
    lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${data.socials.linkedin}`);
  }
  if (data.socials?.instagram) {
    lines.push(`X-SOCIALPROFILE;TYPE=instagram:${data.socials.instagram}`);
  }
  if (data.socials?.twitter) {
    lines.push(`X-SOCIALPROFILE;TYPE=twitter:${data.socials.twitter}`);
  }
  if (data.socials?.github) {
    lines.push(`X-SOCIALPROFILE;TYPE=github:${data.socials.github}`);
  }

  // Photo (Base64 encoded)
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
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid;

  // Detect in-app browsers (Instagram, Facebook, LinkedIn, Twitter, etc.)
  const isInAppBrowser = /FBAN|FBAV|Instagram|LinkedIn|Twitter|Line|MicroMessenger|Snapchat/i.test(ua);

  // Detect Chrome on iOS (CriOS)
  const isChromeIOS = /CriOS/i.test(ua);

  // Detect Firefox on iOS (FxiOS)
  const isFirefoxIOS = /FxiOS/i.test(ua);

  // Try Web Share API first on mobile (most reliable for iOS/Android)
  // Skip for in-app browsers as they often have restricted Web Share support
  if (isMobile && !isInAppBrowser && navigator.share) {
    try {
      const file = new File([vcard], `${filename}.vcf`, { type: "text/vcard" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
        });
        return; // Success
      }
    } catch (err) {
      // User cancelled or share failed, fall through to fallback
      if ((err as Error).name === "AbortError") {
        return; // User cancelled, don't try fallback
      }
      // Other errors: continue to fallback
    }
  }

  // Create blob for download
  const blob = new Blob([vcard], { type: "text/vcard" });

  // For iOS (Safari, Chrome, Firefox, and in-app browsers)
  if (isIOS) {
    // Try blob URL approach first
    const url = URL.createObjectURL(blob);

    if (isInAppBrowser) {
      // In-app browsers: try window.open which may open external browser
      const newWindow = window.open(url, "_blank");
      if (!newWindow) {
        // Popup blocked - try location change as last resort
        window.location.href = url;
      }
    } else if (isChromeIOS || isFirefoxIOS) {
      // Chrome/Firefox iOS: Use anchor with target="_blank"
      // These browsers handle blob URLs better than Safari
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Safari iOS: anchor click works best
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Clean up blob URL after delay
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return;
  }

  // Android and Desktop
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.vcf`;
  link.style.display = "none";
  document.body.appendChild(link);

  if (isInAppBrowser && isAndroid) {
    // Android in-app browsers might not support download attribute
    // Try opening in new tab instead
    link.target = "_blank";
    link.removeAttribute("download");
  }

  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
