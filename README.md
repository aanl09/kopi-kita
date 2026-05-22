# Kopi Kita

Kopi Kita is a mobile-first premium coffee ordering web app demo. It includes product browsing, cart checkout, order history, configurable QRIS payment settings, cashier/admin flows, and optional OTP registration through a backend service.

## Features

- Responsive coffee shop storefront with promo banners and product cards
- Menu search and category filtering
- Cart and checkout flow with local order history
- Cashier/admin portal concept with configurable shop name, QRIS image, and PINs
- Optional OTP API for registration using SMTP/Gmail App Password
- Static frontend that can run directly on GitHub Pages

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Static assets: PNG product images in `assets/`
- Optional backend: Python `http.server` based API (`server.py`) or Node.js/Express API (`server/server.js`)

## Project Structure

- `index.html` — main application UI
- `style.css` — responsive styling and app layout
- `app.js` — app state, menu, cart, checkout, settings, and UI interactions
- `assets/` — product and promo images
- `server.py` — optional Python static/API server with OTP endpoints
- `server/` — optional Node.js OTP backend
- `DEPLOYMENT.md` — production deployment notes

## Run Locally

Static preview:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

Optional Python backend:

```bash
cp server/.env.example server/.env
python3 server.py
```

Optional Node.js backend:

```bash
cd server
cp .env.example .env
npm install
npm start
```

## Environment Configuration

Do not commit real `.env` files. Use `server/.env.example` as a template:

```env
PORT=3000
PRODUCTION=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

For production OTP email delivery, enable Gmail 2-Step Verification, create an App Password, place it in `.env`, and set `PRODUCTION=true`.

## GitHub Pages Demo

The frontend is static and deploys from the repository root using GitHub Pages.

## License

Demo project for presentation and customization.
