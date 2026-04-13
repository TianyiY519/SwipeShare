@echo off
echo ========================================
echo   Fordham SwipeShare Django Setup
echo ========================================
echo.

echo Step 1: Creating virtual environment...
python -m venv venv
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to create virtual environment
    echo Make sure Python 3.10+ is installed
    pause
    exit /b 1
)
echo ✅ Virtual environment created
echo.

echo Step 2: Activating virtual environment...
call venv\Scripts\activate.bat
echo ✅ Virtual environment activated
echo.

echo Step 3: Upgrading pip...
python -m pip install --upgrade pip
echo ✅ Pip upgraded
echo.

echo Step 4: Installing Django and dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

echo Step 5: Creating Django project...
if not exist manage.py (
    django-admin startproject config .
    echo ✅ Django project created
) else (
    echo ℹ️  Django project already exists
)
echo.

echo Step 6: Creating Django apps...
if not exist apps mkdir apps

if not exist apps\users (
    python manage.py startapp users
    move users apps\
    echo ✅ Created users app
) else (
    echo ℹ️  users app already exists
)

if not exist apps\swipes (
    python manage.py startapp swipes
    move swipes apps\
    echo ✅ Created swipes app
) else (
    echo ℹ️  swipes app already exists
)

if not exist apps\forum (
    python manage.py startapp forum
    move forum apps\
    echo ✅ Created forum app
) else (
    echo ℹ️  forum app already exists
)

if not exist apps\moderation (
    python manage.py startapp moderation
    move moderation apps\
    echo ✅ Created moderation app
) else (
    echo ℹ️  moderation app already exists
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update config/settings.py (will be done automatically)
echo 2. Run: python manage.py makemigrations
echo 3. Run: python manage.py migrate
echo 4. Run: python manage.py createsuperuser
echo 5. Run: python manage.py runserver
echo.
echo Press any key to continue...
pause
