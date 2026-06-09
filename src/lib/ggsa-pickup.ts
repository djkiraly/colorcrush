// Concession-stand pickup scheduling for the GGSA promo page.
//
// Game nights are Monday(1)–Thursday(4) (Sunday = 0 … Saturday = 6).
// Per the GGSA's request, pickup ALWAYS rolls forward to the *next* game
// night after the order is placed — there is no same-night/cutoff window.
// So a Monday order is ready Tuesday; a Thursday/Friday/Saturday/Sunday order
// is ready the following Monday.

export const GAME_NIGHTS = [1, 2, 3, 4] as const;

export const GGSA_PICKUP_NOTICE =
  "Orders will be available for pickup at the concession stand on the next " +
  "game night. Game nights are Monday–Thursday. Orders placed Thursday " +
  "will be available the following Monday.";

/**
 * Returns the next concession-stand pickup date (start of day) for a given
 * order time. Always advances at least one calendar day, then keeps walking
 * forward until it lands on a game night (Mon–Thu).
 */
export function getNextPickupDate(orderedAt: Date = new Date()): Date {
  const next = startOfDay(orderedAt);
  do {
    next.setDate(next.getDate() + 1);
  } while (!(GAME_NIGHTS as readonly number[]).includes(next.getDay()));
  return next;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Human-readable pickup label, e.g. "Monday, June 9". */
export function formatPickupDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
