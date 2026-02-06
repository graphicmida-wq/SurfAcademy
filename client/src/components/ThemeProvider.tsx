import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined
);

function getTimeBasedTheme(): Theme {
  const hour = new Date().getHours();
  return (hour >= 7 && hour < 20) ? "light" : "dark";
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme-mode");
    if (stored === "light" || stored === "dark") return stored;
    return getTimeBasedTheme();
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme-mode", newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    const checkTime = () => {
      const stored = localStorage.getItem("theme-mode");
      if (!stored) {
        setThemeState(getTimeBasedTheme());
      }
    };
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
