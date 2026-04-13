# PostgreSQL Installation & Setup Guide

## Step 1: Download PostgreSQL

### Windows Installation:

1. **Download PostgreSQL 16** (latest stable version)
   - Go to: https://www.postgresql.org/download/windows/
   - Click "Download the installer"
   - Or direct link: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Select **Windows x86-64** for PostgreSQL 16.x

2. **Run the installer** (`postgresql-16.x-windows-x64.exe`)

---

## Step 2: Install PostgreSQL

### Installation Wizard:

1. **Welcome Screen**
   - Click "Next"

2. **Installation Directory**
   - Default: `C:\Program Files\PostgreSQL\16`
   - Click "Next"

3. **Select Components** (check all):
   - [x] PostgreSQL Server
   - [x] pgAdmin 4 (GUI tool - very useful!)
   - [x] Stack Builder (optional)
   - [x] Command Line Tools
   - Click "Next"

4. **Data Directory**
   - Default: `C:\Program Files\PostgreSQL\16\data`
   - Click "Next"

5. **Password** (IMPORTANT!)
   - Enter a password for the `postgres` superuser
   - **Remember this password!** You'll need it often
   - Example: `admin123` (use something more secure in production)
   - Confirm password
   - Click "Next"

6. **Port**
   - Default: `5432`
   - Keep default unless you have a conflict
   - Click "Next"

7. **Locale**
   - Default: [Default locale]
   - Click "Next"

8. **Summary**
   - Review settings
   - Click "Next"

9. **Installation**
   - Wait for installation to complete (~5 minutes)
   - Click "Next"

10. **Finish**
    - Uncheck "Launch Stack Builder" (not needed now)
    - Click "Finish"

---

## Step 3: Verify Installation

### Option A: Using Command Line

1. **Open Command Prompt** (Win + R, type `cmd`, press Enter)

2. **Check PostgreSQL is in PATH:**
   ```cmd
   psql --version
   ```

   **Expected output:**
   ```
   psql (PostgreSQL) 16.x
   ```

   **If command not found:**
   - Add PostgreSQL to PATH manually:
   - Right-click "This PC" → Properties → Advanced system settings
   - Environment Variables → System Variables → Path → Edit
   - Add: `C:\Program Files\PostgreSQL\16\bin`
   - Restart Command Prompt

3. **Test connection:**
   ```cmd
   psql -U postgres
   ```

   - Enter the password you set during installation
   - You should see:
   ```
   Password for user postgres:
   psql (16.x)
   Type "help" for help.

   postgres=#
   ```

### Option B: Using pgAdmin 4 (GUI)

1. **Launch pgAdmin 4**
   - Start Menu → PostgreSQL 16 → pgAdmin 4

2. **Set Master Password** (first time only)
   - Create a master password for pgAdmin
   - This is different from postgres user password

3. **Connect to Server**
   - Left sidebar: Servers → PostgreSQL 16
   - Enter the postgres password when prompted
   - You should see the database tree

---

## Step 4: Create Database

### Option A: Using Command Line (Recommended)

1. **Open psql shell:**
   ```cmd
   psql -U postgres
   ```
   Enter password when prompted.

2. **Create the database:**
   ```sql
   CREATE DATABASE fordham_swipeshare;
   ```

   **Expected output:**
   ```
   CREATE DATABASE
   ```

3. **Verify database was created:**
   ```sql
   \l
   ```

   You should see `fordham_swipeshare` in the list.

4. **Create a dedicated user (optional but recommended):**
   ```sql
   CREATE USER swipeshare_admin WITH PASSWORD 'your_secure_password';
   ```

5. **Grant privileges to the user:**
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE fordham_swipeshare TO swipeshare_admin;
   ```

6. **Connect to the new database:**
   ```sql
   \c fordham_swipeshare
   ```

7. **Grant schema privileges:**
   ```sql
   GRANT ALL ON SCHEMA public TO swipeshare_admin;
   ```

8. **Exit psql:**
   ```sql
   \q
   ```

### Option B: Using pgAdmin 4 (GUI)

1. **Open pgAdmin 4**

2. **Right-click on "Databases"**
   - Servers → PostgreSQL 16 → Databases
   - Select "Create" → "Database..."

3. **Create Database Dialog:**
   - **Database name:** `fordham_swipeshare`
   - **Owner:** `postgres` (or create a new user first)
   - **Comment:** "Fordham SwipeShare application database"
   - Click "Save"

4. **Verify:**
   - You should see `fordham_swipeshare` in the database list

---

## Step 5: Configure Django Connection

### Update Backend .env File

1. **Navigate to backend folder:**
   ```cmd
   cd d:\Capstone\FordhamSwipeShare\backend
   ```

2. **Create or edit `.env` file:**

   **If using postgres user:**
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/fordham_swipeshare
   ```

   **If you created swipeshare_admin user:**
   ```env
   DATABASE_URL=postgresql://swipeshare_admin:your_secure_password@localhost:5432/fordham_swipeshare
   ```

   Replace:
   - `your_password` - with your actual postgres password
   - `your_secure_password` - with swipeshare_admin password

### Connection String Format:
```
postgresql://[username]:[password]@[host]:[port]/[database_name]
```

