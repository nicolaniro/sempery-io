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

  const card = useQuery(
    api.cards.getByCardId,
    cardId ? { cardId } : "skip"
  );
  const profile = useQuery(
    api.profiles.getById,
    card?.profileId ? { id: card.profileId } : "skip"
  );
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

  // Primary save contact handler - try server first, fallback to client
  const handleSaveContact = () => {
    if (vcardUrl) {
      // Server-side: Just navigate to the vCard URL
      // The browser will handle the download with proper Content-Type headers
      window.location.href = vcardUrl;
    } else {
      // Fallback to client-side generation
      handleSaveContactFallback();
    }
  };

  // Loading state
  if (!cardId || card === undefined || (card && profile === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-pulse text-zinc-400">Caricamento...</div>
      </div>
    );
  }

  // Card not found or inactive
  if (!card || !card.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Card non trovata</h1>
          <p className="text-zinc-400">Questa card non esiste o è stata disattivata.</p>
        </div>
      </div>
    );
  }

  // Profile not found
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Profilo non trovato</h1>
          <p className="text-zinc-400">Il profilo associato a questa card non esiste.</p>
        </div>
      </div>
    );
  }

  // Extract branding settings
  const branding = profile.branding || {};
  const isDark = profile.theme !== "light";
  const accentColor = profile.accentColor || "#10b981";

  // Background styles
  const getBackgroundStyle = () => {
    const style: React.CSSProperties = {};

    if (branding.backgroundImageUrl) {
      style.backgroundImage = `url(${branding.backgroundImageUrl})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    } else if (branding.backgroundGradient) {
      style.background = branding.backgroundGradient;
    } else if (branding.backgroundColor) {
      style.backgroundColor = branding.backgroundColor;
    } else {
      style.backgroundColor = isDark ? "#09090b" : "#fafafa";
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
      style.background = `linear-gradient(135deg, ${accentColor}, ${adjustColor(accentColor, -20)})`;
    } else {
      style.backgroundColor = accentColor;
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
    return radiusMap[branding.buttonRadius || "lg"];
  };

  // Card styles
  const getCardStyle = () => {
    if (branding.cardStyle === "glass") {
      return isDark
        ? "bg-white/10 backdrop-blur-md border border-white/20"
        : "bg-black/5 backdrop-blur-md border border-black/10";
    } else if (branding.cardStyle === "transparent") {
      return "bg-transparent";
    } else {
      return isDark
        ? "bg-zinc-900 hover:bg-zinc-800"
        : "bg-white hover:bg-zinc-100 border border-zinc-200";
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={getBackgroundStyle()}
    >
      <div className="w-full max-w-md">
        {/* Company Logo - Top */}
        {branding.logoUrl && branding.logoPosition !== "bottom" && (
          <div className="flex justify-center mb-8">
            <img
              src={branding.logoUrl}
              alt="Company logo"
              className="h-10 object-contain"
            />
          </div>
        )}

        {/* Profile Photo */}
        {profile.photoUrl && (
          <div className="flex justify-center mb-6">
            <img
              src={profile.photoUrl}
              alt={profile.displayName}
              className="w-32 h-32 rounded-full object-cover ring-4"
              style={{ ["--tw-ring-color" as string]: accentColor }}
            />
          </div>
        )}

        {/* Name & Title */}
        <div className="text-center mb-6">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: textColor }}
          >
            {profile.displayName}
          </h1>
          {profile.title && (
            <p
              className="text-lg"
              style={{ color: secondaryTextColor }}
            >
              {profile.title}
            </p>
          )}
          {profile.company && (
            <p
              className="text-base"
              style={{ color: secondaryTextColor }}
            >
              {profile.company}
            </p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p
            className="text-center mb-8"
            style={{ color: secondaryTextColor }}
          >
            {profile.bio}
          </p>
        )}

        {/* Save Contact CTA */}
        <button
          onClick={handleSaveContact}
          className={`w-full py-4 px-6 font-semibold text-lg mb-8 flex items-center justify-center gap-3 transition-all active:scale-95 ${getButtonRadius()}`}
          style={getButtonStyle()}
        >
          <Download className="w-5 h-5" />
          Salva Contatto
        </button>

        {/* Contact Info */}
        <div className="space-y-3 mb-8">
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${getCardStyle()}`}
            >
              <Phone className="w-5 h-5" style={{ color: accentColor }} />
              <span style={{ color: textColor }}>{profile.phone}</span>
            </a>
          )}
          {profile.contactEmail && (
            <a
              href={`mailto:${profile.contactEmail}`}
              className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${getCardStyle()}`}
            >
              <Mail className="w-5 h-5" style={{ color: accentColor }} />
              <span style={{ color: textColor }}>{profile.contactEmail}</span>
            </a>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${getCardStyle()}`}
            >
              <Globe className="w-5 h-5" style={{ color: accentColor }} />
              <span style={{ color: textColor }}>{profile.website.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
        </div>

        {/* Social Links */}
        {profile.socials && Object.values(profile.socials).some(Boolean) && (
          <div className="flex justify-center gap-4 flex-wrap">
            {profile.socials.linkedin && (
              <a
                href={profile.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full transition-colors ${getCardStyle()}`}
              >
                <Linkedin className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.instagram && (
              <a
                href={profile.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full transition-colors ${getCardStyle()}`}
              >
                <Instagram className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.twitter && (
              <a
                href={profile.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full transition-colors ${getCardStyle()}`}
              >
                <Twitter className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.github && (
              <a
                href={profile.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full transition-colors ${getCardStyle()}`}
              >
                <Github className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.youtube && (
              <a
                href={profile.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full transition-colors ${getCardStyle()}`}
              >
                <Youtube className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.tiktok && (
              <a
                href={profile.socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full transition-colors ${getCardStyle()}`}
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
          <div className="flex justify-center mt-8">
            <img
              src={branding.logoUrl}
              alt="Company logo"
              className="h-8 object-contain opacity-80"
            />
          </div>
        )}

        {/* Footer */}
        <p
          className="text-center text-sm mt-12 opacity-50"
          style={{ color: secondaryTextColor }}
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
