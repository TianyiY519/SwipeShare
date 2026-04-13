# 🚀 Quick Start - Vite Web Preview

The **fastest** way to see your Fordham SwipeShare interface in the browser!

## Why Use This Version?

✅ **No dependency conflicts** - Avoids the ajv/react-scripts issues
✅ **Lightning fast** - Vite is 10x faster than Create React App
✅ **Modern tooling** - Latest build tools and hot reload
✅ **Same features** - Identical UI and functionality

---

## Step 1: Start Django Backend

Open **PowerShell** or **Command Prompt**:

```bash
cd "d:\Capstone\FordhamSwipeShare\backend"
venv\Scripts\activate
python manage.py runserver
```

**Keep this window open!** You should see:
```
Starting development server at http://127.0.0.1:8000/
```

---

## Step 2: Install Dependencies (First Time Only)

Open a **NEW PowerShell/Command Prompt** window:

```bash
cd "d:\Capstone\FordhamSwipeShare\web-preview-vite"
npm install
```

This takes about **30 seconds** (much faster than the old version!).

---

## Step 3: Start Vite Dev Server

In the same window:

```bash
npm run dev
```

You'll see:
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

**Open http://localhost:3000** in your browser! 🎉

---

## 🎨 What You'll See

### Login Screen
- Clean Fordham maroon header
- Email and password fields
- "Create Account" button

### Try It Out!

**Option A: Register New Account**
1. Click "Create Account"
2. Fill in:
   - Email: `test@fordham.edu`
   - Username: `testuser`
   - Full Name: `Test User`
   - Campus: `Rose Hill` or `Lincoln Center`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Create Account"
4. You'll see: "Registration successful..."
5. Click "Already have an account? Login"
6. Login with your credentials

**Option B: Use Existing Account**
- If you already created an account:
  - Email: `admin@fordham.edu`
  - Password: `admin123`

### Home Dashboard
After login:
- Welcome message with your name
- SwipeShare activity stats (donated, received, completed)
- Reliability score
- Active listings count
- Pending matches count
- Forum activity (posts, comments, likes)

---

## 🎯 Advantages Over Old Version

| Feature | Old (react-scripts) | New (Vite) |
|---------|---------------------|------------|
| Install time | 2-3 minutes | 30 seconds |
| Dev server start | 10-15 seconds | 1-2 seconds |
| Hot reload | Slow | Instant |
| Dependency conflicts | Yes (ajv error) | No |
| Build size | Large | Optimized |

---

## 🐛 Troubleshooting

### Port 3000 already in use

Vite will automatically suggest another port. Just press 'y' when asked.

### Can't connect to backend

1. Make sure Django is running (Step 1)
2. Check Django console for errors
3. Verify it's on http://127.0.0.1:8000

### CORS errors

✅ Already configured! localhost:3000 is in Django's CORS_ALLOWED_ORIGINS

---

## ⚡ Hot Reload

When you edit code in `src/App.tsx` or `src/App.css`, the browser updates **instantly** without refreshing!

---

## 📱 Mobile View

The interface is styled to look like an iPhone (414px wide):
- On Desktop: Centered like a phone
- On Mobile: Full screen

---

## ⏱️ Total Time

- **First time**: ~1 minute (vs 4 minutes with old version)
- **Subsequent runs**: ~30 seconds

---

## 🎉 Success!

You now have a **lightning-fast** web interface that:
- Connects to your Django backend
- Shows real data from PostgreSQL
- Looks like a mobile app
- Works in any browser
- No emulators needed!
- No dependency conflicts!

---

## 📝 Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run linter (if needed)
```

---

**Enjoy your blazing-fast Fordham SwipeShare web preview!** 🎓🍽️⚡
