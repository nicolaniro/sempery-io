"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect, useState } from "react";
import { generateVCard, downloadVCard } from "@/lib/vcard";
import {
  Linkedin,
  Instagram,
  Twitter,
  Github,
  Globe,
  Mail,
  Phone,
  Youtube,
  Download,
  ExternalLink,
} from "lucide-react";

interface PageProps {
  params: Promise<{ cardId: string }>;
}

export default function CardProfilePage({ params }: PageProps) {
  const [cardId, setCardId] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setCardId(p.cardId));
  }, [params]);

  // Try to find card by cardId
  const cardByCardId = useQuery(
    api.cards.getByCardId,
    cardId ? { cardId } : "skip"
  );

  // If not found, try to find profile by slug
  const profileBySlug = useQuery(
    api.profiles.getBySlug,
    cardId && !cardByCardId ? { slug: cardId } : "skip"
  );

  // Get cards for profile found by slug
  const cardsByProfile = useQuery(
    api.cards.getByProfileId,
    profileBySlug?._id ? { profileId: profileBySlug._id } : "skip"
  );

  // Determine final card and profile
  const card = cardByCardId || cardsByProfile?.find((c) => c.isActive) || cardsByProfile?.[0];
  const profile = useQuery(
    api.profiles.getById,
    cardByCardId?.profileId ? { id: cardByCardId.profileId } : "skip"
  ) || profileBySlug;
  const recordTap = useMutation(api.cards.recordTap);

  // Record tap on first load
  useEffect(() => {
    if (cardId && card) {
      recordTap({ cardId });
    }
  }, [cardId, card?._id]);

  // Fetch and convert photo to base64 for vCard (for client-side fallback)
  useEffect(() => {
    if (profile?.photoUrl) {
      fetch(profile.photoUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            setPhotoBase64(base64);
          };
          reader.readAsDataURL(blob);
        })
        .catch(() => setPhotoBase64(null));
    }
  }, [profile?.photoUrl]);

  // Server-side vCard URL (most reliable for all devices)
  const vcardUrl = cardId ? `/api/vcard/${cardId}` : null;

  // Client-side fallback for when server endpoint fails
  const handleSaveContactFallback = async () => {
    if (!profile) return;

    const vcard = generateVCard({
      displayName: profile.displayName,
      title: profile.title,
      company: profile.company,
      phone: profile.phone,
      email: profile.contactEmail,
      website: profile.website,
      photoBase64: photoBase64 || undefined,
      socials: profile.socials,
    });

    await downloadVCard(vcard, profile.displayName.replace(/\s+/g, "_"));
  };

  // Primary save contact handler
  const handleSaveContact = () => {
    if (vcardUrl) {
      window.location.href = vcardUrl;
    } else {
      handleSaveContactFallback();
    }
  };

  // Loading state
  if (!cardId || card === undefined || (card && profile === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fadeIn">
          <div className="spinner" />
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Card not found or inactive
  if (!card || !card.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center glass rounded-2xl p-8 max-w-md animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Card Not Found</h1>
          <p className="text-zinc-400">This card does not exist or has been deactivated.</p>
        </div>
      </div>
    );
  }

  // Profile not found
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center glass rounded-2xl p-8 max-w-md animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
          <p className="text-zinc-400">The profile associated with this card does not exist.</p>
        </div>
      </div>
    );
  }

  // Extract branding settings
  const branding = profile.branding || {};
  const rawAccentColor = profile.accentColor || "#10b981";

  // Smart dark/light detection based on actual background
  const isDark = (() => {
    // If user set a custom background color, analyze it
    if (branding.backgroundColor) {
      return isColorDark(branding.backgroundColor);
    }
    // If user set a gradient, try to extract and analyze the first color
    if (branding.backgroundGradient) {
      const gradientColor = extractColorFromGradient(branding.backgroundGradient);
      if (gradientColor) {
        return isColorDark(gradientColor);
      }
    }
    // If user set a background image, assume dark (overlay is applied)
    if (branding.backgroundImageUrl) {
      return true;
    }
    // Fall back to theme setting
    return profile.theme !== "light";
  })();

  // Ensure accent color contrasts well with background
  const accentColor = getContrastingAccent(rawAccentColor, isDark);

  // Background styles
  const getBackgroundStyle = () => {
    const style: React.CSSProperties = {};

    if (branding.backgroundImageUrl) {
      style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${branding.backgroundImageUrl})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
      style.backgroundAttachment = "fixed";
    } else if (branding.backgroundGradient) {
      style.background = branding.backgroundGradient;
    } else if (branding.backgroundColor) {
      style.backgroundColor = branding.backgroundColor;
    } else {
      style.background = isDark
        ? "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)"
        : "linear-gradient(135deg, #fafafa 0%, #f0f0f5 100%)";
    }

    return style;
  };

  // Text colors
  const textColor = branding.textColor || (isDark ? "#ffffff" : "#18181b");
  const secondaryTextColor = branding.secondaryTextColor || (isDark ? "#a1a1aa" : "#71717a");

  // Button styles
  const getButtonStyle = () => {
    const style: React.CSSProperties = {
      color: "white",
    };

    if (branding.buttonStyle === "outline") {
      style.backgroundColor = "transparent";
      style.border = `2px solid ${accentColor}`;
      style.color = accentColor;
    } else if (branding.buttonStyle === "gradient") {
      style.background = `linear-gradient(135deg, ${accentColor}, ${adjustColor(accentColor, -30)})`;
      style.boxShadow = `0 10px 30px ${accentColor}40`;
    } else {
      style.backgroundColor = accentColor;
      style.boxShadow = `0 10px 30px ${accentColor}40`;
    }

    return style;
  };

  const getButtonRadius = () => {
    const radiusMap = {
      none: "rounded-none",
      sm: "rounded-lg",
      md: "rounded-xl",
      lg: "rounded-2xl",
      full: "rounded-full",
    };
    return radiusMap[branding.buttonRadius || "full"];
  };

  // Card styles
  const getCardStyle = () => {
    if (branding.cardStyle === "glass") {
      return isDark
        ? "bg-white/5 backdrop-blur-xl border border-white/10"
        : "bg-black/5 backdrop-blur-xl border border-black/10";
    } else if (branding.cardStyle === "transparent") {
      return "bg-transparent";
    } else {
      return isDark
        ? "bg-zinc-900/80 backdrop-blur-sm border border-white/5 hover:bg-zinc-800/80"
        : "bg-white/80 backdrop-blur-sm border border-zinc-200 hover:bg-white";
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={getBackgroundStyle()}
    >
      <div className="w-full max-w-md animate-fadeIn">
        {/* Company Logo - Top */}
        {branding.logoUrl && branding.logoPosition !== "bottom" && (
          <div className="flex justify-center mb-10 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
            <img
              src={branding.logoUrl}
              alt="Company logo"
              className="h-12 object-contain drop-shadow-lg"
            />
          </div>
        )}

        {/* Profile Photo */}
        {profile.photoUrl && (
          <div className="flex justify-center mb-8 animate-fadeIn" style={{ animationDelay: "0.15s" }}>
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-50"
                style={{ backgroundColor: accentColor }}
              />
              <img
                src={profile.photoUrl}
                alt={profile.displayName}
                className="relative w-36 h-36 rounded-full object-cover ring-4 ring-white/20 shadow-2xl"
              />
            </div>
          </div>
        )}

        {/* Name & Title */}
        <div className="text-center mb-8 animate-fadeIn" style={{ animationDelay: "0.2s" }}>
          <h1
            className="text-4xl font-bold mb-2 tracking-tight"
            style={{ color: textColor }}
          >
            {profile.displayName}
          </h1>
          {profile.title && (
            <p
              className="text-xl font-medium"
              style={{ color: secondaryTextColor }}
            >
              {profile.title}
            </p>
          )}
          {profile.company && (
            <p
              className="text-lg mt-1"
              style={{ color: secondaryTextColor, opacity: 0.8 }}
            >
              {profile.company}
            </p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p
            className="text-center mb-10 leading-relaxed animate-fadeIn"
            style={{ color: secondaryTextColor, animationDelay: "0.25s" }}
          >
            {profile.bio}
          </p>
        )}

        {/* Save Contact CTA */}
        <button
          onClick={handleSaveContact}
          className={`w-full py-4 px-8 font-semibold text-lg mb-10 flex items-center justify-center gap-3 transition-all active:scale-[0.98] btn-transition ${getButtonRadius()} animate-fadeIn`}
          style={{ ...getButtonStyle(), animationDelay: "0.3s" }}
        >
          <Download className="w-5 h-5" />
          Save Contact
        </button>

        {/* Contact Info */}
        <div className="space-y-3 mb-10">
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all btn-transition animate-fadeIn ${getCardStyle()}`}
              style={{ animationDelay: "0.35s" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <Phone className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <span className="font-medium" style={{ color: textColor }}>{profile.phone}</span>
            </a>
          )}
          {profile.contactEmail && (
            <a
              href={`mailto:${profile.contactEmail}`}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all btn-transition animate-fadeIn ${getCardStyle()}`}
              style={{ animationDelay: "0.4s" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <Mail className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <span className="font-medium" style={{ color: textColor }}>{profile.contactEmail}</span>
            </a>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all btn-transition animate-fadeIn ${getCardStyle()}`}
              style={{ animationDelay: "0.45s" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}20` }}
              >
                <Globe className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <span className="font-medium" style={{ color: textColor }}>
                {profile.website.replace(/^https?:\/\//, "")}
              </span>
            </a>
          )}
        </div>

        {/* Social Links */}
        {profile.socials && Object.values(profile.socials).some(Boolean) && (
          <div className="flex justify-center gap-3 flex-wrap animate-fadeIn" style={{ animationDelay: "0.5s" }}>
            {profile.socials.linkedin && (
              <a
                href={profile.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 rounded-2xl transition-all btn-transition ${getCardStyle()}`}
                title="LinkedIn"
              >
                <Linkedin className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.instagram && (
              <a
                href={profile.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 rounded-2xl transition-all btn-transition ${getCardStyle()}`}
                title="Instagram"
              >
                <Instagram className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.twitter && (
              <a
                href={profile.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 rounded-2xl transition-all btn-transition ${getCardStyle()}`}
                title="Twitter/X"
              >
                <Twitter className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.github && (
              <a
                href={profile.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 rounded-2xl transition-all btn-transition ${getCardStyle()}`}
                title="GitHub"
              >
                <Github className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.youtube && (
              <a
                href={profile.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 rounded-2xl transition-all btn-transition ${getCardStyle()}`}
                title="YouTube"
              >
                <Youtube className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.tiktok && (
              <a
                href={profile.socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 rounded-2xl transition-all btn-transition ${getCardStyle()}`}
                title="TikTok"
              >
                <span
                  className="w-6 h-6 flex items-center justify-center font-bold text-sm"
                  style={{ color: accentColor }}
                >
                  TT
                </span>
              </a>
            )}
          </div>
        )}

        {/* Company Logo - Bottom */}
        {branding.logoUrl && branding.logoPosition === "bottom" && (
          <div className="flex justify-center mt-12 animate-fadeIn" style={{ animationDelay: "0.55s" }}>
            <img
              src={branding.logoUrl}
              alt="Company logo"
              className="h-10 object-contain opacity-70"
            />
          </div>
        )}

        {/* Footer */}
        <p
          className="text-center text-sm mt-16 opacity-40 animate-fadeIn"
          style={{ color: secondaryTextColor, animationDelay: "0.6s" }}
        >
          Powered by <span className="font-semibold">Sempery</span>
        </p>
      </div>
    </div>
  );
}

// Helper function to adjust color brightness
function adjustColor(color: string, amount: number): string {
  const hex = color.replace("#", "");
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// Calculate relative luminance of a color (0 = black, 1 = white)
function getLuminance(color: string): number {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Convert to linear RGB
  const rLin = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLin = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLin = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // Calculate luminance
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

// Determine if a background color is dark (needs light text)
function isColorDark(color: string): boolean {
  try {
    return getLuminance(color) < 0.5;
  } catch {
    return true; // Default to dark if parsing fails
  }
}

// Extract dominant color from gradient string
function extractColorFromGradient(gradient: string): string | null {
  const colorMatch = gradient.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/);
  return colorMatch ? colorMatch[0] : null;
}

// Ensure accent color has enough contrast with background
function getContrastingAccent(accentColor: string, isDarkBg: boolean): string {
  const accentLuminance = getLuminance(accentColor);

  // If dark background and dark accent, lighten it
  if (isDarkBg && accentLuminance < 0.3) {
    return adjustColor(accentColor, 80);
  }
  // If light background and light accent, darken it
  if (!isDarkBg && accentLuminance > 0.7) {
    return adjustColor(accentColor, -80);
  }
  return accentColor;
}
