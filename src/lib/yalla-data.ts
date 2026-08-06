export const reactions = [
  { key: "like", label: "Like", emoji: "👍" },
  { key: "love", label: "Love", emoji: "❤️" },
  { key: "cedar", label: "Cedar", emoji: "🌲" },
  { key: "fire", label: "Fire", emoji: "🔥" },
  { key: "laugh", label: "Laugh", emoji: "😂" },
  { key: "wow", label: "Wow", emoji: "😮" },
  { key: "support", label: "Support", emoji: "🤝" },
] as const;

export type ReactionKey = (typeof reactions)[number]["key"];

export const governorates = [
  "Beirut",
  "Mount Lebanon",
  "North",
  "South",
  "Bekaa",
  "Nabatieh",
  "Akkar",
  "Baalbek-Hermel",
] as const;

export const postTags = [
  "General",
  "Tourism",
  "Food",
  "Universities",
  "Nightlife",
  "Neighborhoods",
  "Events",
  "Businesses",
  "Music",
  "Sports",
] as const;

export type PostTag = (typeof postTags)[number];
