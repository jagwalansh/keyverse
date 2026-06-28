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
