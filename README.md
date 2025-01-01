# ReviewKoala - AI Code Review Assistant for Azure DevOps

<div align="center">
  <img src="images/koala-icon-128.png" alt="ReviewKoala Logo" width="128" height="128">
</div>

ReviewKoala, Azure DevOps pull request'leriniz için yapay zeka destekli kod inceleme asistanıdır. GPT-4 tabanlı bu asistan, kodunuzu detaylı bir şekilde analiz eder ve kapsamlı geri bildirimler sunar.

## Özellikler

- 🔍 Pull request'lerdeki tüm değişiklikleri otomatik analiz
- 📝 Seçili kod parçaları için özel inceleme
- 🤖 GPT-4 tabanlı akıllı kod analizi
- ✨ Azure DevOps arayüzüne entegre temiz UI
- 🎯 Özelleştirilebilir inceleme kriterleri
- 🔄 İnceleme sonuçlarını kolayca görüntüleme ve yönetme

## Kurulum

### Chrome Web Store'dan Kurulum
1. Chrome Web Store'dan ReviewKoala eklentisini yükleyin
2. Eklenti ayarlarından OpenAI API anahtarınızı girin
3. Azure DevOps'ta herhangi bir pull request sayfasına gidin
4. Üst menüde beliren "AI Review" butonunu kullanmaya başlayın

### Manuel Kurulum
1. Bu repository'yi klonlayın:
   ```bash
   git clone https://github.com/yourusername/reviewkoala.git
   ```
2. Chrome tarayıcınızda `chrome://extensions/` adresine gidin
3. Sağ üst köşeden "Geliştirici modu"nu aktif edin
4. "Paketlenmemiş öğe yükle" butonuna tıklayın
5. İndirdiğiniz ReviewKoala klasörünü seçin
6. Eklenti ayarlarından OpenAI API anahtarınızı girin
7. Azure DevOps'ta pull request sayfalarında kullanmaya başlayın

## Kullanım

### Pull Request İnceleme

1. Pull request sayfasında "AI Review" butonuna tıklayın
2. "Review PR" seçeneğini seçin
3. İsteğe bağlı olarak özel inceleme yönergeleri ekleyin
4. İnceleme sonuçlarını bekleyin

### Seçili Kod İnceleme

1. İncelemek istediğiniz kod bloğunu seçin
2. "AI Review" butonuna tıklayın
3. "Review Selected" seçeneğini seçin
4. İsteğe bağlı olarak özel inceleme yönergeleri ekleyin

## İnceleme Kriterleri

ReviewKoala aşağıdaki kriterlere göre kodunuzu inceler:

- Mantıksal hatalar
- Eksik bileşenler
- Loglama implementasyonu (Command sınıfları için)
- Kod tekrarı
- Veri yapıları kullanımı
- Kod okunabilirliği
- Sihirli sayılar
- Enum kullanımı
- Performans optimizasyonu
- Sabit kullanımı
- Boolean isimlendirme
- Ölü kod
- String işlemleri
- Kod açıklığı
- Yorum satırları
- Kaynak yönetimi
- Fonksiyon uzunluğu

## Geliştirme

### Proje Yapısı
```
reviewkoala/
├── images/                 # İkonlar ve görseller
│   ├── koala-icon-16.png
│   ├── koala-icon-32.png
│   ├── koala-icon-48.png
│   └── koala-icon-128.png
├── manifest.json          # Eklenti manifest dosyası
├── popup.html            # Ayarlar popup'ı
├── popup.js              # Popup mantığı
├── content.js           # Ana eklenti kodu
├── README.md            # Dokümantasyon
└── LICENSE              # Lisans dosyası
```

### Geliştirme için Kurulum
1. Repository'yi klonlayın
2. Gerekli değişiklikleri yapın
3. Chrome'da `chrome://extensions/` adresine gidin
4. Geliştirici modunu aktif edin
5. "Paketlenmemiş öğe yükle" ile test edin

## Gereksinimler

- OpenAI API anahtarı
- Chrome tarayıcısı
- Azure DevOps erişimi

## Gizlilik

ReviewKoala, kodunuzu analiz etmek için OpenAI API'sini kullanır. Gönderilen kod parçaları ve alınan yanıtlar yerel olarak işlenir ve saklanmaz.

## Katkıda Bulunma

1. Bu repository'yi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## Destek

Sorun ve önerileriniz için [GitHub Issues](https://github.com/yourusername/reviewkoala/issues) sayfasını kullanabilirsiniz. 