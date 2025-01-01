// Azure DevOps PR sayfasını kontrol et
function isPullRequestPage() {
  console.log('Checking if PR page:', window.location.href);
  const isPR = window.location.href.includes('/pullrequest/') || window.location.href.includes('_git/pullrequest/');
  console.log('Is PR page:', isPR);
  return isPR;
}

// Files sekmesine geç
async function switchToFilesTab() {
  const filesTab = Array.from(document.querySelectorAll('a[role="tab"]')).find(tab => 
    tab.textContent.toLowerCase().includes('files')
  );
  
  if (filesTab) {
    filesTab.click();
    // Tab değişiminin tamamlanmasını bekle
    await new Promise(resolve => setTimeout(resolve, 500));
  } else {
    throw new Error('Files tab not found');
  }
}

// PR değişikliklerini topla
async function getPRChanges() {
  console.log('Getting PR changes...');

  // Files sekmesine geç
  await switchToFilesTab();

  // Tüm değişiklikleri yükle
  await loadAllChanges();

  // Değişiklikleri topla
  const changes = [];
  
  // Dosya kartlarını bul
  const fileCards = document.querySelectorAll('.repos-summary-header');
  console.log('Found file cards:', fileCards.length);

  for (const card of fileCards) {
    try {
      // Tam dosya yolunu al
      const filePathElement = card.querySelector('.secondary-text.text-ellipsis');
      if (!filePathElement) continue;
      
      const filePath = filePathElement.textContent.trim();
      console.log('Processing file:', filePath);

      // Değişiklikleri al
      const codeChanges = {
        fileName: filePath,
        additions: [],
        deletions: [],
        fullContent: null
      };

      // Değişiklik bölümünü bul
      const diffSection = card.closest('.bolt-card').querySelector('.repos-summary-diff-blocks');
      if (diffSection) {
        // Değişiklik satırlarını topla
        const lines = diffSection.querySelectorAll('.repos-diff-contents-row');
        console.log(`Found ${lines.length} change lines for ${filePath}`);
        
        lines.forEach(line => {
          const content = line.querySelector('.repos-line-content');
          if (!content) return;
          
          const lineContent = content.textContent.trim();
          if (content.classList.contains('added')) {
            codeChanges.additions.push(lineContent);
          } else if (content.classList.contains('deleted')) {
            codeChanges.deletions.push(lineContent);
          }
        });
      }

      if (codeChanges.additions.length > 0 || codeChanges.deletions.length > 0) {
        changes.push(codeChanges);
        console.log(`Added changes for ${filePath}:`, {
          additions: codeChanges.additions.length,
          deletions: codeChanges.deletions.length
        });
      }
    } catch (error) {
      console.error('Error processing file card:', error);
    }
  }

  console.log('Total files with changes:', changes.length);
  return changes;
}

// Tüm değişiklikleri yükle
async function loadAllChanges() {
  console.log('Loading all changes...');
  
  // Scroll container'ı bul
  const scrollContainer = document.querySelector('.repos-changes-viewer');
  if (!scrollContainer) {
    console.log('Scroll container not found');
    return;
  }

  // İlk dosya sayısını al
  const initialFileCount = document.querySelectorAll('.repos-summary-header').length;
  console.log('Initial file count:', initialFileCount);

  // Eğer scroll container'ın yüksekliği viewport'tan küçükse ve dosyalar yüklendiyse erken çık
  if (scrollContainer.scrollHeight <= window.innerHeight && initialFileCount > 0) {
    console.log('Content fits in viewport, no need to scroll');
    return;
  }

  // Tüm sayfayı yüklemek için scroll işlemi
  let isLoading = true;
  let lastHeight = 0;
  let sameHeightCount = 0;
  let lastFileCount = initialFileCount;
  let sameFileCount = 0;
  const maxSameCount = 2;

  while (isLoading) {
    // Önce en üste scroll
    scrollContainer.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Sonra ortaya scroll
    const middlePosition = scrollContainer.scrollHeight / 2;
    scrollContainer.scrollTo(0, middlePosition);
    await new Promise(resolve => setTimeout(resolve, 300));

    // En alta scroll
    scrollContainer.scrollTo(0, scrollContainer.scrollHeight);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mevcut durumu kontrol et
    const currentHeight = scrollContainer.scrollHeight;
    const currentFileCount = document.querySelectorAll('.repos-summary-header').length;

    // Dosya sayısı değişmediyse sayacı artır
    if (currentFileCount === lastFileCount) {
      sameFileCount++;
    } else {
      sameFileCount = 0;
      lastFileCount = currentFileCount;
    }

    // Yükseklik değişmediyse sayacı artır
    if (currentHeight === lastHeight) {
      sameHeightCount++;
    } else {
      sameHeightCount = 0;
      lastHeight = currentHeight;
    }

    // Her scroll döngüsünde loading mesajını güncelle
    toggleLoadingOverlay(true, `Loading changes... (${currentFileCount} files found)`);

    // Erken çıkış koşulları
    if (
      // Dosya sayısı ve yükseklik bir süredir değişmediyse
      (sameFileCount >= maxSameCount && sameHeightCount >= maxSameCount) ||
      // Veya dosya sayısı değişmedi ve scroll container viewport'tan küçükse
      (sameFileCount >= maxSameCount && scrollContainer.scrollHeight <= window.innerHeight) ||
      // Veya başlangıçta bulunan dosya sayısı hala aynıysa ve 2 denemedir değişmediyse
      (currentFileCount === initialFileCount && sameFileCount >= maxSameCount)
    ) {
      console.log('No more changes detected, stopping scroll');
      isLoading = false;
    }
  }

  console.log('Finished loading all changes');
}

