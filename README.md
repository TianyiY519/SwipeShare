# Fordham SwipeShare

A mobile campus platform for Fordham University students to donate/request meal swipes and engage in campus community discussions.

## 🏗️ Architecture

**Hybrid Backend:**
- **Django + PostgreSQL**: Main API, authentication, database, admin panel
- **Firebase**: Real-time messaging and push notifications only

**Frontend:**
- **React Native + TypeScript**: Cross-platform mobile app (iOS & Android)

## 📁 Project Structure

```
FordhamSwipeShare/
├── backend/          # Django REST API
│   ├── apps/
│   │   ├── users/           # User management & auth
│   │   ├── swipes/          # Meal swipe listings
│   │   ├── forum/           # Campus forum
│   │   └── moderation/      # Content moderation
│   ├── config/              # Django settings
│   └── manage.py
│
└── mobile/           # React Native app
    ├── android/
    ├── ios/
    └── src/
        ├── screens/         # App screens
        ├── services/        # API & Firebase services
        ├── navigation/      # App navigation
        └── components/      # Reusable components
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **React Native CLI** - `npm install -g react-native-cli`

### Backend Setup (Django)

```bash
cd backend

# Windows:
setup.bat

# Mac/Linux:
chmod +x setup.sh && ./setup.sh

# See backend/DJANGO_SETUP.md for detailed instructions
```

### Frontend Setup (React Native)

```bash
cd mobile

# Install dependencies
npm install

# iOS only: Install CocoaPods
cd ios && pod install && cd ..

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 📚 Documentation

- **[Architecture Overview](./ARCHITECTURE.md)** - System design and data flow
- **[Django Setup Guide](./backend/DJANGO_SETUP.md)** - Backend setup instructions
- **[Firebase Setup Guide](./FIREBASE_SETUP_GUIDE.md)** - Firebase configuration (messaging only)

## ✨ Features

### Meal Swipe Exchange
- 🍽️ Donate or request unused meal swipes
- 📍 Filter by campus (Rose Hill / Lincoln Center)
- 🤝 Smart matching between donors and requesters
- ✅ Confirmation system with reliability scoring

### Campus Forum
- 💬 Discussion boards for housing, marketplace, rides, events
- 📷 Image uploads for posts
- 💭 Commenting system
- 👍 Like/engagement features

### Real-time Messaging
- 💬 In-app chat when matched for swipes
- 🔔 Push notifications for new messages
- ⚡ Real-time updates with Firebase

### Moderation & Safety
- 🚨 Report inappropriate content
- 👮 Admin dashboard for content moderation
- ✉️ Fordham email verification required
- 🔒 Secure authentication with JWT

## 🛠️ Technology Stack

### Backend
- **Django 5.0** - Web framework
- **Django REST Framework** - API
- **PostgreSQL** - Primary database
- **JWT** - Authentication
- **Firebase Admin SDK** - Push notifications

### Frontend
- **React Native 0.73** - Mobile framework
- **TypeScript** - Type safety
- **React Navigation 6** - Navigation
- **Axios** - HTTP client
- **Firebase SDK** - Real-time messaging

## 🔐 Security

- **Email Verification**: Only `@fordham.edu` emails allowed
- **JWT Authentication**: Secure token-based auth
- **CORS Configuration**: Restricted to mobile app
- **Firebase Rules**: Conversation participants only
- **Content Moderation**: Report and review system

## 📱 API Endpoints

### Authentication
```
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/verify-email/
GET    /api/auth/me/
```

### Swipes
```
GET    /api/swipes/
POST   /api/swipes/
GET    /api/swipes/{id}/
POST   /api/swipes/{id}/match/
POST   /api/swipes/{id}/confirm/
```

### Forum
```
GET    /api/posts/
POST   /api/posts/
GET    /api/posts/{id}/
POST   /api/posts/{id}/comments/
POST   /api/posts/{id}/like/
```

### Moderation
```
POST   /api/reports/
GET    /api/reports/        # Admin only
PUT    /api/reports/{id}/   # Admin only
```

## 🧪 Development Workflow

1. **Start Django backend:**
   ```bash
   cd backend
   venv\Scripts\activate  # Windows
   python manage.py runserver
   ```

2. **Start React Native:**
   ```bash
   cd mobile
   npm start
   npm run android  # or npm run ios
   ```

3. **Access Django Admin:**
   - URL: http://127.0.0.1:8000/admin/
   - Login with superuser credentials

## 📦 Deployment

### Backend (Django)
- **Recommended**: Railway, Render, or Heroku
- **Database**: PostgreSQL (managed)
- **Static Files**: AWS S3 or Cloudinary
- **Server**: Gunicorn + Nginx

### Mobile App
- **Android**: Google Play Store
- **iOS**: Apple App Store
- **OTA Updates**: CodePush (optional)

## 📄 License

MIT License - Academic Capstone Project

## 👥 Team

Fordham University Computer Science Capstone Project

---

## 🔗 Quick Links

- [Django Documentation](https://docs.djangoproject.com/)
- [React Native Docs](https://reactnative.dev/)
- [DRF Documentation](https://www.django-rest-framework.org/)
- [Firebase Documentation](https://firebase.google.com/docs)

## 📞 Support

For setup issues:
1. Check the detailed setup guides in `/backend/DJANGO_SETUP.md`
2. Review the architecture doc: `/ARCHITECTURE.md`
3. Ensure all prerequisites are installed

---

**Note**: This is an educational project for demonstration purposes only. Not affiliated with or endorsed by Fordham University.
