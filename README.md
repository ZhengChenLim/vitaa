---

# Vitaa

Vitaa is a full-stack web application built with **Django** (backend) and **Next.js** (frontend).
It provides a modern, scalable foundation for building interactive web platforms with a clean separation between API services and UI.

---

## 📂 Project Structure

```
vitaa/
├─ backend/
│  ├─ core/        
│  ├─ manage.py
│  └─ requirements.txt
├─ frontend/
│  ├─ package.json
│  ├─ next.config.js
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
  * TailwindCSS and Shadcn for styling 


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

* Backend (Django) → Any server (Gunicorn, Nginx, etc.)
* Frontend (Next.js) →  served via Node.js

Optional: use Docker Compose for full-stack deployment.

---

## 👥 Team

* **Project Name:** Vitaa
* **Stack:** Django (REST API) + Next.js (React frontend)
* **Maintainers:** Six Minus One

---

## 📜 License

**Intellectual Property Notice**

This repository contains work completed as part of a Monash University project.
All IP belongs to Monash University and is used here for academic purposes only.

---

⚡ Ready to build with Vitaa! 🎉

---

Do you want me to make this **README more academic-focused** (e.g., with sections like *Problem Statement, Objectives, System Architecture*) since this might also tie to your **FIT5120 / university deliverables**?

## Populating the Database

Ensure the following files are in the `data` folder:  
*(path: `vitaa/backend/core/data`)*

- `final_food_data.csv`
- `NCD_Quiz_Translated.xlsx`
- `ncd_statistics.csv`
- `physical_activity.csv`
- `Weekly_Physical_Challenges_Translated.xlsx`

If your server already has a prior version of the database, it is safer to remove it and repopulate it to ensure the data is up to date.

> **Note:** Run all commands from the **core** directory in the terminal (`vitaa/backend/core`).

---

### 1. Remove the previous DB (skip if there is no previous DB)
```bash
rm db.sqlite3
```
### 2. Delete any previous migrations (skip if there is no previous DB)
```bash
find vitaa_app/migrations -type f ! -name "__init__.py" -delete
```
### 3. Make new migrations
```bash
python manage.py makemigrations
```
### 4. Apply migrations
```bash
python manage.py migrate
```
### 5. Import food data
```bash
python manage.py import_food_data data/final_food_data.csv
```
### 6. Import physical activity data
```bash
python manage.py import_physical_activity --path data/physical_activity.csv
```
### 7. Import quiz and challenges data
```bash
python manage.py import_quiz_challenge --quiz data/NCD_Quiz_Translated.xlsx --challenges data/Weekly_Physical_Challenges_Translated.xlsx
```
### 8. Import NCD statistics data
```bash
python manage.py import_ncd_statistics --path "data/ncd_statistics.csv"
```