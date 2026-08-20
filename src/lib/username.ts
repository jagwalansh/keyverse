const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "keyverse",
  "moderator",
  "official",
  "owner",
  "support",
]);

const BLOCKED_USERNAME_PARTS = [
  "asshole",
  "bitch",
  "fuck",
  "hitler",
  "kkk",
  "nazi",
  "porn",
  "shit",
  "terror",
  "xxx",
];

export function validatePublicUsername(username: string) {
  const trimmedUsername = username.trim();
  const normalizedUsername = trimmedUsername.toLowerCase();

  if (trimmedUsername.length < 3) {
    throw new Error("Username must be at least 3 characters.");
  }

  if (trimmedUsername.length > 24) {
    throw new Error("Username must be 24 characters or fewer.");
  }

  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(trimmedUsername)) {
    throw new Error("Use only letters, numbers, underscores, and hyphens.");
  }

  if (RESERVED_USERNAMES.has(normalizedUsername)) {
    throw new Error("That username is reserved.");
  }

  if (BLOCKED_USERNAME_PARTS.some((blockedPart) => normalizedUsername.includes(blockedPart))) {
    throw new Error("Please choose a username suitable for public leaderboards.");
  }

  return trimmedUsername;
}

export const USERNAME_CHANGE_COOLDOWN_DAYS = 14;
export const USERNAME_CHANGE_COOLDOWN_MS = USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export interface UsernameCooldownInfo {
  canChange: boolean;
  remainingDays: number;
  lastChangedDate: Date | null;
  nextAllowedDate: Date | null;
}

export function getUsernameCooldownInfo(
  profile: { username?: string | null; created_at?: string | null; updated_at?: string | null } | null,
): UsernameCooldownInfo {
  if (!profile?.username || !profile.updated_at) {
    return { canChange: true, remainingDays: 0, lastChangedDate: null, nextAllowedDate: null };
  }

  const createdAt = profile.created_at ? new Date(profile.created_at).getTime() : 0;
  const updatedAt = new Date(profile.updated_at).getTime();

  // If updated_at is within 10 seconds of created_at, treat as initial profile creation
  if (Math.abs(updatedAt - createdAt) < 10000) {
    return { canChange: true, remainingDays: 0, lastChangedDate: null, nextAllowedDate: null };
  }

  const elapsed = Date.now() - updatedAt;
  if (elapsed < USERNAME_CHANGE_COOLDOWN_MS) {
    const remainingDays = Math.ceil((USERNAME_CHANGE_COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
    const nextAllowedDate = new Date(updatedAt + USERNAME_CHANGE_COOLDOWN_MS);
    return {
      canChange: false,
      remainingDays,
      lastChangedDate: new Date(updatedAt),
      nextAllowedDate,
    };
  }

  return {
    canChange: true,
    remainingDays: 0,
    lastChangedDate: new Date(updatedAt),
    nextAllowedDate: null,
  };
}
