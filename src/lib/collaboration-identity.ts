/** Shared by authentication, comments and presence. All colours pass white AA. */
export const USER_COLORS = [
  "#2563EB",
  "#7C3AED",
  "#BE185D",
  "#0F766E",
  "#C2410C",
  "#15803D",
  "#4338CA",
] as const;
function hashId(id: string) {
  let hash = 0;
  for (const char of id) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
}
export function authorColor(id: string) {
  return USER_COLORS[hashId(id) % USER_COLORS.length];
}
export function guestName(id: string) {
  const adjectives = [
    "Swift",
    "Clever",
    "Bold",
    "Quiet",
    "Bright",
    "Keen",
    "Calm",
    "Brave",
  ];
  const nouns = [
    "Writer",
    "Author",
    "Scribe",
    "Wordsmith",
    "Poet",
    "Editor",
    "Storyteller",
    "Narrator",
  ];
  const hash = hashId(id);
  return `${adjectives[hash % 8]} ${nouns[Math.floor(hash / 8) % 8]}`;
}
export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
export function identityAvatar(id: string, name: string) {
  const letters = initials(name).replace(/[<>&"']/g, "");
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="5" fill="${authorColor(id)}"/><text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="12" font-weight="700">${letters}</text></svg>`)}`;
}
