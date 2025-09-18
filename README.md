---

# Vitaa

Vitaa is a full-stack web application built with **Django** (backend) and **Next.js** (frontend).
It provides a modern, scalable foundation for building interactive web platforms with a clean separation between API services and UI.

---

## 📂 Project Structure

```
vitaa/
├─ backend/        # Django REST Framework backend
│  ├─ core/        # Django project files
│  ├─ manage.py
│  └─ requirements.txt
├─ frontend/       # Next.js frontend
│  ├─ package.json
│  ├─ next.config.js
│  └─ (app/ or pages/)
├─ .gitignore
└─ README.md
```

---

## 🚀 Features

* **Backend (Django + DRF)**

  * RESTful API endpoints
  * Database models & migrations
  * CORS support for frontend requests
* **Frontend (Next.js)**

  * Server-side rendering (SSR) & static site generation (SSG)
  * API integration with Django backend
  * TailwindCSS for styling (optional)
* **Monorepo setup**

  * One Git repo for both frontend & backend
  * Shared environment configuration
* **Optional**

  * Docker support for containerized development
  * GitHub Actions CI/CD

---

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ZhengChenLim/vitaa.git
cd vitaa
```

### 2. Backend (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

👉 Runs at `http://127.0.0.1:8000`

### 3. Frontend (Next.js)

```bash
cd ../frontend
npm install
npm run dev
```

👉 Runs at `http://localhost:3000`

---

## ⚙️ Environment Variables

* **Backend (`backend/.env`)**

  ```
  SECRET_KEY=your-secret-key
  DEBUG=1
  ```

* **Frontend (`frontend/.env.local`)**

  ```
  NEXT_PUBLIC_API_BASE=/api
  ```

---

## 🔄 API Proxy (Dev)

The Next.js app proxies API calls to Django during development.
Configured in `frontend/next.config.js`:

```js
rewrites: async () => [
  { source: "/api/:path*", destination: "http://127.0.0.1:8000/:path*" }
],
```

---

## 🧪 Running Tests

* **Backend (Django)**

  ```bash
  cd backend
  python manage.py test
  ```

* **Frontend (Next.js)**

  ```bash
  cd frontend
  npm run test
  ```

---

## 📦 Deployment

You can deploy:

* Backend (Django) → Any server (Gunicorn, Nginx, Docker, etc.)
* Frontend (Next.js) → Vercel, Netlify, or served via Node.js

Optional: use Docker Compose for full-stack deployment.

---

## 👥 Team

* **Project Name:** Vitaa
* **Stack:** Django (REST API) + Next.js (React frontend)
* **Maintainers:** \[Your team members]

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

⚡ Ready to build with Vitaa! 🎉

---

Do you want me to make this **README more academic-focused** (e.g., with sections like *Problem Statement, Objectives, System Architecture*) since this might also tie to your **FIT5120 / university deliverables**?

## Populating the Database

Ensure the following files are in the data folder. (data folder path:vitaa\backend\core\data)
 - final_food_data.csv
 - NCD_Quiz_Translated.xlsx
 - ncd_statistics.csv
 - physical_activity.csv
 - Weekly_Physical_Challenges_Translated.xlsx

If your server already have a prior version db it is safer to remove it and repopulate it to ensure the data is up to date.

*Note: This must be done from the core directory in the terminal (vitaa/backend/core)*

1. Remove the previous db. (Skip if there is no previous db)
    **rm db.sqlite3**
2. Delete any previous migrrations. (Skip if there is no previous db)
    **find vitaa_app/migrations -type f ! -name "__init__.py" -delete**
3. Make new migrations.
    **python manage.py makemigrations**
4. Migrate
    **python manage.py migrate**
5. Import food data.
    **python manage.py import_food_data data/final_food_data.csv**
6. Import physical activity data.
    **python manage.py import_physical_activity --path data/physical_activity.csv**
7. Import quiz and challenges data.
    **python manage.py import_quiz_challenge --quiz data/NCD_Quiz_Translated.xlsx --challenges data/Weekly_Physical_Challenges_Translated.xlsx**
8. Import ncd statistics data.
    **python manage.py import_ncd_statistics --path "data/ncd_statistics.csv"**
