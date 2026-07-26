"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

type CartSidebarContextType = {
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

const CartSidebarContext = createContext<CartSidebarContextType | undefined>(undefined);

export function CartSidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);
  const toggleCart = useCallback(() => setOpen((v) => !v), []);

  return (
    <CartSidebarContext.Provider value={{ open, openCart, closeCart, toggleCart }}>
      {children}
    </CartSidebarContext.Provider>
  );
}

export function useCartSidebar() {
  const context = useContext(CartSidebarContext);
  if (!context) throw new Error("useCartSidebar must be used within CartSidebarProvider");
  return context;
}
