# Dijital Sağlık Asistanı (AI Destekli)

Bu proje, kullanıcıların sağlık verilerini takip edebilecekleri, spor programları oluşturabilecekleri ve randevularını yönetebilecekleri tam kapsamlı bir dijital sağlık asistanı uygulamasıdır.

## Özellikler

- Kullanıcı kayıt ve giriş sistemi
- Günlük aktivite takibi (uyku, su tüketimi, kalori alımı)
- Kişiselleştirilmiş spor programı oluşturma
- Randevu takibi
- AI destekli sağlık önerileri
- Profil ve ayarlar yönetimi

## Teknolojiler

### Frontend
- React.js
- React Router
- Tailwind CSS
- Axios
- React Hook Form
- Lucide React (ikonlar)

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT (JSON Web Token)
- Bcrypt

## Kurulum

### Ön Koşullar
- Node.js (v14 veya üzeri)
- PostgreSQL

### Veritabanı Kurulumu

1. PostgreSQL'i başlatın
2. Yeni bir veritabanı oluşturun:
   ```
   CREATE DATABASE health_assistant;
   ```
3. `server/database.sql` dosyasındaki SQL komutlarını çalıştırarak tabloları oluşturun

### Backend Kurulumu

1. Proje klasörüne gidin
2. `.env` dosyasını düzenleyin ve veritabanı bağlantı bilgilerinizi girin
3. Bağımlılıkları yükleyin:
   ```
   npm install
   ```
4. Backend sunucusunu başlatın:
   ```
   npm run server
   ```

### Frontend Kurulumu

1. Yeni bir terminal açın
2. Proje klasöründe frontend geliştirme sunucusunu başlatın:
   ```
   npm run dev
   ```

## Kullanım

1. Tarayıcınızda `http://localhost:5173` adresine gidin
2. Yeni bir hesap oluşturun veya mevcut hesabınızla giriş yapın
3. Uygulamanın çeşitli modüllerini kullanmaya başlayın:
   - Günlük aktivite verilerinizi girin
   - Kişiselleştirilmiş spor programı oluşturun
   - Randevularınızı yönetin
   - Sağlık önerilerini görüntüleyin
   - Profil bilgilerinizi güncelleyin

## Proje Yapısı

```
/
├── src/                  # Frontend kaynak kodları
│   ├── contexts/         # React context'leri
│   ├── layouts/          # Sayfa düzenleri
│   ├── pages/            # Sayfa bileşenleri
│   └── main.tsx          # Ana giriş noktası
├── server/               # Backend kaynak kodları
│   ├── index.js          # Express sunucusu
│   └── database.sql      # Veritabanı şeması
└── public/               # Statik dosyalar
```

## API Uç Noktaları

### Kimlik Doğrulama
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi

### Kullanıcı
- `PUT /api/users/profile` - Profil bilgilerini güncelleme
- `PUT /api/users/password` - Şifre değiştirme

### Aktiviteler
- `GET /api/activities` - Aktiviteleri listeleme
- `POST /api/activities` - Yeni aktivite ekleme

### Spor Programları
- `GET /api/fitness-programs` - Programları listeleme
- `POST /api/fitness-programs/generate` - Program oluşturma
- `POST /api/fitness-programs` - Programı kaydetme

### Randevular
- `GET /api/appointments` - Randevuları listeleme
- `POST /api/appointments` - Yeni randevu ekleme
- `DELETE /api/appointments/:id` - Randevu silme

### Öneriler
- `GET /api/recommendations` - Önerileri listeleme
- `POST /api/recommendations/refresh` - Önerileri yenileme

### Dashboard
- `GET /api/dashboard` - Dashboard verilerini alma