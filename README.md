# COMO RODAR
# 1. Crie o .env
cp .env.example .env

# 2. Suba tudo com Docker
docker compose up --build

# ── Ou localmente ──

# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
