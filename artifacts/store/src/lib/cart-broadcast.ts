import { CART_CHANNEL } from "@/hooks/use-cart-context";

/**
 * Notify all other open tabs that the cart for this session has changed.
 * Call this after every successful cart mutation (add, update, remove, clear).
 * The CartProvider in each tab listens on CART_CHANNEL and invalidates its
 * React Query cache on receipt, keeping counts and drawer contents in sync
 * without a manual refresh.
 */
export function broadcastCartUpdate(sessionId: string): void {
  if (!sessionId || typeof BroadcastChannel === "undefined") return;
  const ch = new BroadcastChannel(CART_CHANNEL);
  ch.postMessage({ sessionId });
  ch.close();
}
