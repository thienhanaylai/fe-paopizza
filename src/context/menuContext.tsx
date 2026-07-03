"use client";

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";
import { getMenuByStoreId, MenuData } from "../services/menu.service";

interface MenuContextType {
  fetchMenu: (storeId: string) => Promise<void>;
  menu: MenuData | null;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuData | null>(null);

  const fetchMenu = useCallback(async (storeId: string) => {
    if (!storeId) return;
    try {
      const data = await getMenuByStoreId(storeId);
      setMenu(data);
    
      return data;
    } catch (error) {
      console.error("Lỗi khi tải menu:", error);
    }
  }, []);

  const value = useMemo(() => ({ fetchMenu, menu }), [fetchMenu, menu]);

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu phải được sử dụng bên trong MenuProvider");
  }
  return context;
}
