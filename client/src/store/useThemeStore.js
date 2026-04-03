import { create } from "zustand";
import { persist } from "zustand/middleware";

const useThemeStore = create(
  persist(
    (set) => ({
      theme: "dark", // 'light' | 'dark'
      chatBackground: "default", // 'default' | 'cyan' | 'emerald' | 'rose'
      
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === "dark" ? "light" : "dark";
          document.documentElement.classList.toggle("light", newTheme === "light");
          return { theme: newTheme };
        }),
      
      setChatBackground: (bg) => set({ chatBackground: bg }),

      initTheme: () => {
        const theme = useThemeStore.getState().theme;
        document.documentElement.classList.toggle("light", theme === "light");
      },
    }),
    {
      name: "theme-storage",
    }
  )
);

export default useThemeStore;
