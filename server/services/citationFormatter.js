export function formatCitations(results = []) {
  return results.map((item, index) => {
    const domain = (() => {
      try {
        return new URL(item.url || item.link || "").hostname.replace("www.", "");
      } catch {
        return "";
      }
    })();

    return {
      id: index + 1,
      number: `[${index + 1}]`,
      title: item.title || "",
      snippet: item.snippet || "",
      url: item.url || item.link || "",
      domain,
      favicon: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
      source: item.source || domain,
      published: item.date || "",
      verified: true,
    };
  });
}