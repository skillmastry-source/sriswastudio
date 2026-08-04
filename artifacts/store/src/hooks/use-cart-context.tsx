import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useGetCart, getGetCartQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

type CartContextType = {
  sessionId: string;
  itemCount: number;
  isDrawerOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

/** BroadcastChannel name used to sync cart invalidations across tabs. */
export const CART_CHANNEL = 'sriswa_cart_update';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let id = localStorage.getItem('sriswa_cart_session');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('sriswa_cart_session', id);
    }
    setSessionId(id);
  }, []);

  // Listen for cart-update broadcasts from other tabs and invalidate locally.
  useEffect(() => {
    if (!sessionId || typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(CART_CHANNEL);
    channel.onmessage = (event) => {
      if (event.data?.sessionId === sessionId) {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
      }
    };
    return () => channel.close();
  }, [sessionId, queryClient]);

  const { data: cart } = useGetCart(
    { sessionId },
    {
      query: {
        enabled: !!sessionId,
        queryKey: getGetCartQueryKey({ sessionId }),
        // Re-fetch when the tab regains focus so the count is always fresh
        // after the user returns from another tab.
        refetchOnWindowFocus: true,
        // Treat data as stale after 30 seconds so background refetch runs
        // quickly once focus is regained.
        staleTime: 30_000,
        // Poll every 60 seconds as a last-resort fallback.
        refetchInterval: 60_000,
      },
    }
  );

  return (
    <CartContext.Provider value={{ 
      sessionId, 
      itemCount: cart?.itemCount || 0,
      isDrawerOpen,
      openCart: () => setIsDrawerOpen(true),
      closeCart: () => setIsDrawerOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}
