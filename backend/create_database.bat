@echo off
echo Creating Fordham SwipeShare Database...
echo.

set PGPASSWORD=admin123

"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE fordham_swipeshare;"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Database created successfully!
    echo.
    echo Verifying database exists...
    "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "\l" | findstr fordham_swipeshare
) else (
    echo Database might already exist or there was an error.
    echo Checking if database exists...
    "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "\l" | findstr fordham_swipeshare
)

echo.
echo Done!
pause