// Seçili metni sakla
let lastSelectedCode = null;

// Seçili kodu al
function getSelectedCode() {
  // Eğer saklanmış seçili alan varsa onu kullan
  if (lastSelectedCode) {
    const temp = lastSelectedCode;
    lastSelectedCode = null; // Kullandıktan sonra temizle
    return temp;
  }

  const selection = window.getSelection();
  if (!selection.toString().trim()) {
    throw new Error('Lütfen incelemek istediğiniz kod bloğunu seçin.');
  }

  return {
    code: selection.toString().trim(),
    context: {
      element: selection.anchorNode.parentElement,
      file: getFileNameFromSelection(selection)
    }
  };
}

// Seçili kodun bulunduğu dosya adını bul
function getFileNameFromSelection(selection) {
  let element = selection.anchorNode.parentElement;
  while (element) {
    const fileHeader = element.querySelector('.secondary-text.text-ellipsis');
    if (fileHeader) {
      return fileHeader.textContent.trim();
    }
    element = element.parentElement;
  }
  return 'Seçili Kod';
}

// Review sonuçlarını sakla
let lastReviewResults = null;
let isReviewMinimized = false;

// Review penceresini minimize et
function minimizeReview() {
  const container = document.querySelector('.ai-review-container');
  const content = container.querySelector('.review-content');
  const infoButton = document.querySelector('.ai-review-info-button');
  
  if (container && content && infoButton) {
    container.style.display = 'none';
    isReviewMinimized = true;
    infoButton.style.display = 'inline-block';
  }
}

// Review penceresini göster
function showReview() {
  const container = document.querySelector('.ai-review-container');
  const infoButton = document.querySelector('.ai-review-info-button');
  
  if (container && infoButton) {
    container.style.display = 'block';
    isReviewMinimized = false;
    infoButton.style.display = 'none';
  }
}

