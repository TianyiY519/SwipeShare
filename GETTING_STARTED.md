# Getting Started with Fordham SwipeShare

Welcome! This guide will help you set up the complete Fordham SwipeShare project with Django + Firebase hybrid architecture.

## 🎯 What You're Building

A mobile campus platform where Fordham students can:
- 🍽️ Donate or request unused meal swipes
- 💬 Participate in campus forums (housing, marketplace, events)
- 📱 Chat in real-time when matched
- 🔔 Receive push notifications

## 🏗️ Architecture Overview

```
React Native App (Mobile)
    ↓ REST API (JWT Auth)
Django Backend (PostgreSQL)
    - Authentication
    - Swipe listings
    - Forum posts
    - User profiles

    ↓ Real-time only
Firebase (Firestore + FCM)
    - Chat messages
    - Push notifications
```

**Why this hybrid approach?**
- Django: Full control over business logic, great admin panel, better for your portfolio
- Firebase: Excellent real-time features without complex WebSocket setup

---

## 📋 Prerequisites Checklist

Before starting, install:

- [ ] **Python 3.10+** - [Download](https://www.python.org/downloads/)
- [ ] **Node.js 18+** - [Download](https://nodejs.org/)
- [ ] **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- [ ] **Android Studio** (for Android) - [Download](https://developer.android.com/studio)
- [ ] **Xcode** (for iOS, Mac only) - [App Store](https://apps.apple.com/us/app/xcode/id497799835)
- [ ] **Git** (recommended) - [Download](https://git-scm.com/)

Verify installations:
```bash
python --version    # Should be 3.10+
node --version      # Should be 18+
npm --version       # Should be 9+
psql --version      # Should be 15+
```

---

## 🚀 Quick Start (30 Minutes)

Follow these steps in order:

### Step 1: Set Up Django Backend (15 min)

```bash
cd d:\Capstone\FordhamSwipeShare\backend

# Windows:
setup.bat

# Mac/Linux:
chmod +x setup.sh && ./setup.sh
```

This will:
- ✅ Create virtual environment
- ✅ Install Django and dependencies
- ✅ Create Django project structure
- ✅ Generate .env configuration file

**Next:**
1. Install PostgreSQL if you haven't
2. Create database:
   ```sql
   -- Open PostgreSQL shell
   psql -U postgres

   CREATE DATABASE fordham_swipeshare;
   \q
   ```

3. Update `.env` file with your database credentials
4. Run migrations:
   ```bash
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Mac/Linux

   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

5. Test: Visit http://127.0.0.1:8000/admin/

**Detailed guide**: See [backend/DJANGO_SETUP.md](backend/DJANGO_SETUP.md)

---

### Step 2: Set Up React Native App (15 min)

```bash
cd d:\Capstone\FordhamSwipeShare

# Create React Native project with TypeScript
npx react-native init mobile --template react-native-template-typescript

cd mobile

# Install dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
npm install react-native-paper react-native-vector-icons
npm install axios @react-native-async-storage/async-storage
npm install formik yup date-fns
npm install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/messaging

# For iOS (Mac only):
cd ios && pod install && cd ..

# Run the app
npm run android  # or npm run ios
```

**Detailed guide**: See [mobile/SETUP.md](mobile/SETUP.md)

---

### Step 3: Copy Existing Code

You have existing React Native code in `FordhamCampusPlatform`. Let's migrate it:

```bash
# Copy source files
cp -r d:\Capstone\FordhamCampusPlatform\src\* d:\Capstone\FordhamSwipeShare\mobile\src\

# This copies:
# - All screens (Auth, Home, Swipes, Forum, Messages, Profile)
# - Navigation setup
# - Type definitions
# - Contexts
```

**Note**: The services will need to be updated to call Django API instead of Firebase directly.

---

## 📝 Development Roadmap

### Phase 1: Foundation (Week 1) ✅ DONE
- [x] Django backend structure
- [x] React Native project setup
- [x] Architecture documentation
- [ ] Django models implementation
- [ ] Basic API endpoints

### Phase 2: Authentication (Week 2)
- [ ] Django JWT authentication
- [ ] Email verification flow
- [ ] React Native auth screens
- [ ] API service layer
- [ ] AsyncStorage for tokens

### Phase 3: Core Features (Week 3)
- [ ] Swipe listing CRUD
- [ ] Matching algorithm
- [ ] Forum posts & comments
- [ ] Image uploads
- [ ] User profiles

### Phase 4: Real-time & Polish (Week 4)
- [ ] Firebase messaging integration
- [ ] Push notifications (FCM)
- [ ] Admin moderation panel
- [ ] Testing
- [ ] Documentation

---

## 🗂️ Project Structure

```
FordhamSwipeShare/
│
├── README.md                   # Main project README
├── ARCHITECTURE.md             # System architecture
├── GETTING_STARTED.md          # This file
│
├── backend/                    # Django Backend
│   ├── DJANGO_SETUP.md        # Detailed setup guide
│   ├── requirements.txt       # Python dependencies
│   ├── setup.bat / setup.sh   # Automated setup scripts
│   ├── manage.py              # Django management
│   ├── .env                   # Configuration (create this)
│   │
│   ├── config/                # Django project settings
│   │   ├── settings.py       # Main settings
│   │   ├── urls.py           # URL routing
│   │   └── wsgi.py           # WSGI config
│   │
│   └── apps/                  # Django applications
│       ├── users/            # User model & auth
│       ├── swipes/           # Swipe listings
│       ├── forum/            # Forum posts
│       └── moderation/       # Reports & admin
│
└── mobile/                    # React Native App
    ├── SETUP.md              # Detailed setup guide
    ├── package.json          # npm dependencies
    ├── tsconfig.json         # TypeScript config
    │
    ├── android/              # Android native code
    ├── ios/                  # iOS native code
    │
    └── src/                  # Source code
        ├── config/
        │   ├── api.ts        # Django API config
        │   └── firebase.ts   # Firebase config (messaging only)
        │
        ├── services/
        │   ├── apiService.ts        # Axios HTTP client
        │   ├── authService.ts       # JWT authentication
        │   ├── swipeService.ts      # Swipe API calls
        │   ├── forumService.ts      # Forum API calls
        │   └── messageService.ts    # Firebase messaging
        │
        ├── screens/          # App screens
        ├── navigation/       # Navigation setup
        ├── contexts/         # React Context (Auth)
        ├── types/            # TypeScript types
        └── components/       # Reusable components
```

---

## 🔧 Development Workflow

### Daily Development:

1. **Start Django backend:**
   ```bash
   cd backend
   venv\Scripts\activate  # Windows
   python manage.py runserver
   ```
   Backend runs on: http://127.0.0.1:8000

2. **Start React Native:**
   ```bash
   cd mobile
   npm start  # Metro bundler

   # In another terminal:
   npm run android  # or npm run ios
   ```

3. **Test API:**
   - Use Postman, curl, or Django REST Framework browsable API
   - Visit: http://127.0.0.1:8000/api/

4. **Access Admin Panel:**
   - Visit: http://127.0.0.1:8000/admin/
   - Login with superuser credentials
   - Manage users, posts, reports, etc.

---

## 🎓 Learning Resources

### Django
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework Tutorial](https://www.django-rest-framework.org/tutorial/quickstart/)
- [Django Girls Tutorial](https://tutorial.djangogirls.org/)

### React Native
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript with React Native](https://reactnative.dev/docs/typescript)

### Firebase
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [React Native Firebase](https://rnfirebase.io/)

---

## 🐛 Troubleshooting

### Django won't start:
```bash
# Check virtual environment is activated
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Check database connection
python manage.py check

# See detailed errors
python manage.py runserver --traceback
```

### React Native build errors:
```bash
# Clear cache
npm start -- --reset-cache

# Clean build (Android)
cd android && ./gradlew clean && cd ..

# Clean build (iOS)
cd ios && rm -rf Pods && pod install && cd ..

# Reinstall dependencies
rm -rf node_modules && npm install
```

### Can't connect to Django API:
- **Android Emulator**: Use `http://10.0.2.2:8000/api`
- **iOS Simulator**: Use `http://localhost:8000/api`
- **Physical Device**: Use your computer's local IP `http://192.168.x.x:8000/api`
- Make sure Django is running
- Check CORS settings in Django

---

## 📱 Testing

### Backend Testing:
```bash
cd backend
python manage.py test
```

### Frontend Testing:
```bash
cd mobile
npm test
```

### Manual Testing:
1. Test authentication flow
2. Test swipe creation and matching
3. Test forum posts and comments
4. Test real-time messaging
5. Test push notifications

---

## 🚢 Next Steps

After completing the setup:

1. **Implement Django Models** (see ARCHITECTURE.md for model definitions)
   - User model with Fordham email validation
   - SwipeListing model
   - Post and Comment models
   - Report model

2. **Build API Endpoints**
   - Authentication endpoints
   - Swipe CRUD endpoints
   - Forum endpoints
   - Moderation endpoints

3. **Update React Native Services**
   - Replace Firebase calls with Axios HTTP calls
   - Implement JWT token management
   - Add error handling

4. **Set Up Firebase** (messaging only)
   - Create Firebase project
   - Configure Firestore for messages
   - Set up FCM for push notifications

---

## 📞 Getting Help

If you get stuck:

1. **Check the guides:**
   - [Backend Setup](backend/DJANGO_SETUP.md)
   - [Mobile Setup](mobile/SETUP.md)
   - [Architecture](ARCHITECTURE.md)

2. **Common issues:**
   - Database connection errors → Check PostgreSQL is running
   - Module not found → Activate virtual environment / reinstall packages
   - Build errors → Clean and rebuild

3. **Documentation:**
   - Django: https://docs.djangoproject.com/
   - React Native: https://reactnative.dev/
   - DRF: https://www.django-rest-framework.org/

---

## ✅ Checklist

Use this to track your progress:

### Setup Phase
- [ ] Python, Node.js, PostgreSQL installed
- [ ] Django backend created and running
- [ ] PostgreSQL database created
- [ ] Django admin accessible
- [ ] React Native project created
- [ ] Mobile app runs on emulator/simulator
- [ ] Existing code migrated

### Development Phase
- [ ] Django models created
- [ ] API endpoints implemented
- [ ] JWT authentication working
- [ ] API service layer in React Native
- [ ] Authentication screens functional
- [ ] Swipe listing features working
- [ ] Forum features working
- [ ] Firebase messaging integrated
- [ ] Push notifications working

### Polish Phase
- [ ] Admin panel customized
- [ ] Error handling implemented
- [ ] Testing completed
- [ ] Documentation updated
- [ ] Ready for demo!

---

**🎉 You're all set!** Start with the Django backend setup, then move to React Native. Good luck with your capstone project!
