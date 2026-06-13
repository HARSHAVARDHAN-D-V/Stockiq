# 🥦 StockIQ — Smart Home Pantry Tracker

A full-stack web application to track home pantry items, monitor expiry dates, manage shopping lists, and get AI-powered recipe suggestions.

**Live Demo:** https://stockiq-one.vercel.app

---

## 🚀 Features

- **Pantry Tracking** — Add items with quantity, unit, category, and expiry date
- **Expiry Alerts** — Color coded cards (🟢 fresh, 🟡 expiring soon, 🔴 expired)
- **Fridge Tag** — Mark items as fridge items with ❄️ indicator
- **Min Quantity Threshold** — Set restock alerts per item (0 = one-off item)
- **Smart Shopping List** — Auto-generated from expired, expiring, and low stock items
- **Home Recipes** — Save your own recipes with ingredient matching against pantry
- **AI Recipe Suggestions** — Groq (Llama 3) suggests Indian dishes based on available ingredients
- **Dark / Light Mode** — Toggle between themes, preference saved across sessions
- **PWA Support** — Installable on Android as a home screen app
- **Mobile First** — Fully responsive design

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JS |
| Backend | Python, FastAPI |
| Database | SQLite + SQLAlchemy |
| AI | Groq API (Llama 3.3 70B) |
| Hosting (Frontend) | Vercel |
| Hosting (Backend) | ngrok (dev) / AWS EC2 (prod) |

---

## 📁 Project Structure
Stockiq/

├── backend/

│   ├── main.py          # FastAPI routes

│   ├── models.py        # SQLAlchemy models

│   ├── database.py      # DB connection setup

│   ├── requirements.txt

│   └── .env             # API keys (not committed)

├── frontend/

│   ├── index.html

│   ├── style.css

│   ├── app.js

│   ├── manifest.json    # PWA manifest

│   └── service-worker.js

├── start.bat            # One-click startup script (Windows)

└── README.md

---

## ⚙️ Local Setup

**1. Clone the repo:**
```bash
git clone https://github.com/HARSHAVARDHAN-D-V/Stockiq.git
cd Stockiq
```

**2. Create virtual environment:**
```bash
python -m venv venv --without-pip
venv\Scripts\activate
pip install -r backend/requirements.txt
```

**3. Add environment variables:**

Create `backend/.env`:
GROQ_API_KEY=your_groq_api_key_here

**4. Start the backend:**
```bash
cd backend
uvicorn main:app --reload
```

**5. Start ngrok:**
```bash
ngrok http --url=your-ngrok-url.ngrok-free.dev 8000
```

**6. Update API URL in `frontend/app.js`:**
```javascript
const API = "https://your-ngrok-url.ngrok-free.dev"
```

**7. Open `frontend/index.html` in browser or use Live Server**

> Or just double click `start.bat` for steps 4 and 5 automatically.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/items` | Get all pantry items |
| POST | `/items` | Add new item |
| PUT | `/items/{id}` | Update quantity and expiry |
| DELETE | `/items/{id}` | Delete item |
| GET | `/items/shopping` | Get shopping list |
| GET | `/recipes` | Get all home recipes |
| POST | `/recipes` | Add new recipe |
| PUT | `/recipes/{id}` | Edit recipe |
| DELETE | `/recipes/{id}` | Delete recipe |
| GET | `/suggest` | AI recipe suggestions (cached) |

---

## 📱 PWA Installation (Android)

1. Open https://stockiq-one.vercel.app in Chrome
2. Tap the three dot menu
3. Tap **Add to Home Screen**
4. App icon appears on home screen

---

## 🧠 What I Learned

- Building REST APIs with FastAPI and Pydantic validation
- Database modeling and CRUD with SQLAlchemy + SQLite
- CORS handling between frontend and backend
- Integrating third party AI APIs (Groq) with response caching
- Mobile-first responsive CSS
- PWA setup with service workers and manifest
- Deployment with Vercel and ngrok