Example:
```
postgresql://postgres:admin123@localhost:5432/fordham_swipeshare
```

---

## Step 6: Test Django Connection

1. **Make sure you're in the backend directory:**
   ```cmd
   cd d:\Capstone\FordhamSwipeShare\backend
   ```

2. **Activate virtual environment** (if you've created it):
   ```cmd
   venv\Scripts\activate
   ```

3. **Install psycopg2** (PostgreSQL adapter for Python):
   ```cmd
   pip install psycopg2-binary
   ```

4. **Test connection with Python:**
   ```cmd
   python -c "import psycopg2; conn = psycopg2.connect('dbname=fordham_swipeshare user=postgres password=your_password host=localhost'); print('✅ Connection successful!'); conn.close()"
   ```

   Replace `your_password` with your actual password.

   **Expected output:**
   ```
   ✅ Connection successful!
   ```

---

## Useful PostgreSQL Commands

### psql Shell Commands:

```sql
-- List all databases
\l

-- Connect to a database
\c fordham_swipeshare

-- List all tables in current database
\dt

-- List all users/roles
\du

-- Show current database
SELECT current_database();

-- Show current user
SELECT current_user;

-- Exit psql
\q

-- Get help
\?

-- SQL help
\h CREATE TABLE
```

### SQL Commands:

```sql
-- Create database
CREATE DATABASE fordham_swipeshare;

-- Delete database (careful!)
DROP DATABASE fordham_swipeshare;

-- Create user
CREATE USER swipeshare_admin WITH PASSWORD 'password123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE fordham_swipeshare TO swipeshare_admin;

-- Change user password
ALTER USER postgres PASSWORD 'new_password';

-- List all databases
SELECT datname FROM pg_database;

-- Check database size
SELECT pg_size_pretty(pg_database_size('fordham_swipeshare'));
```

---

## Troubleshooting

### Issue 1: psql command not found

**Solution:**
1. Add PostgreSQL to PATH:
   - Path: `C:\Program Files\PostgreSQL\16\bin`
2. Restart Command Prompt
3. Try again

### Issue 2: Authentication failed

**Error:**
```
FATAL: password authentication failed for user "postgres"
```

**Solution:**
- Double-check your password
- Reset password:
  ```cmd
  # Open Command Prompt as Administrator
  psql -U postgres
  ALTER USER postgres PASSWORD 'new_password';
  ```

### Issue 3: Could not connect to server

**Error:**
```
could not connect to server: Connection refused
```

**Solution:**
1. Check if PostgreSQL service is running:
   - Win + R → `services.msc`
   - Find "postgresql-x64-16"
   - Right-click → Start

2. Or via command line:
   ```cmd
   net start postgresql-x64-16
   ```

### Issue 4: Port 5432 already in use

**Solution:**
1. Check what's using port 5432:
   ```cmd
   netstat -ano | findstr :5432
   ```

2. Either:
   - Stop the other service
   - Or configure PostgreSQL to use a different port
   - Update DATABASE_URL with new port

### Issue 5: Django can't connect to PostgreSQL

**Error:**
```python
django.db.utils.OperationalError: could not connect to server
```

**Checklist:**
- [ ] PostgreSQL service is running
- [ ] DATABASE_URL in .env is correct
- [ ] psycopg2-binary is installed
- [ ] Firewall allows connection
- [ ] Database exists

**Test connection manually:**
```cmd
psql -U postgres -d fordham_swipeshare
```

If this works, Django should work too.

---

## Accessing PostgreSQL

### Command Line:
```cmd
# Connect as postgres user
psql -U postgres

# Connect to specific database
psql -U postgres -d fordham_swipeshare

# Connect as different user
psql -U swipeshare_admin -d fordham_swipeshare
```

### pgAdmin 4 GUI:
- Start Menu → PostgreSQL 16 → pgAdmin 4
- Navigate: Servers → PostgreSQL 16 → Databases → fordham_swipeshare

---

## Backup & Restore (For Later)

### Backup database:
```cmd
pg_dump -U postgres fordham_swipeshare > backup.sql
```

### Restore database:
```cmd
psql -U postgres fordham_swipeshare < backup.sql
```

---

## Next Steps

After PostgreSQL is set up:

1. ✅ PostgreSQL installed
2. ✅ Database `fordham_swipeshare` created
3. ✅ `.env` file updated with DATABASE_URL
4. ⏭️ Run Django setup script
5. ⏭️ Create Django models
6. ⏭️ Run migrations

---

## Quick Reference Card

```
📌 Save this for quick reference:

PostgreSQL Details:
├── Version: 16.x
├── Host: localhost
├── Port: 5432
├── Database: fordham_swipeshare
├── User: postgres
└── Password: [your password]

Connection String:
postgresql://postgres:[password]@localhost:5432/fordham_swipeshare

Start Service (Windows):
net start postgresql-x64-16

Stop Service (Windows):
net stop postgresql-x64-16

Open psql:
psql -U postgres

pgAdmin 4:
Start Menu → PostgreSQL 16 → pgAdmin 4
```

---

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [psql Commands Cheatsheet](https://www.postgresql.org/docs/current/app-psql.html)
