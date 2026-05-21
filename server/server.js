const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so the frontend SPA can communicate with the backend
app.use(cors());
app.use(express.json());

// In-memory store for OTPs (Key: email, Value: { otp, expires, name })
const activeOTPs = {};

// Clean up expired OTPs every 1 minute
setInterval(() => {
    const now = Date.now();
    for (const email in activeOTPs) {
        if (activeOTPs[email].expires < now) {
            delete activeOTPs[email];
            console.log(`[OTP Expired] OTP untuk ${email} telah dihapus karena kadaluarsa.`);
        }
    }
}, 60000);

// Endpoint 1: Request OTP
app.post('/api/otp/request', async (req, res) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Nama dan email harus diisi.' });
    }
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 3 * 60 * 1000; // 3 minutes expiration
    
    // Store OTP in memory
    activeOTPs[email.toLowerCase()] = { otp, expires, name };
    console.log(`[OTP Generated] Email: ${email} | OTP: ${otp} (Berlaku s/d ${new Date(expires).toLocaleTimeString()})`);
    
    // Check if SMTP credentials are still placeholders
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const isMock = !smtpUser || smtpUser.includes('your-email') || !smtpPass || smtpPass.includes('your-16-char');
    
    if (isMock) {
        console.log(`[Mock Mode API] Kredensial SMTP belum dikonfigurasi. Mengirimkan respons simulasi dengan OTP.`);
        return res.status(200).json({
            success: true,
            mockMode: true,
            otp: otp,
            message: 'Menggunakan mode simulasi karena SMTP belum dikonfigurasi di berkas .env.'
        });
    }
    
    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    
    // Premium HTML Email Template
    const mailOptions = {
        from: `"Kopi Kita - Premium Coffee" <${smtpUser}>`,
        to: email,
        subject: `${otp} adalah Kode OTP Registrasi Kopi Kita Anda`,
        html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FAF6F0; padding: 40px 20px; text-align: center; border-radius: 8px; max-width: 600px; margin: 0 auto; border: 1px solid #E6DFD5;">
            <!-- Header Logo -->
            <div style="margin-bottom: 30px;">
                <h1 style="color: #332115; font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 0; font-family: Georgia, serif;">KOPI <span style="color: #3D5A45;">KITA</span></h1>
                <p style="color: #8c7b70; font-size: 12px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">Premium Coffee & Bakery Co.</p>
            </div>
            
            <!-- Email Body -->
            <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 6px; box-shadow: 0 4px 10px rgba(51,33,21,0.05); text-align: left;">
                <h2 style="color: #332115; font-size: 20px; margin-top: 0; font-weight: 600;">Halo, ${name}!</h2>
                <p style="color: #5C4A3C; font-size: 15px; line-height: 1.6;">Terima kasih telah melakukan pendaftaran di aplikasi web Kopi Kita. Silakan gunakan kode verifikasi di bawah ini untuk menyelesaikan pendaftaran akun Anda:</p>
                
                <!-- OTP Display Code Box -->
                <div style="background-color: #FAF6F0; border-left: 4px solid #3D5A45; padding: 20px; text-align: center; margin: 30px 0; border-radius: 4px;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #332115; font-family: monospace;">${otp}</span>
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
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email Sent] Email OTP sukses dikirim ke ${email}`);
        res.status(200).json({ success: true, message: 'Kode OTP telah dikirim ke Gmail Anda.' });
    } catch (error) {
        console.error(`[Nodemailer Error] Gagal mengirim email ke ${email}:`, error);
        // Fallback to simulated delivery in response if SMTP fails
        res.status(200).json({
            success: true,
            mockMode: true,
            otp: otp,
            message: `Email gagal dikirim karena kesalahan SMTP. Menggunakan OTP Simulasi: ${otp}. Detail: ${error.message}`
        });
    }
});

// Endpoint 2: Verify OTP
app.post('/api/otp/verify', (req, res) => {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email dan kode OTP harus diisi.' });
    }
    
    const key = email.toLowerCase();
    const stored = activeOTPs[key];
    
    if (!stored) {
        return res.status(400).json({ success: false, message: 'Kode OTP tidak ditemukan. Silakan kirim ulang.' });
    }
    
    if (stored.expires < Date.now()) {
        delete activeOTPs[key];
        return res.status(400).json({ success: false, message: 'Kode OTP telah kadaluarsa. Silakan kirim ulang.' });
    }
    
    if (stored.otp !== otp) {
        return res.status(400).json({ success: false, message: 'Kode OTP yang Anda masukkan salah.' });
    }
    
    // OTP is correct! Clean it up and return user info for auto-login
    const name = stored.name;
    delete activeOTPs[key];
    
    console.log(`[OTP Verified] Sukses memverifikasi pendaftaran untuk ${email}`);
    res.status(200).json({
        success: true,
        message: 'Verifikasi akun berhasil!',
        user: {
            name: name,
            email: email,
            avatarLetter: name.charAt(0).toUpperCase()
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  KOPI KITA BACKEND SERVER RUNNING ON PORT ${PORT}`);
    console.log(`  Endpoint Request OTP : POST http://localhost:${PORT}/api/otp/request`);
    console.log(`  Endpoint Verify OTP  : POST http://localhost:${PORT}/api/otp/verify`);
    console.log(`====================================================`);
});
