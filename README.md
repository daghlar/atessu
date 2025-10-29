# 🔥 Ateş ve Su 💧 - Professional Multiplayer Game

Tarayıcı tabanlı, gerçek zamanlı kooperatif platform oyunu. Profesyonel UI, skor sistemi, seviye ilerlemesi ve istatistikler ile geliştirilmiş versiyon.

## ✨ Özellikler

### 🎮 Oyun Mekanikleri
- **Real-time multiplayer**: 2 oyuncu aynı anda farklı cihazlardan oynayabilir
- **Authoritative server**: Tüm oyun mantığı sunucuda, hile koruması
- **Seviye sistemi**: Sonsuz seviye ilerlemesi
- **Skor sistemi**: Süre ve performansa dayalı puanlama
- **İstatistik takibi**: Ölüm sayısı, tamamlanan seviyeler, en iyi süre

### 🎨 Profesyonel UI
- **Modern lobby sistemi**: Oda oluştur veya katıl
- **6 haneli oda kodları**: Kolay paylaşım
- **Bekleme odası**: Oyuncu durumu göstergesi
- **Gerçek zamanlı istatistikler**: Seviye, skor, ölüm, süre
- **Animasyonlu bildirimler**: Toast mesajları ve durum güncellemeleri
- **Responsive tasarım**: Mobil uyumlu

### 🔧 Teknik Özellikler
- **Socket.IO**: Düşük gecikmeli real-time iletişim
- **Phaser 3**: Profesyonel oyun motoru
- **60 FPS**: Pürüzsüz oyun deneyimi
- **Vanilla JS**: Framework bağımlılığı yok
- **Modern CSS**: Animasyonlar, gradient, blur efektleri

## 📦 Kurulum

```bash
git clone https://github.com/daghlar/atessu.git
cd atessu
npm install
npm start
```

Tarayıcıda: **http://localhost:3000**

## 🎯 Nasıl Oynanır

### Kontroller
- **⬅️➡️ Hareket**: Ok tuşları veya A/D
- **⬆️ Zıplama**: Space / W / Yukarı ok

### Oyun Kuralları
- **🔥 Ateş Oyuncusu**: 
  - Kırmızı butona basabilir
  - Suya dokunursa ölür
  - Kırmızı çıkışa ulaşmalı
  
- **💧 Su Oyuncusu**: 
  - Mavi butona basabilir
  - Lavaya dokunursa ölür
  - Mavi çıkışa ulaşmalı

- **🎯 Kooperasyon**: 
  - Her iki butona aynı anda basılmalı
  - Kapılar açılır
  - Her iki oyuncu çıkışa ulaşmalı

### Puanlama Sistemi
- **Temel puan**: 100 puan/seviye
- **Süre bonusu**: Hızlı bitirme için bonus
- **Ölüm cezası**: Her ölüm -10 puan
- **Seviye ilerlemesi**: Sonsuz seviye

## 🌐 Çok Oyunculu

### Oda Oluşturma
1. Ana sayfada "Create Room" butonuna tıkla
2. Otomatik 6 haneli kod oluşturulur
3. Kodu arkadaşınla paylaş
4. Arkadaşın katılınca oyun başlar

### Odaya Katılma
1. Ana sayfada room kodunu gir
2. "Join Room" butonuna tıkla
3. Bekleme odasında partner'ı bekle
4. Partner gelince oyun otomatik başlar

### URL ile Paylaşım
- Direkt link: `http://localhost:3000?room=ABC123`
- URL'den otomatik odaya katılma

## 🏗️ Dosya Yapısı

```
atessu/
├─ package.json
├─ server.js (authoritative game logic + room management)
├─ README.md
└─ public/
   ├─ index.html (3 ekran: lobby, character selection, waiting, game)
   ├─ css/
   │  └─ style.css (modern UI + animasyonlar)
   └─ js/
      ├─ ui.js (UI management + timer + character selection)
      ├─ socket.js (Socket.IO client + event handlers)
      └─ game.js (Phaser 3 game scene)
```

## 🎨 Özellikler Detay

### Lobby Sistemi
- Oda oluşturma (otomatik kod)
- Oda koduna katılma
- Oyun kuralları bilgisi
- Modern gradient tasarım

### Bekleme Odası
- Oyuncu durumu göstergesi
- Room kodu kopyalama
- Animasyonlu bağlantı durumu
- Partner bekleme spinner

### Oyun Ekranı
- Gerçek zamanlı istatistikler
- Seviye göstergesi
- Skor takibi
- Ölüm sayacı
- Süre kronometresi
- Durum mesajları
- Kontrol ipuçları

### Animasyonlar
- Fade in/out geçişler
- Pulse efektleri
- Bounce animasyonları
- Smooth state transitions
- Toast notifications

## 🔒 Güvenlik

- Client-side input validation
- Server-side authoritative logic
- Room capacity limits (2 player)
- Automatic room cleanup
- No client-side game state manipulation

## 📊 İstatistikler

Her oda için takip edilen:
- Toplam oyun sayısı
- Toplam kazanma sayısı
- Toplam ölüm sayısı
- En iyi tamamlama süresi
- Oda oluşturulma zamanı

## 🚀 Performans

- 60 FPS server tick rate
- 16ms update interval
- Efficient collision detection
- Optimized rendering
- Minimal network latency

## 🎓 Öğretici Kod

Kod, öğretici amaçlı yazılmıştır:
- Açıklayıcı yorumlar
- Anlaşılır değişken isimleri
- Modüler yapı
- Best practices
- Production-ready değil, eğitim amaçlı

## 📝 Lisans

MIT

## 🤝 Katkıda Bulunma

Bu proje eğitim amaçlıdır. Geliştirmeler için:
1. Fork yapın
2. Feature branch oluşturun
3. Commit yapın
4. Push edin
5. Pull request açın

## 🚀 Deployment

### Heroku (Önerilen)
```bash
heroku create atessu-game
git push heroku main
heroku open
```

### Railway.app
1. https://railway.app/ adresine git
2. GitHub ile giriş yap
3. "Deploy from GitHub repo" → daghlar/atessu
4. Otomatik deploy edilir

### Render.com
1. https://render.com/ adresine git
2. New Web Service → GitHub repo bağla
3. Build command: `npm install`
4. Start command: `npm start`

---

**Made with ❤️ for learning purposes**
