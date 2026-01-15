"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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

  // Fetch and convert photo to base64 for vCard
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

  const handleSaveContact = () => {
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

    downloadVCard(vcard, profile.displayName.replace(/\s+/g, "_"));
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

  const isDark = profile.theme !== "light";
  const accentColor = profile.accentColor || "#3b82f6";

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 ${
        isDark ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-900"
      }`}
    >
      <div className="w-full max-w-md">
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
          <h1 className="text-3xl font-bold mb-1">{profile.displayName}</h1>
          {profile.title && (
            <p className={`text-lg ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              {profile.title}
            </p>
          )}
          {profile.company && (
            <p className={`text-base ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
              {profile.company}
            </p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p
            className={`text-center mb-8 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}
          >
            {profile.bio}
          </p>
        )}

        {/* Save Contact CTA */}
        <button
          onClick={handleSaveContact}
          className="w-full py-4 px-6 rounded-2xl font-semibold text-lg mb-8 flex items-center justify-center gap-3 transition-transform active:scale-95"
          style={{ backgroundColor: accentColor, color: "white" }}
        >
          <Download className="w-5 h-5" />
          Salva Contatto
        </button>

        {/* Contact Info */}
        <div className="space-y-3 mb-8">
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                isDark
                  ? "bg-zinc-900 hover:bg-zinc-800"
                  : "bg-white hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              <Phone className="w-5 h-5" style={{ color: accentColor }} />
              <span>{profile.phone}</span>
            </a>
          )}
          {profile.contactEmail && (
            <a
              href={`mailto:${profile.contactEmail}`}
              className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                isDark
                  ? "bg-zinc-900 hover:bg-zinc-800"
                  : "bg-white hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              <Mail className="w-5 h-5" style={{ color: accentColor }} />
              <span>{profile.contactEmail}</span>
            </a>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                isDark
                  ? "bg-zinc-900 hover:bg-zinc-800"
                  : "bg-white hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              <Globe className="w-5 h-5" style={{ color: accentColor }} />
              <span>{profile.website.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
        </div>

        {/* Social Links */}
        {profile.socials && (
          <div className="flex justify-center gap-4">
            {profile.socials.linkedin && (
              <a
                href={profile.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full transition-colors ${
                  isDark ? "bg-zinc-900 hover:bg-zinc-800" : "bg-white hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                <Linkedin className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.instagram && (
              <a
                href={profile.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full transition-colors ${
                  isDark ? "bg-zinc-900 hover:bg-zinc-800" : "bg-white hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                <Instagram className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.twitter && (
              <a
                href={profile.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full transition-colors ${
                  isDark ? "bg-zinc-900 hover:bg-zinc-800" : "bg-white hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                <Twitter className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.github && (
              <a
                href={profile.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full transition-colors ${
                  isDark ? "bg-zinc-900 hover:bg-zinc-800" : "bg-white hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                <Github className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.youtube && (
              <a
                href={profile.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full transition-colors ${
                  isDark ? "bg-zinc-900 hover:bg-zinc-800" : "bg-white hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                <Youtube className="w-6 h-6" style={{ color: accentColor }} />
              </a>
            )}
            {profile.socials.tiktok && (
              <a
                href={profile.socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-full transition-colors ${
                  isDark ? "bg-zinc-900 hover:bg-zinc-800" : "bg-white hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                <span className="w-6 h-6 flex items-center justify-center font-bold" style={{ color: accentColor }}>
                  TT
                </span>
              </a>
            )}
          </div>
        )}

        {/* Footer */}
        <p className={`text-center text-sm mt-12 ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
          Powered by <span className="font-semibold">Sempery</span>
        </p>
      </div>
    </div>
  );
}
