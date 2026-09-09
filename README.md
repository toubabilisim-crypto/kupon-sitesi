# Günlük Kupon Sitesi

Her gün otomatik olarak (sabah 09:00 Türkiye saati) çalışıp, günün maçlarını
tarayan, oranlara göre 3 kategoriye (Kasa / Orta Risk / Yüksek Oran, her biri
10 maç) ayrılmış tekli kupon önerileri üreten bir site.

**Önemli:** Bu site kuponları sizin için hazırlar, hiçbir bahis sitesine
otomatik giriş yapmaz veya bahis oynamaz. Oynamak isterseniz gösterilen
seçimleri kendiniz Nesine/İddaa üzerinden girersiniz.

## Kurulum adımları

### 1. API-Football key alın
1. https://www.api-football.com/ adresine gidin, ücretsiz kayıt olun.
2. Dashboard'da size verilen API key'i kopyalayın (günde 100 istek ücretsiz).

### 2. Bu projeyi GitHub'a yükleyin
1. GitHub'da yeni, boş bir repo oluşturun (örn. `kupon-sitesi`).
2. Bu klasördeki dosyaları o repoya push edin:
   ```
   git init
   git add .
   git commit -m "ilk kurulum"
   git branch -M main
   git remote add origin <repo-linkiniz>
   git push -u origin main
   ```

### 3. Vercel'e bağlayın
1. https://vercel.com adresine GitHub hesabınızla giriş yapın.
2. "Add New Project" deyip GitHub reponuzu seçin, "Deploy" deyin.

### 4. Vercel KV (veritabanı) ekleyin
1. Vercel projenizin sayfasında **Storage** sekmesine gidin.
2. **Create Database → KV** seçin, ücretsiz plan ile oluşturun.
3. Oluşturduktan sonra projenize otomatik bağlanır (env değişkenleri kendiliğinden eklenir).

### 5. Ortam değişkenlerini (Environment Variables) ekleyin
Vercel projenizde **Settings → Environment Variables** kısmına gidin, şunları ekleyin:
- `API_FOOTBALL_KEY` → 1. adımda aldığınız key
- `CRON_SECRET` → kendi belirleyeceğiniz rastgele bir metin (örn. şifre üretici ile oluşturun)

Ekledikten sonra projeyi yeniden deploy edin (Deployments sekmesinden "Redeploy").

### 6. Domain'i bağlayın (Wix domain'iniz Vercel'e yönlenir)
1. Vercel projenizde **Settings → Domains** kısmına gidin, `toubabilisim.com` yazıp ekleyin.
2. Vercel size bir **A kaydı** ve/veya **CNAME** değeri verecek.
3. Wix hesabınızda **Domainler** kısmına gidin, `toubabilisim.com` için **DNS ayarlarını yönet**i açın.
4. Vercel'in verdiği A/CNAME kayıtlarını Wix DNS ayarlarına ekleyin (Wix'in kendi eski kayıtlarını silmeniz gerekebilir).
5. DNS yayılması birkaç saat sürebilir.

### 7. İlk çalıştırmayı test edin
Cron her gün otomatik çalışacak, ama hemen test etmek isterseniz tarayıcıdan:
```
https://siteniz.vercel.app/api/cron
```
adresine `Authorization: Bearer <CRON_SECRET>` header'ı ile bir istek atmanız gerekir (tarayıcıdan direkt açarsanız 401 hatası alırsınız, bu normaldir — Postman veya benzeri bir araçla test edebilirsiniz, ya da CRON_SECRET'i boş bırakıp geçici olarak deneyebilirsiniz).

## Genişletme fikirleri
- Şu anki tahmin mantığı basittir: sadece bahis oranına bakarak favori/sürpriz ayrımı yapar. Gerçek form/istatistik (son 5 maç, iç saha performansı vb.) eklemek isterseniz `lib/football.js` içindeki `tahminOlustur` fonksiyonunu genişletebiliriz.
- Daha fazla lig eklemek için `lib/football.js` içindeki `TAKIP_EDILEN_LIGLER` listesine yeni lig ID'leri ekleyin (API-Football dokümantasyonundan bulunur).
