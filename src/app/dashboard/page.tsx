"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "@convex/_generated/dataModel";
import { Profile } from "@/types";
import { Plus, Eye, Upload, X, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  const profiles = useQuery(api.profiles.list);
  const createProfile = useMutation(api.profiles.create);
  const updateProfile = useMutation(api.profiles.update);

  const [selectedProfileId, setSelectedProfileId] = useState<Id<"profiles"> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get cards for selected profile
  const profileCards = useQuery(
    api.cards.getByProfileId,
    selectedProfileId ? { profileId: selectedProfileId } : "skip"
  );
  const primaryCardId = profileCards?.[0]?.cardId;

  // Form state
  const [form, setForm] = useState({
    slug: "",
    displayName: "",
    title: "",
    company: "",
    bio: "",
    photoUrl: "",
    phone: "",
    contactEmail: "",
    website: "",
    linkedin: "",
    instagram: "",
    twitter: "",
    github: "",
    tiktok: "",
    youtube: "",
    theme: "dark" as "light" | "dark",
    accentColor: "#10b981",
    backgroundColor: "",
    backgroundGradient: "",
    backgroundImageUrl: "",
    logoUrl: "",
    logoPosition: "bottom" as "top" | "bottom",
    textColor: "",
    secondaryTextColor: "",
    buttonStyle: "solid" as "solid" | "outline" | "gradient",
    buttonRadius: "lg" as "none" | "sm" | "md" | "lg" | "full",
    cardStyle: "solid" as "solid" | "glass" | "transparent",
  });

  const selectedProfile = (profiles as Profile[] | undefined)?.find((p) => p._id === selectedProfileId);

  // Load profile data into form when selected
  useEffect(() => {
    if (selectedProfile) {
      setForm({
        slug: selectedProfile.slug,
        displayName: selectedProfile.displayName,
        title: selectedProfile.title || "",
        company: selectedProfile.company || "",
        bio: selectedProfile.bio || "",
        photoUrl: selectedProfile.photoUrl || "",
        phone: selectedProfile.phone || "",
        contactEmail: selectedProfile.contactEmail || "",
        website: selectedProfile.website || "",
        linkedin: selectedProfile.socials?.linkedin || "",
        instagram: selectedProfile.socials?.instagram || "",
        twitter: selectedProfile.socials?.twitter || "",
        github: selectedProfile.socials?.github || "",
        tiktok: selectedProfile.socials?.tiktok || "",
        youtube: selectedProfile.socials?.youtube || "",
        theme: selectedProfile.theme || "dark",
        accentColor: selectedProfile.accentColor || "#10b981",
        backgroundColor: selectedProfile.branding?.backgroundColor || "",
        backgroundGradient: selectedProfile.branding?.backgroundGradient || "",
        backgroundImageUrl: selectedProfile.branding?.backgroundImageUrl || "",
        logoUrl: selectedProfile.branding?.logoUrl || "",
        logoPosition: selectedProfile.branding?.logoPosition || "bottom",
        textColor: selectedProfile.branding?.textColor || "",
        secondaryTextColor: selectedProfile.branding?.secondaryTextColor || "",
        buttonStyle: selectedProfile.branding?.buttonStyle || "solid",
        buttonRadius: selectedProfile.branding?.buttonRadius || "lg",
        cardStyle: selectedProfile.branding?.cardStyle || "solid",
      });
      setIsCreating(false);
    }
  }, [selectedProfile]);

  const resetForm = () => {
    setForm({
      slug: "",
      displayName: "",
      title: "",
      company: "",
      bio: "",
      photoUrl: "",
      phone: "",
      contactEmail: "",
      website: "",
      linkedin: "",
      instagram: "",
      twitter: "",
      github: "",
      tiktok: "",
      youtube: "",
      theme: "dark",
      accentColor: "#10b981",
      backgroundColor: "",
      backgroundGradient: "",
      backgroundImageUrl: "",
      logoUrl: "",
      logoPosition: "bottom",
      textColor: "",
      secondaryTextColor: "",
      buttonStyle: "solid",
      buttonRadius: "lg",
      cardStyle: "solid",
    });
  };

  const handleCreateNew = () => {
    resetForm();
    setSelectedProfileId(null);
    setIsCreating(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "photoUrl" | "logoUrl" | "backgroundImageUrl") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const typeMap = {
        photoUrl: "photo",
        logoUrl: "logo",
        backgroundImageUrl: "background"
      };

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", typeMap[field]);

      const result = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { url } = await result.json();

      setForm({ ...form, [field]: url });
      setSuccess("Image uploaded successfully!");
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    try {
      const socials = {
        linkedin: form.linkedin || undefined,
        instagram: form.instagram || undefined,
        twitter: form.twitter || undefined,
        github: form.github || undefined,
        tiktok: form.tiktok || undefined,
        youtube: form.youtube || undefined,
      };

      const branding = {
        backgroundColor: form.backgroundColor || undefined,
        backgroundGradient: form.backgroundGradient || undefined,
        backgroundImageUrl: form.backgroundImageUrl || undefined,
        logoUrl: form.logoUrl || undefined,
        logoPosition: form.logoPosition,
        textColor: form.textColor || undefined,
        secondaryTextColor: form.secondaryTextColor || undefined,
        buttonStyle: form.buttonStyle,
        buttonRadius: form.buttonRadius,
        cardStyle: form.cardStyle,
      };

      if (isCreating) {
        const profileId = await createProfile({
          slug: form.slug,
          displayName: form.displayName,
          title: form.title || undefined,
          company: form.company || undefined,
          bio: form.bio || undefined,
          photoUrl: form.photoUrl || undefined,
          phone: form.phone || undefined,
          contactEmail: form.contactEmail || undefined,
          website: form.website || undefined,
          socials,
          theme: form.theme,
          accentColor: form.accentColor || undefined,
        });
        setSelectedProfileId(profileId);
        setIsCreating(false);
        setSuccess("Profile created!");
      } else if (selectedProfileId) {
        await updateProfile({
          id: selectedProfileId,
          displayName: form.displayName,
          title: form.title || undefined,
          company: form.company || undefined,
          bio: form.bio || undefined,
          photoUrl: form.photoUrl || undefined,
          phone: form.phone || undefined,
          contactEmail: form.contactEmail || undefined,
          website: form.website || undefined,
          socials,
          theme: form.theme,
          accentColor: form.accentColor || undefined,
          branding,
        });
        setSuccess("Profile updated!");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://sempery.io/c/${primaryCardId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Image upload component
  const ImageUpload = ({
    label,
    value,
    field,
    preview = true
  }: {
    label: string;
    value: string;
    field: "photoUrl" | "logoUrl" | "backgroundImageUrl";
    preview?: boolean;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-400">{label}</label>
      <div className="flex gap-3 items-center">
        {preview && value && (
          <div className="relative">
            <img src={value} alt="" className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10" />
          </div>
        )}
        <input
          type="url"
          placeholder="https://... or upload"
          value={value}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          className="flex-1 glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm transition-all"
        />
        <label className="p-3 glass glass-hover rounded-xl cursor-pointer btn-transition">
          <Upload className="w-5 h-5 text-zinc-400" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, field)}
            disabled={uploading}
          />
        </label>
        {value && (
          <button
            onClick={() => setForm({ ...form, [field]: "" })}
            className="p-3 glass rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-all"
          >
            <X className="w-5 h-5 text-zinc-400 hover:text-red-400" />
          </button>
        )}
      </div>
    </div>
  );

  // Loading state
  if (profiles === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 animate-fadeIn">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Sempery
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Digital Business Cards</p>
          </div>
          <UserButton afterSignOutUrl="/" />
        </header>

        {/* Alerts */}
        <div className="space-y-3 mb-6">
          {error && (
            <div className="glass border-red-500/50 bg-red-500/10 text-red-200 px-4 py-3 rounded-xl animate-fadeIn flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              {error}
            </div>
          )}
          {success && (
            <div className="glass border-emerald-500/50 bg-emerald-500/10 text-emerald-200 px-4 py-3 rounded-xl animate-fadeIn flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              {success}
            </div>
          )}
          {uploading && (
            <div className="glass border-blue-500/50 bg-blue-500/10 text-blue-200 px-4 py-3 rounded-xl animate-fadeIn flex items-center gap-3">
              <div className="spinner w-4 h-4" />
              Uploading...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile List */}
          <div className="lg:col-span-1 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
            <div className="glass rounded-2xl p-5">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold">Profiles</h2>
                <button
                  onClick={handleCreateNew}
                  className="p-2.5 bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-all btn-transition glow-accent"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {(profiles as Profile[] | undefined)?.map((profile, i) => (
                  <button
                    key={profile._id}
                    onClick={() => setSelectedProfileId(profile._id)}
                    className={`w-full text-left p-4 rounded-xl transition-all btn-transition ${
                      selectedProfileId === profile._id
                        ? "bg-emerald-500/20 border border-emerald-500/50"
                        : "glass glass-hover"
                    }`}
                    style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3">
                      {profile.photoUrl ? (
                        <img src={profile.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                          {profile.displayName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{profile.displayName}</div>
                        <div className="text-sm text-zinc-500 truncate">/{profile.slug}</div>
                      </div>
                    </div>
                  </button>
                ))}

                {profiles?.length === 0 && (
                  <p className="text-zinc-500 text-sm text-center py-8">No profiles yet. Create one!</p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Editor */}
          <div className="lg:col-span-3 animate-fadeIn" style={{ animationDelay: "0.2s" }}>
            {(selectedProfileId || isCreating) ? (
              <div className="glass rounded-2xl p-6 md:p-8">
                {/* Editor Header */}
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {isCreating ? "New Profile" : "Edit Profile"}
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                      {isCreating ? "Create a new digital business card" : "Update your profile information"}
                    </p>
                  </div>
                  {selectedProfileId && primaryCardId && (
                    <a
                      href={`/c/${primaryCardId}`}
                      target="_blank"
                      className="p-3 glass glass-hover rounded-xl transition-all btn-transition"
                      title="View profile"
                    >
                      <Eye className="w-5 h-5" />
                    </a>
                  )}
                </div>

                {/* Card URL */}
                {primaryCardId && (
                  <div className="glass rounded-xl p-5 mb-8 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-emerald-400 font-medium mb-1">NFC Card URL</p>
                        <code className="text-white font-mono text-sm">sempery.io/c/{primaryCardId}</code>
                      </div>
                      <button
                        onClick={copyUrl}
                        className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all btn-transition ${
                          copied
                            ? "bg-emerald-500 text-white"
                            : "glass glass-hover"
                        }`}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-8">
                  {/* Basic Info Section */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isCreating && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-zinc-400">Slug (URL)</label>
                          <input
                            type="text"
                            placeholder="john-doe"
                            value={form.slug}
                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                            className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 transition-all"
                          />
                        </div>
                      )}
                      <div className={`space-y-2 ${isCreating ? "" : "md:col-span-2"}`}>
                        <label className="block text-sm font-medium text-zinc-400">Full Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={form.displayName}
                          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                          className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">Title</label>
                        <input
                          type="text"
                          placeholder="Software Engineer"
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">Company</label>
                        <input
                          type="text"
                          placeholder="Acme Inc."
                          value={form.company}
                          onChange={(e) => setForm({ ...form, company: e.target.value })}
                          className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-medium text-zinc-400">Bio</label>
                      <textarea
                        placeholder="A brief description about yourself..."
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        rows={3}
                        className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 resize-none transition-all"
                      />
                    </div>
                    <div className="mt-4">
                      <ImageUpload label="Profile Photo" value={form.photoUrl} field="photoUrl" />
                    </div>
                  </section>

                  {/* Contact Info Section */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-blue-500 rounded-full" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">Phone</label>
                        <input
                          type="tel"
                          placeholder="+1 234 567 8900"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">Email</label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          value={form.contactEmail}
                          onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                          className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-medium text-zinc-400">Website</label>
                      <input
                        type="url"
                        placeholder="https://mywebsite.com"
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 transition-all"
                      />
                    </div>
                  </section>

                  {/* Social Links Section */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-purple-500 rounded-full" />
                      Social Links
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">LinkedIn</label>
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/..."
                          value={form.linkedin}
                          onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                          className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">Instagram</label>
                        <input
                          type="url"
                          placeholder="https://instagram.com/..."
                          value={form.instagram}
                          onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                          className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">Twitter/X</label>
                        <input
                          type="url"
                          placeholder="https://twitter.com/..."
                          value={form.twitter}
                          onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                          className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">GitHub</label>
                        <input
                          type="url"
                          placeholder="https://github.com/..."
                          value={form.github}
                          onChange={(e) => setForm({ ...form, github: e.target.value })}
                          className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 transition-all"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Appearance Section */}
                  <section>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-orange-500 rounded-full" />
                      Appearance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">Theme</label>
                        <select
                          value={form.theme}
                          onChange={(e) => setForm({ ...form, theme: e.target.value as "light" | "dark" })}
                          className="w-full glass rounded-xl px-4 py-3 text-white transition-all"
                        >
                          <option value="dark">Dark</option>
                          <option value="light">Light</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-400">Accent Color</label>
                        <div className="flex gap-3">
                          <input
                            type="color"
                            value={form.accentColor}
                            onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                            className="w-14 h-12 glass rounded-xl cursor-pointer"
                          />
                          <input
                            type="text"
                            value={form.accentColor}
                            onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                            className="flex-1 glass rounded-xl px-4 py-3 text-white font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Advanced Branding (Collapsible) */}
                  {!isCreating && (
                    <section>
                      <button
                        onClick={() => setShowBranding(!showBranding)}
                        className="w-full flex items-center justify-between py-4 px-5 glass glass-hover rounded-xl transition-all"
                      >
                        <span className="font-semibold flex items-center gap-2">
                          <div className="w-1 h-5 bg-pink-500 rounded-full" />
                          Advanced Branding
                        </span>
                        {showBranding ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>

                      {showBranding && (
                        <div className="mt-4 space-y-6 p-5 glass rounded-xl animate-fadeIn">
                          <ImageUpload label="Company Logo" value={form.logoUrl} field="logoUrl" />

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-zinc-400">Logo Position</label>
                            <select
                              value={form.logoPosition}
                              onChange={(e) => setForm({ ...form, logoPosition: e.target.value as "top" | "bottom" })}
                              className="w-full glass rounded-xl px-4 py-3 text-white"
                            >
                              <option value="top">Top</option>
                              <option value="bottom">Bottom</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-zinc-400">Background Color</label>
                            <div className="flex gap-3">
                              <input
                                type="color"
                                value={form.backgroundColor || "#09090b"}
                                onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                                className="w-14 h-12 glass rounded-xl cursor-pointer"
                              />
                              <input
                                type="text"
                                placeholder="#09090b"
                                value={form.backgroundColor}
                                onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                                className="flex-1 glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 font-mono text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-zinc-400">CSS Gradient</label>
                            <input
                              type="text"
                              placeholder="linear-gradient(135deg, #10b981, #059669)"
                              value={form.backgroundGradient}
                              onChange={(e) => setForm({ ...form, backgroundGradient: e.target.value })}
                              className="w-full glass rounded-xl px-4 py-3 text-white placeholder-zinc-500 font-mono text-sm"
                            />
                          </div>

                          <ImageUpload label="Background Image" value={form.backgroundImageUrl} field="backgroundImageUrl" preview={false} />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-zinc-400">Button Style</label>
                              <select
                                value={form.buttonStyle}
                                onChange={(e) => setForm({ ...form, buttonStyle: e.target.value as "solid" | "outline" | "gradient" })}
                                className="w-full glass rounded-xl px-4 py-3 text-white"
                              >
                                <option value="solid">Solid</option>
                                <option value="outline">Outline</option>
                                <option value="gradient">Gradient</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-zinc-400">Button Radius</label>
                              <select
                                value={form.buttonRadius}
                                onChange={(e) => setForm({ ...form, buttonRadius: e.target.value as "none" | "sm" | "md" | "lg" | "full" })}
                                className="w-full glass rounded-xl px-4 py-3 text-white"
                              >
                                <option value="none">Square</option>
                                <option value="sm">Small</option>
                                <option value="md">Medium</option>
                                <option value="lg">Large</option>
                                <option value="full">Pill</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-zinc-400">Card Style</label>
                            <select
                              value={form.cardStyle}
                              onChange={(e) => setForm({ ...form, cardStyle: e.target.value as "solid" | "glass" | "transparent" })}
                              className="w-full glass rounded-xl px-4 py-3 text-white"
                            >
                              <option value="solid">Solid</option>
                              <option value="glass">Glass</option>
                              <option value="transparent">Transparent</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* Save Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleSave}
                      disabled={uploading}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all btn-transition glow-accent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? "Create Profile" : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Profile Selected</h3>
                <p className="text-zinc-500 mb-6 text-center">Select a profile from the sidebar or create a new one</p>
                <button
                  onClick={handleCreateNew}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all btn-transition glow-accent flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
