import { API_BASE_URL } from "./api";

/** Supabase storage path for an object in the avatar bucket. */
const STORAGE_MARKER = "/storage/v1/object/public/profile-avatars/";

/**
 * Browser-safe src for a stored avatar URL.
 *
 * Avatars uploaded through the client app are saved as the storage host's own
 * public URL, and that host is plain http with no TLS. An http image on this
 * https console is blocked as mixed content, so the picture silently vanishes
 * and the initials fallback shows instead.
 *
 * The API streams the same bytes over https from its own origin, so rewrite
 * those URLs to `/api/avatar/profile-avatars/<path>`. Anything already served
 * over https (Google pictures, avatars the console uploaded itself) is handed
 * back untouched.
 */
export function avatarSrc(url?: string | null): string | undefined {
  if (!url) return undefined;

  const marker = url.indexOf(STORAGE_MARKER);
  if (marker !== -1) {
    const path = url.slice(marker + STORAGE_MARKER.length);
    return `${API_BASE_URL}/avatar/profile-avatars/${path}`;
  }

  // A non-storage http URL cannot be rescued here; let it through so the
  // caller's onError fallback still runs rather than hiding the problem.
  return url;
}
