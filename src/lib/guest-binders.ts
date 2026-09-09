// Local-only binders for people who haven't signed up yet. Stored in the
// browser; offered for import on sign-up. Kept deliberately small.

export type GuestCard = {
  id: string;
  tcg_api_id: string | null;
  name: string;
  set_name: string | null;
  card_number: string | null;
  image_url: string;
  rarity: string | null;
  types: string | null;
  is_image?: boolean;
  want?: boolean;
};

export type GuestBinder = {
  id: string;
  name: string;
  description: string | null;
  grid_size: string;
  page_labels: Record<string, string>;
  cover_enabled?: boolean;
  cover_image_url?: string | null;
  cover_subtitle?: string | null;
  page_backgrounds?: Record<string, string>;
  cards: GuestCard[];
  created_at: string;
};

const KEY = "easycards.guestBinders.v1";
export const GUEST_BINDER_LIMIT = 2;

export function loadGuestBinders(): GuestBinder[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestBinder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuestBinders(binders: GuestBinder[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(binders));
  } catch {
    // private mode / quota — nothing we can do, the session just won't persist
  }
}

export function clearGuestBinders() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function newGuestBinder(name: string, gridSize = "3x3"): GuestBinder {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `g_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: name.trim() || "Meu Fichário",
    description: null,
    grid_size: gridSize,
    page_labels: {},
    cards: [],
    created_at: new Date().toISOString(),
  };
}
