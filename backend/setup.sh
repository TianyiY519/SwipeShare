#!/bin/bash

echo "🚀 Setting up Fordham SwipeShare Django Backend"
echo "================================================"

# Create virtual environment
echo "📦 Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create Django project
echo "🏗️  Creating Django project..."
django-admin startproject config .

# Create apps
echo "📱 Creating Django apps..."
python manage.py startapp users
python manage.py startapp swipes
python manage.py startapp forum
python manage.py startapp moderation

# Create apps directory and move apps
mkdir -p apps
mv users apps/
mv swipes apps/
mv forum apps/
mv moderation apps/

# Create .env file
echo "📝 Creating .env file..."
cat > .env << EOL
# Django Settings
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/fordham_swipeshare

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
# For production, use:
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your-email@fordham.edu
# EMAIL_HOST_PASSWORD=your-app-password

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081

# Firebase Admin SDK (for push notifications)
FIREBASE_CREDENTIALS_PATH=path/to/serviceAccountKey.json

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=15  # minutes
JWT_REFRESH_TOKEN_LIFETIME=7  # days
EOL

echo ""
echo "✅ Django backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Install PostgreSQL and create database"
echo "3. Run: python manage.py makemigrations"
echo "4. Run: python manage.py migrate"
echo "5. Run: python manage.py createsuperuser"
echo "6. Run: python manage.py runserver"
echo ""
echo "================================================"
