# Netlify-də Deploy Edilməsi

## 1. Netlify Dashboard-da Yeni Sayt Yaradın

1. [Netlify Dashboard](https://app.netlify.com/) açın
2. **Add new site** → **Import an existing project**
3. GitHub repo-nu seçin və ya manual upload edin

## 2. Build Settings

Netlify build settings:
```
Build command: yarn build
Publish directory: build
Functions directory: netlify/functions
```

## 3. Environment Variables (Vacib!)

Netlify Dashboard-da Site settings → Environment variables:

**Əgər Cloudflare R2 istifadə edirsiniz (credentials artıq kodda hardcode olunub):**
- Heç bir environment variable lazım deyil, direkt işləməlidir

**Əgər öz R2 credentials-niz varsa:**
```
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY=your-access-key
R2_SECRET_KEY=your-secret-key
R2_BUCKET=your-bucket-name
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

## 4. Deploy

Site avtomatik build və deploy olunacaq.

## 5. Test

Deploy olunandan sonra:
1. Admin panelə daxil olun
2. Bannerlər və ya Videolar tabına gedin
3. Fayl yükləyin

## İşləmə Prinsipi

- Frontend Netlify-də host olunur
- Fayl upload Netlify Functions vasitəsilə işləyir (backend lazım deyil!)
- Netlify Functions Cloudflare R2-yə birbaşa yükləyir
- Firebase authentication və database işləyir

## Xəta Həlli

**Video yüklənmədi xətası alırsınızsa:**

1. Netlify Functions log-larına baxın (Site → Functions → upload)
2. CORS xətası varsa, `netlify.toml`-da headers düzgündür, yenidən deploy edin
3. File size çox böyükdürsə (100MB+), Netlify Functions limiti 10MB-dır

## Deploy Addımları (Terminal)

```bash
cd /app/frontend

# Build
yarn build

# Netlify CLI ilə deploy (optional)
netlify deploy --prod
```

## Qeyd

- Backend artıq lazım deyil!
- Bütün upload funksiyaları Netlify Functions-da işləyir
- Emergent-də və Netlify-də eyni şəkildə işləyəcək
