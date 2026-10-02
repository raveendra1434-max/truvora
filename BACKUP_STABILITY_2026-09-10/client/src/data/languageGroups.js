import { languages } from "./languages";

const allLanguages = Array.from(
  new Map(
    languages
      .filter((lang) => lang.code !== "auto")
      .map((lang) => [lang.code, lang])
  ).values()
);

export const languageGroups = [
  {
    label: "🌍 Auto Detect",
    options: [
      {
        value: "auto",
        label: "🌍 Auto Detect",
      },
    ],
  },

  {
    label: "⭐ Favorites",
    options: [
      { value: "en", label: "🇺🇸 English" },
      { value: "hi", label: "🇮🇳 हिन्दी (Hindi)" },
      { value: "te", label: "🇮🇳 తెలుగు (Telugu)" },
      { value: "kn", label: "🇮🇳 ಕನ್ನಡ (Kannada)" },
    ],
  },

  {
    label: "🌎 ALL LANGUAGES",
    options: allLanguages.map((lang) => ({
      value: lang.code,
      label: lang.name,
    })),
  },
];