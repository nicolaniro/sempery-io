import { Id } from "../convex/_generated/dataModel";

export type Profile = {
  _id: Id<"profiles">;
  _creationTime: number;
  slug: string;
  displayName: string;
  title?: string;
  company?: string;
  bio?: string;
  photoUrl?: string;
  phone?: string;
  contactEmail?: string;
  website?: string;
  socials?: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    github?: string;
    tiktok?: string;
    youtube?: string;
  };
  theme?: "light" | "dark";
  accentColor?: string;
};

export type Card = {
  _id: Id<"cards">;
  _creationTime: number;
  cardId: string;
  profileId: Id<"profiles">;
  isActive: boolean;
  tapCount: number;
  lastTapAt?: number;
};
