For Dev
1. Clone the repository
git clone https://github.com/ZhengChenLim/vitaa.git
cd vitaa

2. Backend (Django)
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver


👉 Runs at http://127.0.0.1:8000

3. Frontend (Next.js)
cd ../frontend
npm install
npm run dev


👉 Runs at http://localhost:3000
