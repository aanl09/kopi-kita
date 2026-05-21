import os
import re
import ssl
import json
import time
import random
import smtplib
import mimetypes
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load environment variables from .env manually to avoid external dependencies like python-dotenv
def load_env():
    env_vars = {
        "PORT": "3000",
        "PRODUCTION": "false",
        "SMTP_HOST": "smtp.gmail.com",
        "SMTP_PORT": "587",
        "SMTP_USER": "",
        "SMTP_PASS": ""
    }
    
    # First search in server/.env, then in root .env
    env_paths = [
        os.path.join("server", ".env"),
        ".env"
    ]
    
    for path in env_paths:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        if "=" in line:
                            key, val = line.split("=", 1)
                            # Remove optional quotes
                            val = val.strip("'\"")
                            env_vars[key.strip()] = val
                print(f"[ENV] Loaded configuration from {path}")
                break
            except Exception as e:
                print(f"[ENV Error] Failed to read {path}: {e}")
    return env_vars

ENV = load_env()
PORT = int(os.environ.get("PORT", ENV.get("PORT", 3000)))

# In-memory store for OTPs (Key: email, Value: { "otp": otp, "expires": expires, "name": name })
active_otps = {}
active_otps_lock = threading.Lock()

# Background thread to clean up expired OTPs every 60 seconds
def cleanup_expired_otps():
    while True:
        time.sleep(60)
        now = time.time() * 1000  # milliseconds
        with active_otps_lock:
            expired_keys = [email for email, data in active_otps.items() if data["expires"] < now]
            for email in expired_keys:
                del active_otps[email]
                print(f"[OTP Expired] OTP untuk {email} telah dihapus karena kadaluarsa.")

cleanup_thread = threading.Thread(target=cleanup_expired_otps, daemon=True)
cleanup_thread.start()

