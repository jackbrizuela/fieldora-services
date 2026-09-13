"use client";

import { useEffect, useState } from "react";

type ThemeName = "day" | "fun" | "night";

const themes: {
  name: ThemeName;
  color: string;
  label: string;
}[] = [
  {
    name: "day",
    color: "#cfd3d8",
    label: "Day theme",
  },
  {
    name: "fun",
    color: "#ff5fa2",
    label: "Fun theme",
  },
  {
    name: "night",
    color: "#343940",
    label: "Night theme",
  },
];

export default function ThemeDots() {
  const [activeTheme, setActiveTheme] = useState<ThemeName>("day");

  useEffect(() => {
    const savedTheme = localStorage.getItem(
      "fieldora-theme"
    ) as ThemeName | null;

    const theme =
      savedTheme === "fun" || savedTheme === "night"
        ? savedTheme
        : "day";

    setActiveTheme(theme);
    document.documentElement.dataset.theme = theme;
  }, []);

  function chooseTheme(theme: ThemeName) {
    setActiveTheme(theme);
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("fieldora-theme", theme);
  }

  return (
    <div className="flex items-center">
      {themes.map((theme) => {
        const active = activeTheme === theme.name;

        return (
          <button
            key={theme.name}
            type="button"
            aria-label={theme.label}
            title={theme.label}
            onClick={() => chooseTheme(theme.name)}
            className="flex h-10 w-7 items-center justify-center"
          >
            <span
              className="block h-3 w-3 rounded-full transition-all duration-200"
              style={{
                backgroundColor: theme.color,
                boxShadow: active
                  ? `0 0 11px 4px ${theme.color}88`
                  : "none",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}