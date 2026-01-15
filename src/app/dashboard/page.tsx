"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "@convex/_generated/dataModel";
import { Profile } from "@/types";
import { Plus, Eye, LogOut } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  const profiles = useQuery(api.profiles.list);
  const createProfile = useMutation(api.profiles.create);
  const updateProfile = useMutation(api.profiles.update);

  const [selectedProfileId, setSelectedProfileId] = useState<Id<"profiles"> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    accentColor: "#3b82f6",
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
        accentColor: selectedProfile.accentColor || "#3b82f6",
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
      accentColor: "#3b82f6",
    });
  };

  const handleCreateNew = () => {
    resetForm();
    setSelectedProfileId(null);
    setIsCreating(true);
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

      if (isCreating) {
        // Create new profile
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
        setSuccess("Profilo creato!");
      } else if (selectedProfileId) {
        // Update existing profile
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
        });
        setSuccess("Profilo aggiornato!");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Sempery Dashboard</h1>
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile List */}
          <div className="md:col-span-1">
            <div className="bg-zinc-900 rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Profili</h2>
                <button
                  onClick={handleCreateNew}
                  className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {(profiles as Profile[] | undefined)?.map((profile) => (
                  <button
                    key={profile._id}
                    onClick={() => setSelectedProfileId(profile._id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedProfileId === profile._id
                        ? "bg-blue-600"
                        : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
                  >
                    <div className="font-medium">{profile.displayName}</div>
                    <div className="text-sm text-zinc-400">/{profile.slug}</div>
                  </button>
                ))}

                {profiles?.length === 0 && (
                  <p className="text-zinc-500 text-sm">Nessun profilo. Creane uno!</p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Editor */}
          <div className="md:col-span-2">
            {(selectedProfileId || isCreating) ? (
              <div className="bg-zinc-900 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {isCreating ? "Nuovo Profilo" : "Modifica Profilo"}
                  </h2>
                  {selectedProfileId && primaryCardId && (
                    <a
                      href={`/c/${primaryCardId}`}
                      target="_blank"
                      className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                      title="Visualizza profilo"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Card URL Section */}
                {primaryCardId && (
                  <div className="bg-zinc-800 rounded-lg p-4 mb-6">
                    <h3 className="font-medium mb-2">URL Card NFC</h3>
                    <div className="flex gap-2 items-center">
                      <code className="flex-1 bg-zinc-900 rounded-lg px-4 py-2 text-green-400 text-sm">
                        sempery.io/c/{primaryCardId}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://sempery.io/c/${primaryCardId}`);
                          setSuccess("URL copiato!");
                          setTimeout(() => setSuccess(null), 2000);
                        }}
                        className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Copia
                      </button>
                    </div>
                    <p className="text-sm text-zinc-500 mt-2">
                      Scrivi questo URL sulla card NFC con NFC Tools
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    {isCreating && (
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Slug (URL)</label>
                        <input
                          type="text"
                          placeholder="mario-rossi"
                          value={form.slug}
                          onChange={(e) => setForm({ ...form, slug: e.target.value })}
                          className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                        />
                      </div>
                    )}
                    <div className={isCreating ? "" : "col-span-2"}>
                      <label className="block text-sm text-zinc-400 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        placeholder="Mario Rossi"
                        value={form.displayName}
                        onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                        className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Ruolo</label>
                      <input
                        type="text"
                        placeholder="Software Engineer"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Azienda</label>
                      <input
                        type="text"
                        placeholder="Acme Inc."
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Bio</label>
                    <textarea
                      placeholder="Una breve descrizione..."
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      rows={3}
                      className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">URL Foto</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={form.photoUrl}
                      onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                      className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                    />
                  </div>

                  {/* Contact Info */}
                  <h3 className="text-lg font-medium pt-4">Contatti</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Telefono</label>
                      <input
                        type="tel"
                        placeholder="+39 123 456 7890"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="mario@example.com"
                        value={form.contactEmail}
                        onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                        className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Sito Web</label>
                    <input
                      type="url"
                      placeholder="https://miosito.com"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                    />
                  </div>

                  {/* Social Links */}
                  <h3 className="text-lg font-medium pt-4">Social</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">LinkedIn</label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={form.linkedin}
                        onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                        className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Instagram</label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/..."
                        value={form.instagram}
                        onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                        className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Twitter/X</label>
                      <input
                        type="url"
                        placeholder="https://twitter.com/..."
                        value={form.twitter}
                        onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                        className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">GitHub</label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={form.github}
                        onChange={(e) => setForm({ ...form, github: e.target.value })}
                        className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">TikTok</label>
                      <input
                        type="url"
                        placeholder="https://tiktok.com/@..."
                        value={form.tiktok}
                        onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
                        className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">YouTube</label>
                      <input
                        type="url"
                        placeholder="https://youtube.com/@..."
                        value={form.youtube}
                        onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                        className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white placeholder-zinc-500"
                      />
                    </div>
                  </div>

                  {/* Appearance */}
                  <h3 className="text-lg font-medium pt-4">Aspetto</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Tema</label>
                      <select
                        value={form.theme}
                        onChange={(e) => setForm({ ...form, theme: e.target.value as "light" | "dark" })}
                        className="w-full bg-zinc-800 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Colore Accent</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={form.accentColor}
                          onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                          className="w-12 h-10 bg-zinc-800 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={form.accentColor}
                          onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                          className="flex-1 bg-zinc-800 rounded-lg px-4 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-6">
                    <button
                      onClick={handleSave}
                      className="w-full py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      {isCreating ? "Crea Profilo" : "Salva Modifiche"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-xl p-6 flex flex-col items-center justify-center h-64">
                <p className="text-zinc-500 mb-4">Seleziona un profilo o creane uno nuovo</p>
                <button
                  onClick={handleCreateNew}
                  className="px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Nuovo Profilo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