// Review sonuçlarını göster
function showReviewResults(results, title = 'AI Review Suggestions') {
  // Varsa eski review container'ı kaldır
  const existingContainer = document.querySelector('.ai-review-container');
  if (existingContainer) {
    existingContainer.remove();
  }

  const container = document.createElement('div');
  container.className = 'ai-review-container';
  container.style.cssText = `
    position: fixed;
    right: 20px;
    top: 20px;
    width: 500px;
    max-height: 80vh;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
    overflow-y: auto;
  `;

  // CSS stil tanımları
  const style = document.createElement('style');
  style.textContent = `
    .ai-review-container code {
      background-color: #f6f8fa;
      border-radius: 3px;
      padding: 2px 5px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }
    .ai-review-container pre {
      background-color: #f6f8fa;
      border-radius: 6px;
      padding: 16px;
      overflow-x: auto;
      margin: 8px 0;
      border: 1px solid #e1e4e8;
    }
    .ai-review-container pre code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      white-space: pre;
    }
    .ai-review-container h3 {
      border-bottom: 1px solid #e1e4e8;
      padding-bottom: 8px;
      margin: 16px 0 8px 0;
      color: #24292e;
    }
    .ai-review-container .error-text {
      color: #d73a49;
      font-weight: 500;
    }
    .ai-review-container .suggestion {
      background-color: #f1f8ff;
      border-left: 4px solid #0366d6;
      padding: 8px 12px;
      margin: 8px 0;
    }
    .ai-review-container .file-path {
      color: #0366d6;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }
  `;
  document.head.appendChild(style);

  // Başlık ve butonlar
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  `;

  const titleElement = document.createElement('h3');
  titleElement.textContent = title;
  titleElement.style.margin = '0';

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 10px;
  `;

  const minimizeButton = document.createElement('button');
  minimizeButton.textContent = '_';
  minimizeButton.title = 'Minimize';
  minimizeButton.style.cssText = `
    border: none;
    background: none;
    font-size: 20px;
    cursor: pointer;
    padding: 5px;
  `;
  minimizeButton.onclick = minimizeReview;

  const deleteButton = document.createElement('button');
  deleteButton.textContent = '🗑';
  deleteButton.title = 'Delete Review';
  deleteButton.style.cssText = `
    border: none;
    background: none;
    font-size: 16px;
    cursor: pointer;
    padding: 5px;
  `;
  deleteButton.onclick = () => {
    container.remove();
    lastReviewResults = null;
    const infoButton = document.querySelector('.ai-review-info-button');
    if (infoButton) infoButton.remove();
  };

  buttonContainer.appendChild(minimizeButton);
  buttonContainer.appendChild(deleteButton);

  header.appendChild(titleElement);
  header.appendChild(buttonContainer);

  // Review içeriği
  const content = document.createElement('div');
  content.className = 'review-content';
  content.style.cssText = `
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.5;
    color: #24292e;
  `;
  
  // Markdown formatlaması
  const formattedText = results
    // Kod blokları (```)
    .replace(/```([\s\S]*?)```/g, (match, code) => 
      `<pre><code>${code.trim()}</code></pre>`
    )
    // Inline kod (`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Başlıklar
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    // Kalın
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // İtalik
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Dosya yolları
    .replace(/\*\*Dosya:\*\* (.*?)(\n|$)/g, '<strong>Dosya:</strong> <span class="file-path">$1</span>$2')
    // Kırmızı hata metinleri
    .replace(/<span style="color: red">(.*?)<\/span>/g, '<span class="error-text">$1</span>')
    // Öneriler
    .replace(/\*\*Öneri:\*\* (.*?)(\n|$)/g, '<div class="suggestion"><strong>Öneri:</strong> $1</div>$2')
    // Liste öğeleri
    .replace(/^- (.*$)/gm, '• $1')
    // Satır sonları
    .replace(/\n/g, '<br>');

  content.innerHTML = formattedText;

  container.appendChild(header);
  container.appendChild(content);
  document.body.appendChild(container);

  // Info butonu
  const infoButton = document.createElement('button');
  infoButton.className = 'ai-review-info-button';
  infoButton.title = 'Show Review';
  infoButton.style.cssText = `
    position: fixed;
    right: 20px;
    bottom: 20px;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    display: none;
    z-index: 1000;
    padding: 0;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Koala ikonunu ekle
  const iconImg = document.createElement('img');
  const iconUrl = chrome.runtime.getURL('images/icon32.png');
  console.log('Loading icon from:', iconUrl);
  iconImg.src = iconUrl;
  iconImg.style.cssText = `
    width: 32px;
    height: 32px;
    opacity: 0.8;
    pointer-events: none;
  `;

  // Hover efekti
  infoButton.addEventListener('mouseover', () => {
    infoButton.style.background = '#e8e8e8';
    iconImg.style.opacity = '1';
  });

  infoButton.addEventListener('mouseout', () => {
    infoButton.style.background = '#f5f5f5';
    iconImg.style.opacity = '0.8';
  });

  infoButton.appendChild(iconImg);
  infoButton.onclick = showReview;
  document.body.appendChild(infoButton);
}

// Loading overlay'i göster/gizle
function toggleLoadingOverlay(show, message = '') {
  let overlay = document.querySelector('.ai-review-loading-overlay');
  
  if (show) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'ai-review-loading-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;

      const spinnerContainer = document.createElement('div');
      spinnerContainer.style.cssText = `
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        position: relative;
      `;

      // Azure DevOps spinner stilini kullan
      const spinner = document.createElement('div');
      spinner.className = 'ms-Spinner';
      spinner.style.cssText = `
        width: 100%;
        height: 100%;
        border: 3px solid #0078d4;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spinner-rotation 1s infinite linear;
      `;

      const style = document.createElement('style');
      style.textContent = `
        @keyframes spinner-rotation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);

      const messageElement = document.createElement('div');
      messageElement.className = 'loading-message';
      messageElement.style.cssText = `
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        color: #333;
        margin-bottom: 16px;
      `;

      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel Review';
      cancelButton.className = 'cancel-review-button';
      cancelButton.style.cssText = `
        background: #d73a49;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
      `;
      cancelButton.onclick = () => {
        if (window.currentReviewController) {
          window.currentReviewController.abort();
        }
        toggleLoadingOverlay(false);
      };

      spinnerContainer.appendChild(spinner);
      overlay.appendChild(spinnerContainer);
      overlay.appendChild(messageElement);
      overlay.appendChild(cancelButton);
      document.body.appendChild(overlay);
    }

    overlay.querySelector('.loading-message').textContent = message;
    overlay.style.display = 'flex';
  } else if (overlay) {
    overlay.style.display = 'none';
  }
}

