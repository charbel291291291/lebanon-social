import coverVillage from "@/assets/cover-village.jpg";
import postManoushe from "@/assets/post-manoushe.jpg";
import postBeirut from "@/assets/post-beirut.jpg";

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
];

export type Post = {
  id: string;
  author: string;
  handle: string;
  initials: string;
  verified?: boolean;
  place: string;
  time: string;
  body: string;
  image?: string;
  tag: string;
  counts: { reactions: number; comments: number; shares: number };
  poll?: { question: string; options: { label: string; votes: number }[] };
};

export const stories = [
  { id: "s0", name: "Your story", initials: "YO", self: true, cover: coverVillage },
  { id: "s1", name: "Rana", initials: "RA", cover: postBeirut },
  { id: "s2", name: "Karim", initials: "KA", cover: coverVillage },
  { id: "s3", name: "Zeina", initials: "ZE", cover: postManoushe },
  { id: "s4", name: "AUB Club", initials: "AU", cover: postBeirut },
  { id: "s5", name: "Batroun", initials: "BA", cover: coverVillage },
];

export const posts: Post[] = [
  {
    id: "p1",
    author: "Rana Khoury",
    handle: "@rana.k",
    initials: "RK",
    verified: true,
    place: "Batroun, North",
    time: "12m",
    body: "Sunset from the old souk never gets old. Who's joining the Saturday hike from Douma to Tannourine? 🌲",
    image: coverVillage,
    tag: "Tourism",
    counts: { reactions: 1240, comments: 86, shares: 21 },
  },
  {
    id: "p2",
    author: "Manoushe Society",
    handle: "@manoushe.society",
    initials: "MS",
    verified: true,
    place: "Beirut · Food",
    time: "48m",
    body: "منقوشة زعتر with extra mint — the eternal Lebanese breakfast. Drop your neighborhood's best furn 👇",
    image: postManoushe,
    tag: "Food",
    counts: { reactions: 3120, comments: 412, shares: 96 },
  },
  {
    id: "p3",
    author: "Karim Aoun",
    handle: "@karim.aoun",
    initials: "KA",
    place: "Hamra, Beirut",
    time: "2h",
    body: "Poll for the AUB crowd: where are we studying for finals week?",
    tag: "Universities",
    counts: { reactions: 410, comments: 132, shares: 8 },
    poll: {
      question: "Best late-night study spot in Hamra",
      options: [
        { label: "Jafet Library", votes: 58 },
        { label: "Cafe Younes", votes: 27 },
        { label: "Rooftop at home", votes: 15 },
      ],
    },
  },
  {
    id: "p4",
    author: "Beirut Nights",
    handle: "@beirut.nights",
    initials: "BN",
    verified: true,
    place: "Mar Mikhael",
    time: "5h",
    body: "The corniche at blue hour. Tag someone who owes you a walk from Ain El Mreisseh to Raouché.",
    image: postBeirut,
    tag: "Nightlife",
    counts: { reactions: 2210, comments: 154, shares: 63 },
  },
];

export const trends = [
  { tag: "#MarketDayTripoli", posts: "12.4K posts" },
  { tag: "#CedarsSnow", posts: "9.1K posts" },
  { tag: "#AUBFinals", posts: "7.8K posts" },
  { tag: "#BatrounSunset", posts: "5.2K posts" },
  { tag: "#ShawarmaWars", posts: "4.6K posts" },
];

export const events = [
  { title: "Byblos Summer Festival", when: "Fri · 20:00", place: "Jbeil", going: 4820 },
  { title: "Zeina & Elie's Wedding", when: "Sat · 18:30", place: "Broummana", going: 312 },
  { title: "Tripoli Startup Meetup", when: "Sun · 11:00", place: "El Mina", going: 168 },
];

export const communities = [
  { name: "Achrafieh Neighbors", members: "24.1K", type: "Neighborhood" },
  { name: "Zgharta Village Family", members: "8.7K", type: "Village" },
  { name: "LAU Alumni", members: "31.5K", type: "University" },
  { name: "Lebanese Home Cooks", members: "58.2K", type: "Food" },
];