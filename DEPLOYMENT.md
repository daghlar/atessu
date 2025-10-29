# 🚀 Netlify Deployment Guide

Bu proje Netlify'da deploy edilebilir, ancak Socket.IO real-time multiplayer özelliği için **özel yapılandırma** gerekir.

## ⚠️ Önemli Not

Netlify **serverless functions** kullanır ve Socket.IO gibi persistent WebSocket bağlantıları için ideal değildir. Daha iyi alternatifler:

### 🎯 Önerilen Deployment Platformları

1. **Heroku** (En İyi Seçenek)
   - WebSocket desteği ✅
   - Ücretsiz tier
   - Kolay deployment
   - `git push heroku main`

2. **Railway.app**
   - Modern platform
   - WebSocket desteği ✅
   - Ücretsiz tier
   - GitHub entegrasyonu

3. **Render.com**
   - WebSocket desteği ✅
   - Ücretsiz tier
   - Otomatik deployment

4. **DigitalOcean App Platform**
   - WebSocket desteği ✅
   - $5/ay
   - Profesyonel

## 📦 Netlify ile Static Deployment

Eğer sadece **static frontend** deploy etmek istiyorsanız:

### Adımlar:

1. **GitHub'a Push**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Netlify'da Yeni Site**
   - https://app.netlify.com/
   - "Add new site" → "Import from Git"
   - GitHub repo'nuzu seçin

3. **Build Settings**
   - Build command: `npm install`
   - Publish directory: `public`
   - Node version: 14.x veya üzeri

4. **Deploy**
   - "Deploy site" butonuna tıklayın
   - Site otomatik build edilir

### ⚠️ Sınırlamalar

- Multiplayer özelliği **çalışmaz** (Socket.IO yok)
- Sadece frontend görünür
- Oyun mantığı çalışmaz

## 🔥 Heroku Deployment (Önerilen)

### Adımlar:

1. **Heroku CLI Kurulumu**
   ```bash
   # Ubuntu/Debian
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Heroku Login**
   ```bash
   heroku login
   ```

3. **Heroku App Oluştur**
   ```bash
   heroku create ates-ve-su-game
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Uygulamayı Aç**
   ```bash
   heroku open
   ```

### Heroku için Procfile

Proje root'unda `Procfile` oluşturun:
```
web: node server.js
```

### Heroku için package.json güncellemesi

`package.json` içinde:
```json
{
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": "14.x"
  }
}
```

## 🌐 Railway.app Deployment

### Adımlar:

1. **Railway.app'e Git**
   - https://railway.app/

2. **GitHub ile Giriş Yap**

3. **New Project**
   - "Deploy from GitHub repo"
   - Repo'nuzu seçin

4. **Otomatik Deploy**
   - Railway otomatik algılar
   - Port 3000 kullanır
   - WebSocket desteği var

5. **Domain Al**
   - Settings → Generate Domain
   - Ücretsiz `.railway.app` domain

## 🔧 Environment Variables

Tüm platformlarda bu değişkenleri ayarlayın:

```env
NODE_ENV=production
PORT=3000
```

## 📊 Performans Notları

### Heroku Free Tier
- ✅ WebSocket desteği
- ✅ 550 saat/ay ücretsiz
- ⚠️ 30 dakika inaktivite sonrası uyur
- ⚠️ İlk istek yavaş olabilir

### Railway Free Tier
- ✅ WebSocket desteği
- ✅ $5 ücretsiz kredi/ay
- ✅ Her zaman aktif
- ✅ Hızlı başlangıç

### Render Free Tier
- ✅ WebSocket desteği
- ✅ Ücretsiz
- ⚠️ 15 dakika inaktivite sonrası uyur

## 🐛 Troubleshooting

### Socket.IO Bağlantı Hatası

**Sorun**: Client bağlanamıyor

**Çözüm**: CORS ayarlarını kontrol edin

```javascript
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
```

### Port Hatası

**Sorun**: Port 3000 kullanılamıyor

**Çözüm**: Environment variable kullanın

```javascript
const PORT = process.env.PORT || 3000;
```

### Build Hatası

**Sorun**: npm install başarısız

**Çözüm**: Node version kontrol edin

```json
"engines": {
  "node": ">=14.x"
}
```

## 📝 Deployment Checklist

- [ ] Git repo oluşturuldu
- [ ] `.gitignore` dosyası var
- [ ] `package.json` güncellenmiş
- [ ] Environment variables ayarlandı
- [ ] Platform seçildi (Heroku/Railway/Render)
- [ ] Deploy edildi
- [ ] Test edildi (2 farklı cihazdan)
- [ ] WebSocket bağlantısı çalışıyor
- [ ] Multiplayer test edildi

## 🎮 Test Etme

Deploy sonrası:

1. **Tek Cihaz Testi**
   - 2 farklı browser tab aç
   - Aynı room code ile katıl
   - Oyunu test et

2. **Çoklu Cihaz Testi**
   - Telefon + bilgisayar
   - Farklı network'ler
   - Gecikme kontrolü

3. **Performans Testi**
   - 60 FPS kontrolü
   - Input lag ölçümü
   - Network latency

## 🔗 Faydalı Linkler

- [Heroku Documentation](https://devcenter.heroku.com/)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
- [Socket.IO Deployment](https://socket.io/docs/v4/server-deployment/)

---

**Not**: Bu proje eğitim amaçlıdır. Production kullanımı için ek güvenlik ve optimizasyon gerekebilir.
