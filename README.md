# Kopi Kita

Kopi Kita is a premium coffee ordering web application designed for coffee shops that want a clean, mobile-first digital ordering experience. The application presents a modern storefront where customers can browse coffee drinks and bakery items, add products to a cart, place orders, and complete a simple registration flow with OTP verification.

The project combines a responsive front-end interface with lightweight backend options for OTP delivery, making it suitable for small coffee businesses, portfolio demonstrations, and prototype deployments.

## Key Features

- Mobile-first coffee shop interface with a smartphone-style preview layout
- Product menu for coffee, drinks, and bakery items
- Promotional banner slider for daily offers and featured products
- Shopping cart and checkout flow
- Customer registration with OTP verification
- Local order history storage in the browser
- Cashier/barista portal concept with PIN-based access
- Store settings for shop name, cashier PIN, admin PIN, and QRIS image customization
- Python backend server for static file hosting and OTP API endpoints
- Optional Node.js/Express backend with Nodemailer support
- Deployment guide for VPS, Nginx reverse proxy, and HTTPS setup

## Application Overview

Kopi Kita is built as a practical digital ordering prototype for a coffee brand. Customers can explore promotions, search menu items, manage their cart, and continue through a checkout experience. The app also includes business-side features such as order history, store configuration, and QRIS payment image customization.

For account verification, the backend can send OTP codes through SMTP when production credentials are configured. In development mode, the backend can return simulated OTP responses, which makes local testing easier without requiring a real email setup.

## Tech Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage for client-side state

### Backend Options

- Python HTTP server with OTP API support (`server.py`)
- Node.js Express backend with Nodemailer (`server/server.js`)

## Project Structure

```text
kopi-kita/
├── index.html              # Main web application UI
├── style.css               # Application styling and responsive layout
├── app.js                  # Frontend logic, cart, settings, and interactions
├── server.py               # Python server and OTP API implementation
├── DEPLOYMENT.md           # Deployment guide for VPS/Nginx/HTTPS
├── assets/                 # Product and promotional images
└── server/                 # Optional Node.js backend
    ├── package.json
    ├── server.js
    └── .env.example
```

## Getting Started

### Option 1: Run with Python

```bash
python3 server.py
```

Then open:

```text
http://localhost:3000
```

### Option 2: Run the Node.js backend

```bash
cd server
npm install
cp .env.example .env
npm start
```

The Node.js backend starts on the configured `PORT` value, defaulting to `3000`.

## Environment Configuration

Create a `.env` file based on `server/.env.example` when using real OTP email delivery.

```env
PORT=3000
PRODUCTION=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

Important: never commit real `.env` files or SMTP credentials to GitHub.

## Production Notes

For production deployment, set:

```env
PRODUCTION=true
```

When production mode is enabled, OTP simulation is disabled and real SMTP credentials are required. See `DEPLOYMENT.md` for a full VPS deployment flow using Nginx and Let's Encrypt SSL.

## Repository Description

A mobile-first premium coffee ordering web app with product browsing, cart checkout, OTP registration, cashier portal concept, and configurable QRIS payment settings.

## License

This project is provided for portfolio, learning, and small-business prototype use.
