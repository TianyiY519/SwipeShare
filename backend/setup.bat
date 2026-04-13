@echo off
echo 🚀 Setting up Fordham SwipeShare Django Backend
echo ================================================
echo.

REM Create virtual environment
echo 📦 Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Create Django project
echo 🏗️  Creating Django project...
django-admin startproject config .

REM Create apps
echo 📱 Creating Django apps...
python manage.py startapp users
python manage.py startapp swipes
python manage.py startapp forum
python manage.py startapp moderation

REM Create apps directory
if not exist "apps" mkdir apps
move users apps\
move swipes apps\
move forum apps\
move moderation apps\

REM Create .env file
echo 📝 Creating .env file...
(
echo # Django Settings
echo SECRET_KEY=django-insecure-change-this-in-production
echo DEBUG=True
echo ALLOWED_HOSTS=localhost,127.0.0.1
echo.
echo # Database (PostgreSQL^)
echo DATABASE_URL=postgresql://postgres:password@localhost:5432/fordham_swipeshare
echo.
echo # Email Configuration
echo EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
echo.
echo # CORS
echo CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
echo.
echo # Firebase Admin SDK
echo FIREBASE_CREDENTIALS_PATH=path/to/serviceAccountKey.json
echo.
echo # JWT Settings
echo JWT_ACCESS_TOKEN_LIFETIME=15
echo JWT_REFRESH_TOKEN_LIFETIME=7
) > .env

echo.
echo ✅ Django backend setup complete!
echo.
echo Next steps:
echo 1. Update .env file with your configuration
echo 2. Install PostgreSQL and create database
echo 3. Run: python manage.py makemigrations
echo 4. Run: python manage.py migrate
echo 5. Run: python manage.py createsuperuser
echo 6. Run: python manage.py runserver
echo.
echo ================================================
pause