class KopiKitaRequestHandler(BaseHTTPRequestHandler):
    
    def end_headers(self):
        # Allow CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Resolve requested path
        path = self.path.split('?', 1)[0]  # remove query params
        if path == "/" or path == "":
            path = "/index.html"
            
        # Try to serve file from root directory
        filepath = os.path.join(os.getcwd(), path.lstrip("/"))
        
        # Security check to prevent directory traversal
        real_filepath = os.path.realpath(filepath)
        real_cwd = os.path.realpath(os.getcwd())
        
        if not real_filepath.startswith(real_cwd):
            self.send_response(403)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"403 Forbidden")
            return
            
        if os.path.exists(real_filepath) and os.path.isfile(real_filepath):
            # Guess MIME type
            mime_type, _ = mimetypes.guess_type(real_filepath)
            if not mime_type:
                # Custom fallback
                if filepath.endswith(".js"):
                    mime_type = "application/javascript"
                elif filepath.endswith(".css"):
                    mime_type = "text/css"
                else:
                    mime_type = "application/octet-stream"
                    
            try:
                with open(real_filepath, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", mime_type)
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(f"500 Internal Server Error: {e}".encode())
        else:
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"404 Not Found")

    def do_POST(self):
        # Check endpoint
        path = self.path.split('?', 1)[0]
        
        if path == "/api/otp/request":
            self.handle_otp_request()
        elif path == "/api/otp/verify":
            self.handle_otp_verify()
        else:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "message": "Endpoint tidak ditemukan."}).encode())

    def handle_otp_request(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"success": False, "message": "Format data JSON tidak valid."})
            return
            
        name = data.get("name")
        email = data.get("email")
        
        if not name or not email:
            self.send_json_response(400, {"success": False, "message": "Nama dan email harus diisi."})
            return
            
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        expires = (time.time() + 3 * 60) * 1000  # 3 minutes from now in ms
        
        # Store in-memory
        with active_otps_lock:
            active_otps[email.lower()] = {
                "otp": otp,
                "expires": expires,
                "name": name
            }
            
        print(f"[OTP Generated] Email: {email} | OTP: {otp} (Berlaku s/d {time.strftime('%H:%M:%S', time.localtime(expires/1000))})")
        
        # Check if SMTP credentials are mock
        smtp_user = ENV.get("SMTP_USER", "")
        smtp_pass = ENV.get("SMTP_PASS", "")
        is_production = ENV.get("PRODUCTION", "false").lower() == "true"
        
        is_mock = (
            not smtp_user or 
            "your-email" in smtp_user or 
            not smtp_pass or 
            "your-16-char" in smtp_pass
        )
        
        if is_mock:
            if is_production:
                print("[Production Mode API] Registrasi ditolak karena SMTP server belum dikonfigurasi.")
                self.send_json_response(500, {
                    "success": False,
                    "message": "Konfigurasi SMTP server belum lengkap. Pendaftaran akun dinonaktifkan sementara."
                })
                return
            
            print("[Mock Mode API] Kredensial SMTP belum dikonfigurasi. Mengirimkan respons simulasi dengan OTP.")
            self.send_json_response(200, {
                "success": True,
                "mockMode": True,
                "otp": otp,
                "message": "Menggunakan mode simulasi karena SMTP belum dikonfigurasi di berkas .env."
            })
            return
            
        # Send physical email via SMTP
        try:
            self.send_otp_email(email, name, otp)
            print(f"[Email Sent] Email OTP sukses dikirim ke {email}")
            self.send_json_response(200, {
                "success": True, 
                "message": "Kode OTP telah dikirim ke Gmail Anda."
            })
        except Exception as e:
            print(f"[SMTP Error] Gagal mengirim email ke {email}: {e}")
            if is_production:
                self.send_json_response(500, {
                    "success": False,
                    "message": "Gagal mengirim kode verifikasi ke Gmail Anda. Silakan coba beberapa saat lagi."
                })
                return
                
            # Fallback to simulated delivery in response if SMTP fails (Only in Development)
            self.send_json_response(200, {
                "success": True,
                "mockMode": True,
                "otp": otp,
                "message": f"Email gagal dikirim karena kesalahan SMTP. Menggunakan OTP Simulasi: {otp}. Detail: {str(e)}"
            })

    def send_otp_email(self, to_email, name, otp):
        smtp_host = ENV.get("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(ENV.get("SMTP_PORT", 587))
        smtp_user = ENV.get("SMTP_USER")
        smtp_pass = ENV.get("SMTP_PASS")
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"{otp} adalah Kode OTP Registrasi Kopi Kita Anda"
        msg['From'] = f"Kopi Kita - Premium Coffee <{smtp_user}>"
        msg['To'] = to_email
        
        # Premium HTML Template matching server.js
        html_content = f"""
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF6F0; padding: 40px 20px; text-align: center; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #E6DFD5;">
            <!-- Header Logo -->
            <div style="margin-bottom: 30px;">
                <h1 style="color: #332115; font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 0; font-family: Georgia, serif;">KOPI <span style="color: #3D5A45;">KITA</span></h1>
                <p style="color: #8c7b70; font-size: 12px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Premium Coffee & Bakery Co.</p>
            </div>
            
            <!-- Email Body -->
            <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 6px; box-shadow: 0 4px 10px rgba(51,33,21,0.05); text-align: left;">
                <h2 style="color: #332115; font-size: 20px; margin-top: 0; font-weight: 600;">Halo, {name}!</h2>
                <p style="color: #5C4A3C; font-size: 15px; line-height: 1.6;">Terima kasih telah melakukan pendaftaran di aplikasi web Kopi Kita. Silakan gunakan kode verifikasi di bawah ini untuk menyelesaikan pendaftaran akun Anda:</p>
                
                <!-- OTP Display Code Box -->
                <div style="background-color: #FAF6F0; border-left: 4px solid #3D5A45; padding: 20px; text-align: center; margin: 30px 0; border-radius: 4px;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #332115; font-family: monospace;">{otp}</span>
                    <p style="color: #8c7b70; font-size: 11px; margin: 10px 0 0 0;">Kode OTP ini berlaku selama 3 menit. Jangan bagikan kode ini kepada siapa pun.</p>
                </div>
                
                <p style="color: #5C4A3C; font-size: 15px; line-height: 1.6;">Setelah verifikasi sukses, Anda dapat langsung menjelajahi puluhan varian es kopi susu aren legit, cappuccino hangat, boba, dan pastry renyah khas barista kami.</p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 30px; color: #8c7b70; font-size: 12px; line-height: 1.5;">
                <p style="margin: 0;">&copy; 2026 Kopi Kita. Seduhan Kehangatan Sepenuh Hati.</p>
                <p style="margin: 5px 0 0 0;">Jl. Kopi Pilihan No. 88, Jakarta Selatan, Indonesia</p>
            </div>
        </div>
        """
        
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))
        
        # Connect to SMTP
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.ehlo()
        if smtp_port == 587:
            server.starttls()
            server.ehlo()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_email, msg.as_string())
        server.quit()

    def handle_otp_verify(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
        except Exception:
            self.send_json_response(400, {"success": False, "message": "Format data JSON tidak valid."})
            return
            
        email = data.get("email")
        otp = data.get("otp")
        
        if not email or not otp:
            self.send_json_response(400, {"success": False, "message": "Email dan kode OTP harus diisi."})
            return
            
        key = email.lower()
        
        with active_otps_lock:
            stored = active_otps.get(key)
            
            if not stored:
                self.send_json_response(400, {"success": False, "message": "Kode OTP tidak ditemukan. Silakan kirim ulang."})
                return
                
            if stored["expires"] < time.time() * 1000:
                del active_otps[key]
                self.send_json_response(400, {"success": False, "message": "Kode OTP telah kadaluarsa. Silakan kirim ulang."})
                return
                
            if stored["otp"] != otp:
                self.send_json_response(400, {"success": False, "message": "Kode OTP yang Anda masukkan salah."})
                return
                
            name = stored["name"]
            # Clear used OTP
            del active_otps[key]
            
        print(f"[OTP Verified] Sukses memverifikasi pendaftaran untuk {email}")
        self.send_json_response(200, {
            "success": True,
            "message": "Verifikasi akun berhasil!",
            "user": {
                "name": name,
                "email": email,
                "avatarLetter": name[0].upper() if name else "K"
            }
        })

    def send_json_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, KopiKitaRequestHandler)
    print(f"====================================================")
    print(f"  KOPI KITA PYTHON SERVER RUNNING ON PORT {PORT}")
    print(f"  Url Aplikasi         : http://localhost:{PORT}")
    print(f"  Endpoint Request OTP : POST http://localhost:{PORT}/api/otp/request")
    print(f"  Endpoint Verify OTP  : POST http://localhost:{PORT}/api/otp/verify")
    print(f"  Menggunakan folder   : {os.getcwd()}")
    print(f"====================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server()
