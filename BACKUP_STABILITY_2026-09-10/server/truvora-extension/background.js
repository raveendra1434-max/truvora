chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url) return;

  const youtubeUrl = encodeURIComponent(tab.url);

  chrome.tabs.create({
    url: `http://localhost:3000/?youtube=${youtubeUrl}`
  });
});