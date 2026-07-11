# R2 CORS Konfiqurasiyası

Video və şəkil yükləmə işləməsi üçün R2 bucket-də CORS konfiqurasiyası lazımdır.

## R2 CORS Setup

1. **Cloudflare Dashboard**-a gedin
2. **R2** → Bucket seçin (`epages`)
3. **Settings** → **CORS Policy**
4. Aşağıdakı JSON-u əlavə edin:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

5. **Save** edin

## Test

Deploy edib test edin:
1. Netlify-də build edin
2. Admin → Videolar
3. Video yükləyin
4. ✅ İşləməlidir!

## Qeyd

- AWS SDK frontend-də istifadə olunur
- R2 credentials kodda hardcode olunub (public key-lər)
- CORS konfiqurasiyası olmadan "Access-Control-Allow-Origin" xətası alarsınız