// Review işlemini iptal etmek için controller
let currentReviewController = null;

// OpenAI API ile review yap
async function reviewWithOpenAI(changes, guidelines, isPRReview = true) {
  // Önceki controller'ı temizle
  if (window.currentReviewController) {
    window.currentReviewController.abort();
  }
  
  // Yeni controller oluştur
  window.currentReviewController = new AbortController();
  const signal = window.currentReviewController.signal;

  try {
    const apiKey = await new Promise((resolve) => {
      chrome.storage.sync.get(['apiKey'], (result) => resolve(result.apiKey));
    });

    if (!apiKey) {
      throw new Error('OpenAI API key is not set. Please set it in the extension settings.');
    }

    // Değişiklikleri gruplara böl (her grup için max 5000 token)
    const changeGroups = [];
    let currentGroup = [];
    let currentTokenCount = 0;

    for (const change of changes) {
      // Kabaca token sayısını hesapla (her karakter ~4 token)
      const changeTokens = JSON.stringify(change).length / 4;
      
      if (currentTokenCount + changeTokens > 5000) {
        changeGroups.push(currentGroup);
        currentGroup = [change];
        currentTokenCount = changeTokens;
      } else {
        currentGroup.push(change);
        currentTokenCount += changeTokens;
      }
    }
    
    if (currentGroup.length > 0) {
      changeGroups.push(currentGroup);
    }

    // Her grup için ayrı review yap
    let allReviews = '';
    for (let i = 0; i < changeGroups.length; i++) {
      const group = changeGroups[i];
      toggleLoadingOverlay(true, `Reviewing group ${i + 1}/${changeGroups.length} (${group.length} files)...`);
      
      const formattedChanges = group.map(change => {
        let changeDescription = `\nFile: ${change.fileName}\n`;
        
        if (change.additions.length > 0) {
          changeDescription += '\nAdditions:\n```\n' + change.additions.join('\n') + '\n```\n';
        }
        
        if (change.deletions.length > 0) {
          changeDescription += '\nDeletions:\n```\n' + change.deletions.join('\n') + '\n```\n';
        }
        
        return changeDescription;
      }).join('\n---\n');

      const prompt = `
        You are a code reviewer. Review the following code changes according to these specific criteria and any additional custom guidelines provided by the user:

        Review Checklist:
        1. Logical Errors: Check for any logical errors or flaws in the implementation
        2. Missing Components: Identify any obvious missing functionality or requirements
        ${isPRReview ? `3. Logging Implementation: Verify if proper logging is implemented (ILoggableRequest should be used ONLY for classes that end with 'Command')` : ''}
        4. Code Duplication: Check for any repeated code that could be refactored
        5. Data Structures: Verify if appropriate data structures are used
        6. Code Readability: Assess if the code is easy to understand
        7. Magic Numbers: Check for any hardcoded numbers that should be constants
        8. Enumeration Usage: Verify if enums are used instead of integer constants where applicable
        9. Performance Optimization: Check if performance-critical code is optimized
        10. Constant Usage: Verify if constants are used where appropriate
        11. Boolean Naming: Check for negative boolean names (should use 'isMatch' instead of 'notMatch')
        12. Dead Code: Look for empty code blocks or unused variables
        13. String Operations: Verify if StringBuilder is used for large string operations
        14. Code Clarity: Assess if the code's purpose is clear
        15. Commented Code: Check for commented-out code
        16. Resource Management: Verify if disposable resources are properly handled (using 'using' statements)
        17. Function Length: Check if functions are too long and properly divided

        ${isPRReview ? `Important Notes:
        - For Logging Implementation (item 3), ONLY check ILoggableRequest interface implementation for classes that end with 'Command' in their name
        - For other classes, ignore the ILoggableRequest check` : ''}

        ${guidelines ? `\nAdditional Custom Guidelines:\n${guidelines}\n` : ''}

        Changes to review:
        ${formattedChanges}

        Please provide your review in Turkish with the following format:
        ### Kontrol Listesi
        For each item in the checklist:
        - Use ✅ for passed items
        - Use ❌ for failed items
        - Format: "- [✅/❌] Kriter Adı"
        
        For each failed item (❌), provide:
        1. File name where the issue occurs
        2. Specific location (line number, function name, or code block)
        3. Explanation of the issue in red text
        4. Concrete suggestion for improvement
        Example:
        - [❌] Logging Implementation
          **Dosya:** UpdateUserCommand.cs
          **Konum:** Class definition
          <span style="color: red">Command sınıfı olmasına rağmen ILoggableRequest interface'i implement edilmemiş.</span>
          **Öneri:** \`public class UpdateUserCommand : IRequest<bool?>, ILoggableRequest\` şeklinde düzeltilmeli.

        ### İncelenen Dosyalar
        - List each reviewed file with its full path

        ${guidelines ? `### Özel İnceleme Kriterleri\n- Address any specific points or concerns mentioned in the custom guidelines\n` : ''}

        ### Öneriler
        - List any additional suggestions or improvements

        Keep the response focused on the most important points and be specific with examples when pointing out issues.
        Always include full file paths when mentioning files.
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{
            role: "system",
            content: "You are an experienced code reviewer. Review the code according to the specified checklist and any custom guidelines provided. Provide clear, constructive feedback in Turkish. Use ✅ for passed items and ❌ for failed items. For each failed item, always specify the exact file path, location, and concrete suggestion for improvement. Pay special attention to any specific concerns or focus areas mentioned in the custom guidelines. Do not add empty lines after headers."
          }, {
            role: "user",
            content: prompt
          }],
          max_tokens: 2000
        }),
        signal // Abort signal'ı ekle
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'OpenAI API request failed');
      }

      allReviews += (i > 0 ? '\n\n---\n\n' : '') + data.choices[0].message.content;
    }

    // Son review sonuçlarını sakla
    lastReviewResults = allReviews;
    return lastReviewResults;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Review işlemi iptal edildi.');
    }
    throw error;
  } finally {
    toggleLoadingOverlay(false);
    window.currentReviewController = null;
  }
}

