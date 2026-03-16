# 🔥 Shorts Leaderboard — Vercel Kurulumu

## Neden Vercel?
- API anahtarları sunucuda gizli kalır (kullanıcılar göremez)
- Yenile butonu yok — site her 30 dakikada otomatik güncellenir
- Vercel'in kendi cache'i sayesinde kota korunur

## Kurulum (5 dakika)

### 1. Bu klasörü GitHub'a yükle
Yeni bir repo oluştur ve şu dosyaları yükle:
```
api/shorts.js
public/index.html
vercel.json
```

### 2. Vercel'e bağla
- vercel.com → New Project → GitHub reposunu seç → Import

### 3. Environment Variables ekle (⚠️ API anahtarları burada!)
Vercel Dashboard → Project → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `YT_API_KEY_1` | İlk API anahtarın |
| `YT_API_KEY_2` | İkinci API anahtarın |

### 4. Deploy
Save → Redeploy → Siten hazır!

## Sonuç
- Kullanıcılar API anahtarını göremez
- Yenile butonu yok, sadece liste görünür
- Her 30 dakikada otomatik güncellenir
- Kota biterse otomatik 2. anahtara geçer
