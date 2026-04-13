# Django Backend Setup Guide

## Prerequisites

1. **Python 3.10+** - Download from [python.org](https://www.python.org/downloads/)
2. **PostgreSQL 15+** - Download from [postgresql.org](https://www.postgresql.org/download/)
3. **Git** (optional) - For version control

## Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
cd d:\Capstone\FordhamSwipeShare\backend
setup.bat
```

**Mac/Linux:**
```bash
cd d:\Capstone\FordhamSwipeShare\backend
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

Follow the steps below for manual configuration.

---

## Step 1: Install PostgreSQL

### Windows:
1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer, remember the password you set for `postgres` user
3. Install default port `5432`
4. Add PostgreSQL to PATH (installer should do this)

### Mac (with Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Verify Installation:
```bash
psql --version
# Should show: psql (PostgreSQL) 15.x
```

---

## Step 2: Create Database

### Open PostgreSQL Shell:

**Windows:**
- Start Menu → PostgreSQL 15 → SQL Shell (psql)
- Or via cmd: `psql -U postgres`

**Mac/Linux:**
```bash
psql postgres
```

### Create Database and User:
```sql
-- Create database
CREATE DATABASE fordham_swipeshare;

-- Create user (optional, can use default postgres user)
CREATE USER swipeshare_admin WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE fordham_swipeshare TO swipeshare_admin;

-- Exit psql
\q
```

### Verify Database:
```bash
psql -U postgres -d fordham_swipeshare -c "SELECT version();"
```

---

## Step 3: Set Up Python Virtual Environment

```bash
cd d:\Capstone\FordhamSwipeShare\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

# Your prompt should now show (venv)
```

---

## Step 4: Install Django and Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install all requirements
pip install -r requirements.txt

# Verify installation
python -c "import django; print(django.get_version())"
# Should print: 5.0
```

---

## Step 5: Create Django Project

```bash
# Create Django project named "config"
django-admin startproject config .

# The . at the end creates it in the current directory
```

Your structure should now look like:
```
backend/
├── venv/
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── manage.py
└── requirements.txt
```

---

## Step 6: Create Django Apps

```bash
# Create apps
python manage.py startapp users
python manage.py startapp swipes
python manage.py startapp forum
python manage.py startapp moderation

# Organize into apps directory
mkdir apps
move users apps\       # Windows
move swipes apps\
move forum apps\
move moderation apps\

# Mac/Linux use: mv users apps/
```

Final structure:
```
backend/
├── apps/
│   ├── users/
│   ├── swipes/
│   ├── forum/
│   └── moderation/
├── config/
├── manage.py
└── requirements.txt
```

---

## Step 7: Configure Django Settings

### Create `.env` file in backend/:

```bash
# Django Settings
SECRET_KEY=your-secret-key-generate-new-one
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/fordham_swipeshare

# Email (Console for development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@fordham.edu

# CORS (for React Native)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:8080

# Firebase Admin (we'll set this up later)
FIREBASE_CREDENTIALS_PATH=

# JWT
JWT_ACCESS_TOKEN_LIFETIME=15
JWT_REFRESH_TOKEN_LIFETIME=7
```

### Update `config/settings.py`:

Replace the entire file with:

```python
import os
from pathlib import Path
from datetime import timedelta
import dj_database_url
from decouple import config

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Security
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Applications
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_yasg',

    # Local apps
    'apps.users',
    'apps.swipes',
    'apps.forum',
    'apps.moderation',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600,
    )
}

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/New_York'  # Fordham is in ET
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%S%z',
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=15, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=config('JWT_REFRESH_TOKEN_LIFETIME', default=7, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Settings
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:8081').split(',')
CORS_ALLOW_CREDENTIALS = True

# Email Configuration
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@fordham.edu')

# Firebase Admin SDK
FIREBASE_CREDENTIALS_PATH = config('FIREBASE_CREDENTIALS_PATH', default='')

# Fordham-specific settings
ALLOWED_EMAIL_DOMAIN = '@fordham.edu'
```

---

## Step 8: Run Initial Migrations

```bash
# Create initial migration files
python manage.py makemigrations

# Apply migrations to database
python manage.py migrate

# You should see:
# Running migrations:
#   Applying contenttypes.0001_initial... OK
#   Applying auth.0001_initial... OK
#   ... (more migration output)
```

---

## Step 9: Create Superuser (Admin)

```bash
python manage.py createsuperuser

# Enter details:
# Email: admin@fordham.edu
# Password: (your secure password)
# Password (again): (confirm)
```

---

## Step 10: Test the Server

```bash
# Run development server
python manage.py runserver

# You should see:
# Watching for file changes with StatReloader
# Performing system checks...
# System check identified no issues (0 silenced).
# Django version 5.0, using settings 'config.settings'
# Starting development server at http://127.0.0.1:8000/
# Quit the server with CTRL-BREAK.
```

### Test in browser:
- Visit: http://127.0.0.1:8000/
- You should see Django welcome page

- Visit: http://127.0.0.1:8000/admin/
- Login with superuser credentials
- You should see Django admin panel

---

## Step 11: Generate Secret Key (Production)

For production, generate a secure secret key:

```python
# In Python shell:
python manage.py shell

from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
# Copy the output and use it in .env file
exit()
```

---

## Troubleshooting

### PostgreSQL Connection Error:
```
django.db.utils.OperationalError: could not connect to server
```

**Fix:**
1. Verify PostgreSQL is running:
   ```bash
   # Windows:
   services.msc → Find "postgresql-x64-15" → Start

   # Mac:
   brew services start postgresql@15
   ```

2. Check DATABASE_URL in `.env` matches your PostgreSQL credentials

### Module Import Error:
```
ModuleNotFoundError: No module named 'rest_framework'
```

**Fix:**
- Ensure virtual environment is activated: `venv\Scripts\activate`
- Reinstall requirements: `pip install -r requirements.txt`

### Migration Errors:
```
No changes detected
```

**Fix:**
- Check that apps are in INSTALLED_APPS in settings.py
- Run: `python manage.py makemigrations users swipes forum moderation`

---

## Next Steps

1. ✅ Backend is set up and running
2. 📝 Create Django models (User, SwipeListing, Post, etc.)
3. 🔧 Build API endpoints with Django REST Framework
4. 🎨 Configure Django admin panel
5. 🔗 Connect React Native app to backend

---

## Useful Commands

```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Run server
python manage.py runserver

# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Django shell (interactive Python)
python manage.py shell

# Database shell
python manage.py dbshell

# Check for issues
python manage.py check

# Collect static files (production)
python manage.py collectstatic
```

---

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Django JWT Auth](https://django-rest-framework-simplejwt.readthedocs.io/)