// AI Review menüsünü oluştur
function createReviewMenu() {
  const menuContainer = document.createElement('div');
  menuContainer.className = 'ai-review-menu';
  menuContainer.style.cssText = `
    position: relative;
    display: inline-block;
    margin: 1px;
  `;

  // Ana menü butonu
  const menuButton = document.createElement('button');
  menuButton.className = 'ai-review-menu-button';
  menuButton.innerHTML = 'AI Review ▾';
  menuButton.style.cssText = `
    background: #0078d4;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 1px;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  `;

  // Dropdown menü
  const dropdown = document.createElement('div');
  dropdown.className = 'ai-review-dropdown';
  dropdown.style.cssText = `
    display: none;
    position: absolute;
    background-color: white;
    min-width: 160px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    border-radius: 4px;
    z-index: 1000;
    margin-top: 4px;
  `;

  // Menü öğeleri
  const menuItems = [
    {
      text: 'Review PR',
      onClick: async () => {
        try {
          const customGuidelines = prompt(
            'Bu review için özel yönergeleriniz var mı?\n' +
            'Örnek: "X fonksiyonunun performansına özellikle dikkat et" veya "Y modülündeki null kontrollerini incele"\n' +
            '(İptal etmek için İptal düğmesine basın veya boş bırakın)'
          );

          if (customGuidelines === null) return;

          menuButton.disabled = true;
          toggleLoadingOverlay(true, 'Getting changes...');

          // Önce tüm değişiklikleri yükle
          await loadAllChanges();

          const changes = await getPRChanges();
          
          if (changes.length === 0) {
            alert('İncelenecek değişiklik bulunamadı. Lütfen PR sayfasında olduğunuzdan ve görünür değişiklikler olduğundan emin olun.');
            return;
          }

          toggleLoadingOverlay(true, 'Reviewing changes...');
          const review = await reviewWithOpenAI(changes, customGuidelines, true); // isPRReview = true
          showReviewResults(review, 'PR Review Sonuçları');

        } catch (error) {
          console.error('Review error:', error);
          alert('Review sırasında hata: ' + error.message);
        } finally {
          menuButton.disabled = false;
          menuButton.innerHTML = 'AI Review ▾';
          dropdown.style.display = 'none';
          toggleLoadingOverlay(false);
        }
      }
    },
    {
      text: 'Review Selected',
      onClick: async () => {
        try {
          let selectedCode;
          try {
            selectedCode = getSelectedCode();
          } catch (error) {
            alert(error.message);
            return;
          }

          const customGuidelines = prompt(
            'Bu review için özel yönergeleriniz var mı?\n' +
            'Örnek: "Performans açısından değerlendir" veya "Güvenlik açıklarını kontrol et"\n' +
            '(İptal etmek için İptal düğmesine basın veya boş bırakın)'
          );

          if (customGuidelines === null) return;

          menuButton.disabled = true;
          toggleLoadingOverlay(true, 'Reviewing selected code...');

          const changes = [{
            fileName: selectedCode.context.file,
            additions: [selectedCode.code],
            deletions: []
          }];

          const review = await reviewWithOpenAI(changes, customGuidelines, false); // isPRReview = false
          showReviewResults(review, 'Seçili Kod Review Sonuçları');

        } catch (error) {
          console.error('Review error:', error);
          alert('Review sırasında hata: ' + error.message);
        } finally {
          menuButton.disabled = false;
          menuButton.innerHTML = 'AI Review ▾';
          dropdown.style.display = 'none';
          toggleLoadingOverlay(false);
        }
      }
    }
  ];

  menuItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'ai-review-menu-item';
    menuItem.textContent = item.text;
    menuItem.style.cssText = `
      padding: 8px 16px;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      &:hover {
        background-color: #f6f8fa;
      }
    `;
    menuItem.addEventListener('click', item.onClick);
    dropdown.appendChild(menuItem);
  });

  // Menüyü aç/kapat
  menuButton.addEventListener('click', () => {
    // Menüyü açmadan önce seçili alanı sakla
    if (window.getSelection().toString().trim()) {
      lastSelectedCode = {
        code: window.getSelection().toString().trim(),
        context: {
          element: window.getSelection().anchorNode.parentElement,
          file: getFileNameFromSelection(window.getSelection())
        }
      };
    }
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });

  // Dışarı tıklandığında menüyü kapat
  document.addEventListener('click', (event) => {
    if (!menuContainer.contains(event.target)) {
      dropdown.style.display = 'none';
      // Menü kapandığında seçili alanı temizle
      lastSelectedCode = null;
    }
  });

  menuContainer.appendChild(menuButton);
  menuContainer.appendChild(dropdown);
  return menuContainer;
}

// Ana fonksiyon
async function main() {
  console.log('Main function started');
  
  if (!isPullRequestPage()) {
    console.log('Not a PR page, exiting...');
    return;
  }

  // AI Review menüsünü ekle
  const toolbar = document.querySelector('.repos-pr-header') || document.querySelector('.pr-header-content');
  if (toolbar && !document.querySelector('.ai-review-menu')) {
    toolbar.appendChild(createReviewMenu());
  }
}

// Sayfa değişikliklerini izle
const observer = new MutationObserver((mutations) => {
  // PR sayfasında olup olmadığımızı kontrol et
  if (isPullRequestPage()) {
    // Toolbar'ı bul
    const toolbar = document.querySelector('.repos-pr-header') || document.querySelector('.pr-header-content');
    
    // Eğer toolbar varsa ve henüz menü eklenmemişse
    if (toolbar && !document.querySelector('.ai-review-menu')) {
      toolbar.appendChild(createReviewMenu());
    }
  }
});

// Sayfa yüklendiğinde başlat
console.log('Content script loaded');
main();

// Sayfa değişikliklerini izlemeye başla
observer.observe(document.body, {
  childList: true,
  subtree: true
}); 