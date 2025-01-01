// Extension yüklendiğinde çalışacak
chrome.runtime.onInstalled.addListener(() => {
  // Varsayılan ayarları belirle
  chrome.storage.sync.get(['apiKey', 'azurePat', 'guidelines'], (result) => {
    const defaults = {
      apiKey: 'sk-',
      guidelines: `
1. Kod kalitesi ve best practice'leri kontrol et
2. Güvenlik açıkları olup olmadığını kontrol et
3. Performans iyileştirmeleri öner
4. Kodun okunabilirliğini değerlendir
5. Test coverage'ı kontrol et
      `.trim()
    };

    // Sadece eksik olan değerleri ayarla
    const updates = {};
    for (const [key, value] of Object.entries(defaults)) {
      if (!result[key]) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length > 0) {
      chrome.storage.sync.set(updates);
    }
  });
});

// Content script ile iletişim
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSettings') {
    chrome.storage.sync.get(['apiKey', 'guidelines'], (result) => {
      sendResponse(result);
    });
    return true;
  }
}); 