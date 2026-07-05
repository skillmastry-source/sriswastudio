import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useGetCart, getGetCartQueryKey } from '@workspace/api-client-react';

type CartContextType = {
  sessionId: string;
  itemCount: number;
  isDrawerOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    let id = localStorage.getItem('sriswa_cart_session');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('sriswa_cart_session', id);
    }
    setSessionId(id);
  }, []);

  const { data: cart } = useGetCart(
    { sessionId }, 
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
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
