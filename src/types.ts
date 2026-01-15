import { Id } from "@convex/_generated/dataModel";

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
  branding?: {
    backgroundColor?: string;
    backgroundGradient?: string;
    backgroundImageUrl?: string;
    logoUrl?: string;
    logoPosition?: "top" | "bottom";
    textColor?: string;
    secondaryTextColor?: string;
    buttonStyle?: "solid" | "outline" | "gradient";
    buttonRadius?: "none" | "sm" | "md" | "lg" | "full";
    cardStyle?: "solid" | "glass" | "transparent";
  };
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
