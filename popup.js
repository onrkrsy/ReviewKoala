document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get(['apiKey', 'guidelines'], (result) => {
    if (result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
    }
    if (result.guidelines) {
      document.getElementById('guidelines').value = result.guidelines;
    }
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    const guidelines = document.getElementById('guidelines').value;

    if (!apiKey) {
      alert('Please enter your OpenAI API key');
      return;
    }

    chrome.storage.sync.set({
      apiKey: apiKey,
      guidelines: guidelines
    }, () => {
      alert('Settings saved successfully!');
    });
  });
}); 