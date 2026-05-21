# Panduan Deployment & Hosting — Kopi Kita (Production Mode)

Dokumen ini merinci langkah-langkah untuk melakukan deployment aplikasi **Kopi Kita** ke layanan cloud hosting (VPS Ubuntu/Debian) menggunakan backend server Python (`server.py`) dan web server Nginx sebagai Reverse Proxy yang dilengkapi dengan SSL/TLS (HTTPS) gratis dari Let's Encrypt.

---

## 1. Konfigurasi Kredensial SMTP Gmail (Sandi Aplikasi)
Untuk mengirimkan OTP asli ke inbox email pembeli saat pendaftaran, Anda wajib menggunakan akun Gmail dengan fitur **Sandi Aplikasi (App Password)** yang memiliki keamanan tinggi:

1. Buka akun Google Anda (https://myaccount.google.com).
2. Di panel navigasi kiri, pilih **Keamanan (Security)**.
3. Di bawah bagian *"Cara Anda masuk ke Google"*, pastikan **Verifikasi 2 Langkah (2-Step Verification)** sudah **Aktif**.
4. Klik **Verifikasi 2 Langkah**, scroll ke bagian paling bawah, lalu pilih **Sandi Aplikasi (App Passwords)**.
5. Beri nama aplikasi (misal: `Kopi Kita Web`), lalu klik **Buat (Create)**.
6. Google akan memunculkan **16-karakter sandi aplikasi** dalam kotak kuning (contoh: `abcd efgh ijkl mnop`). 
7. Catat/salin kode ini (tanpa spasi) untuk digunakan pada konfigurasi berkas `.env` Anda.

---

## 2. Pengaturan Berkas `.env` Produksi
Buat berkas bernama `.env` di dalam folder root proyek Anda di hosting server, lalu isi dengan konfigurasi berikut:

```env
# Port aplikasi backend Python
PORT=3000

# Mode Produksi (Sangat penting! Set true untuk mematikan mode demo/simulasi OTP)
PRODUCTION=true

# Konfigurasi SMTP Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email-anda-di-sini@gmail.com
SMTP_PASS=sandi-aplikasi-16-karakter-anda
```

> [!IMPORTANT]
> Ketika `PRODUCTION=true` diaktifkan:
> - Pihak luar tidak bisa mencuri/melihat OTP dari payload JSON API `/api/otp/request`.
> - Jika sandi Gmail Anda salah atau belum diatur, registrasi akan ditolak dengan error `500` yang aman daripada meloloskan pembeli tanpa email verifikasi asli.

---

## 3. Deployment ke Cloud VPS (Ubuntu/Debian)

### Langkah 3.1: Salin Berkas ke Server VPS
Salin seluruh berkas proyek Anda (`index.html`, `app.js`, `style.css`, `server.py`, folder `assets/`, dan berkas `.env`) ke folder kerja di VPS Anda, misalnya di `/var/www/kopi-kita`.
Anda dapat menggunakan FileZilla (SFTP) atau perintah scp:
```bash
scp -r kopi-kita user@ip_vps_anda:/var/www/
```

### Langkah 3.2: Pasang Layanan Autostart (Systemd Service)
Agar server Python (`server.py`) tetap menyala di latar belakang meskipun terminal SSH Anda ditutup, dan otomatis menyala kembali jika server VPS melakukan *restart*, buat file konfigurasi service:

1. Buka terminal VPS, lalu jalankan perintah:
   ```bash
   sudo nano /etc/systemd/system/kopikita.service
   ```
2. Salin dan tempel konfigurasi berikut:
   ```ini
   [Unit]
   Description=Kopi Kita Backend Python Web Server
   After=network.target

   [Service]
   User=root
   WorkingDirectory=/var/www/kopi-kita
   ExecStart=/usr/bin/python3 server.py
   Restart=always
   RestartSec=5
   Environment=PYTHONUNBUFFERED=1

   [Install]
   WantedBy=multi-user.target
   ```
3. Simpan berkas (tekan `Ctrl+O`, `Enter`, lalu keluar dengan `Ctrl+X`).
4. Aktifkan dan jalankan service tersebut:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable kopikita.service
   sudo systemctl start kopikita.service
   ```
5. Untuk memeriksa status apakah server sudah berjalan dengan sukses:
   ```bash
   sudo systemctl status kopikita.service
   ```

---

## 4. Konfigurasi Nginx Reverse Proxy (Akses Port 80 / Domain)
Secara bawaan, aplikasi berjalan di port `3000`. Kita perlu mengarahkan domain Anda (misal: `kopikita.com` atau `kopi.hostinganda.com`) ke port tersebut menggunakan Nginx:

1. Pasang Nginx di VPS Anda:
   ```bash
   sudo apt update
   sudo apt install nginx -y
   ```
2. Buat konfigurasi server block baru untuk domain Anda:
   ```bash
   sudo nano /etc/nginx/sites-available/kopikita
   ```
3. Tempelkan konfigurasi proxy di bawah ini (ubah `kopikita.com` menjadi domain/subdomain asli Anda):
   ```nginx
   server {
       listen 80;
       server_name kopikita.com www.kopikita.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
4. Simpan berkas, aktifkan konfigurasinya, dan restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/kopikita /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 5. Pemasangan SSL Gratis (HTTPS / Secure Connection)
Agar web Anda aman diakses menggunakan protokol HTTPS (gembok hijau di browser), pasang SSL gratis dari Let's Encrypt menggunakan Certbot:

1. Pasang certbot dan plugin Nginx:
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```
2. Jalankan certbot untuk secara otomatis mendeteksi konfigurasi domain Nginx dan memasang sertifikat SSL:
   ```bash
   sudo certbot --nginx -d kopikita.com -d www.kopikita.com
   ```
3. Ikuti panduan di layar: masukkan email Anda, setujui persyaratan layanan, dan pilih opsi **Redirect** untuk mengarahkan otomatis seluruh trafik HTTP (port 80) ke HTTPS (port 443).
4. Selesai! Web Kopi Kita Anda sekarang aktif secara online dengan aman dan menggunakan data real sepenuhnya.

---

## 6. Uji Coba Lokal Sebelum Deploy Hosting
Apabila Anda ingin melakukan uji coba mode produksi lokal terlebih dahulu pada komputer Anda:
1. Buat file `.env` di folder proyek lokal Anda.
2. Tambahkan variabel `PRODUCTION=true` serta kredensial SMTP Gmail asli Anda.
3. Jalankan server lokal: `python server.py`.
4. Buka halaman registrasi, isi nama dan email asli Anda, lalu periksa apakah kode OTP benar-benar masuk ke Gmail Anda secara langsung tanpa ada simulasi.
