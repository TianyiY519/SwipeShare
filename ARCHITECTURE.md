# Fordham SwipeShare - Hybrid Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native Mobile App                  │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │   Screens  │  │ Navigation │  │   State Management   │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
│         │                │                    │             │
│  ┌──────▼────────────────▼────────────────────▼──────────┐  │
│  │              Service Layer                            │  │
│  │  ┌─────────────┐              ┌──────────────────┐   │  │
│  │  │ API Service │              │ Firebase Service │   │  │
│  │  │  (Axios)    │              │  (Messaging)     │   │  │
│  │  └─────────────┘              └──────────────────┘   │  │
│  └────────┬──────────────────────────────┬──────────────┘  │
└───────────┼──────────────────────────────┼─────────────────┘
            │                              │
            │ REST API                     │ Real-time
            │ (JWT Auth)                   │ WebSocket/Firestore
            ▼                              ▼
┌───────────────────────┐    ┌────────────────────────────┐
│   Django Backend      │    │   Firebase Services        │
│  ┌─────────────────┐  │    │  ┌──────────────────────┐  │
│  │ Django REST API │  │    │  │  Firestore Database  │  │
│  │   (DRF)         │  │    │  │  (Messages only)     │  │
│  └─────────────────┘  │    │  └──────────────────────┘  │
│  ┌─────────────────┐  │    │  ┌──────────────────────┐  │
│  │  PostgreSQL DB  │  │    │  │  Cloud Messaging     │  │
│  │  (Main Data)    │  │    │  │  (Push Notifications)│  │
│  └─────────────────┘  │    │  └──────────────────────┘  │
│  ┌─────────────────┐  │    └────────────────────────────┘
│  │  Django Admin   │  │
│  │  (Moderation)   │  │
│  └─────────────────┘  │
└───────────────────────┘
```

## Architecture Decision

### Django Backend Handles:
✅ **User Authentication** - JWT tokens, email verification
✅ **Main Database** - PostgreSQL with all app data
✅ **Business Logic** - Swipe matching, post creation, moderation
✅ **REST API** - All CRUD operations
✅ **Admin Panel** - Content moderation, user management
✅ **File Storage** - Profile pictures, post images (Django Media or S3)

### Firebase Handles:
✅ **Real-time Messaging** - Chat conversations (Firestore real-time listeners)
✅ **Push Notifications** - Firebase Cloud Messaging (FCM)

**Why This Split?**
- Django: Better for structured data, complex queries, admin tools
- Firebase: Excellent for real-time features without complex WebSocket setup

---

## Project Structure

```
FordhamSwipeShare/
│
├── mobile/                           # React Native App
│   ├── android/                      # Android native files
│   ├── ios/                          # iOS native files
│   ├── src/
│   │   ├── config/
│   │   │   ├── api.ts               # API base URL config
│   │   │   └── firebase.ts          # Firebase config (messaging only)
│   │   ├── services/
│   │   │   ├── apiService.ts        # Axios REST API client
│   │   │   ├── authService.ts       # JWT auth with Django
│   │   │   ├── swipeService.ts      # Swipe API calls
│   │   │   ├── forumService.ts      # Forum API calls
│   │   │   ├── messageService.ts    # Firebase real-time messaging
│   │   │   └── notificationService.ts # FCM push notifications
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx      # JWT auth state
│   │   ├── screens/                 # All app screens
│   │   ├── navigation/              # Navigation setup
│   │   └── components/              # Reusable components
│   ├── package.json
│   └── tsconfig.json
│
└── backend/                          # Django Backend
    ├── manage.py
    ├── config/                       # Django project settings
    │   ├── settings.py
    │   ├── urls.py
    │   └── wsgi.py
    ├── apps/
    │   ├── users/                    # User management
    │   │   ├── models.py            # Custom User model
    │   │   ├── serializers.py       # DRF serializers
    │   │   ├── views.py             # API views
    │   │   ├── urls.py              # URL routing
    │   │   └── admin.py             # Admin config
    │   ├── swipes/                   # Swipe listings
    │   │   ├── models.py            # SwipeListing, SwipeMatch
    │   │   ├── serializers.py
    │   │   ├── views.py             # CRUD + matching logic
    │   │   ├── urls.py
    │   │   └── admin.py
    │   ├── forum/                    # Forum posts
    │   │   ├── models.py            # Post, Comment
    │   │   ├── serializers.py
    │   │   ├── views.py
    │   │   ├── urls.py
    │   │   └── admin.py
    │   └── moderation/               # Reports & moderation
    │       ├── models.py            # Report model
    │       ├── serializers.py
    │       ├── views.py
    │       ├── urls.py
    │       └── admin.py
    ├── requirements.txt
    └── .env                          # Environment variables
```

---

## Data Models

### Django (PostgreSQL)

#### User Model
```python
class User(AbstractUser):
    email = EmailField(unique=True)
    full_name = CharField(max_length=100)
    fordham_id = CharField(max_length=20, blank=True)
    campus = CharField(choices=[('RH', 'Rose Hill'), ('LC', 'Lincoln Center')])
    profile_picture = ImageField(upload_to='profiles/', blank=True)
    bio = TextField(blank=True)
    phone_number = CharField(max_length=15, blank=True)
    swipes_donated = IntegerField(default=0)
    swipes_received = IntegerField(default=0)
    reliability_score = DecimalField(default=5.0)
    is_email_verified = BooleanField(default=False)
    fcm_token = CharField(max_length=255, blank=True)  # For push notifications
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

#### SwipeListing Model
```python
class SwipeListing(Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    TYPE_CHOICES = [
        ('donation', 'Donation'),
        ('request', 'Request'),
    ]

    user = ForeignKey(User, on_delete=CASCADE, related_name='listings')
    type = CharField(choices=TYPE_CHOICES)
    campus = CharField(choices=[('RH', 'Rose Hill'), ('LC', 'Lincoln Center')])
    dining_hall = CharField(max_length=100, blank=True)
    quantity = IntegerField(default=1)
    available_date = DateField()
    available_time = TimeField(blank=True, null=True)
    meeting_location = CharField(max_length=200, blank=True)
    notes = TextField(blank=True)
    status = CharField(choices=STATUS_CHOICES, default='open')
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

#### SwipeMatch Model
```python
class SwipeMatch(Model):
    donation_listing = ForeignKey(SwipeListing, on_delete=CASCADE, related_name='donation_matches')
    request_listing = ForeignKey(SwipeListing, on_delete=CASCADE, related_name='request_matches')
    donor = ForeignKey(User, on_delete=CASCADE, related_name='donations')
    requester = ForeignKey(User, on_delete=CASCADE, related_name='requests')
    firebase_conversation_id = CharField(max_length=100)  # Links to Firebase chat
    status = CharField(choices=[('pending', 'Pending'), ('completed', 'Completed'), ('cancelled', 'Cancelled')])
    completed_at = DateTimeField(null=True, blank=True)
    donor_confirmed = BooleanField(default=False)
    requester_confirmed = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
```

#### Post Model
```python
class Post(Model):
    CATEGORY_CHOICES = [
        ('housing', 'Housing & Sublets'),
        ('marketplace', 'Marketplace'),
        ('rideshare', 'Ride Sharing'),
        ('events', 'Events'),
        ('general', 'General Discussion'),
    ]

    user = ForeignKey(User, on_delete=CASCADE, related_name='posts')
    category = CharField(choices=CATEGORY_CHOICES)
    title = CharField(max_length=200)
    content = TextField()
    images = JSONField(default=list, blank=True)  # List of image URLs
    likes_count = IntegerField(default=0)
    comments_count = IntegerField(default=0)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

#### Comment Model
```python
class Comment(Model):
    post = ForeignKey(Post, on_delete=CASCADE, related_name='comments')
    user = ForeignKey(User, on_delete=CASCADE, related_name='comments')
    content = TextField()
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

#### Report Model
```python
class Report(Model):
    CONTENT_TYPES = [
        ('post', 'Post'),
        ('comment', 'Comment'),
        ('user', 'User'),
    ]
    REASON_CHOICES = [
        ('spam', 'Spam'),
        ('inappropriate', 'Inappropriate Content'),
        ('harassment', 'Harassment'),
        ('misinformation', 'Misinformation'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('resolved', 'Resolved'),
    ]

    reporter = ForeignKey(User, on_delete=CASCADE, related_name='reports_made')
    content_type = CharField(choices=CONTENT_TYPES)
    content_id = IntegerField()  # ID of the reported item
    reason = CharField(choices=REASON_CHOICES)
    description = TextField(blank=True)
    status = CharField(choices=STATUS_CHOICES, default='pending')
    admin_notes = TextField(blank=True)
    reviewed_at = DateTimeField(null=True, blank=True)
    created_at = DateTimeField(auto_now_add=True)
```

### Firebase (Firestore)

#### Conversations Collection
```typescript
interface Conversation {
  id: string;
  participants: string[];  // [userId1, userId2]
  matchId: number;  // Links to Django SwipeMatch.id
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Messages Collection
```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  read: boolean;
}
```

---

## API Endpoints

### Authentication
```
POST   /api/auth/register/          # Register new user
POST   /api/auth/login/             # Login (returns JWT)
POST   /api/auth/verify-email/      # Verify email with token
POST   /api/auth/resend-verification/ # Resend verification email
POST   /api/auth/refresh/           # Refresh JWT token
GET    /api/auth/me/                # Get current user
PUT    /api/auth/me/                # Update profile
```

### Swipes
```
GET    /api/swipes/                 # List swipes (filter by type, campus, status)
POST   /api/swipes/                 # Create swipe listing
GET    /api/swipes/{id}/            # Get swipe detail
PUT    /api/swipes/{id}/            # Update swipe
DELETE /api/swipes/{id}/            # Delete swipe
POST   /api/swipes/{id}/match/      # Create match
GET    /api/swipes/my-listings/     # User's listings
GET    /api/swipes/my-matches/      # User's matches
POST   /api/swipes/{id}/confirm/    # Confirm completion
```

### Forum
```
GET    /api/posts/                  # List posts (filter by category)
POST   /api/posts/                  # Create post
GET    /api/posts/{id}/             # Get post detail
PUT    /api/posts/{id}/             # Update post
DELETE /api/posts/{id}/             # Delete post
POST   /api/posts/{id}/like/        # Like/unlike post
GET    /api/posts/{id}/comments/    # Get comments
POST   /api/posts/{id}/comments/    # Add comment
```

### Moderation
```
POST   /api/reports/                # Submit report
GET    /api/reports/                # List reports (admin only)
PUT    /api/reports/{id}/           # Update report status (admin only)
```

### Notifications
```
POST   /api/notifications/register-fcm/  # Register FCM token
GET    /api/notifications/         # Get user notifications
PUT    /api/notifications/{id}/read/  # Mark as read
```

---

## Authentication Flow

### Registration
```
1. User enters @fordham.edu email + password
2. React Native → POST /api/auth/register/
3. Django creates user (is_email_verified=False)
4. Django sends verification email
5. User clicks link → verify token
6. React Native → POST /api/auth/verify-email/
7. Django sets is_email_verified=True
8. Returns JWT tokens
```

### Login
```
1. User enters credentials
2. React Native → POST /api/auth/login/
3. Django validates & returns JWT tokens
4. Store tokens in AsyncStorage
5. Include token in all API requests:
   Header: Authorization: Bearer <access_token>
```

### Token Refresh
```
1. Access token expires (15 min)
2. React Native → POST /api/auth/refresh/ with refresh token
3. Django returns new access token
4. Update AsyncStorage
```

---

## Real-time Messaging Flow

### Match Creation
```
1. User A matches with User B
2. React Native → POST /api/swipes/{id}/match/
3. Django creates SwipeMatch record
4. Django creates Firebase conversation:
   - React Native calls messageService.createConversation()
   - Creates document in Firestore
   - Stores conversation ID in SwipeMatch.firebase_conversation_id
5. Both users receive push notification
6. Both navigate to chat screen
```

### Sending Messages
```
1. User types message
2. React Native → messageService.sendMessage()
3. Writes to Firebase Firestore messages collection
4. Real-time listener updates UI immediately
5. Firebase Cloud Function sends FCM push notification to recipient
```

---

## Development Workflow

### 1. Backend Development (Django)
```bash
# Set up Django project
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create database
python manage.py makemigrations
python manage.py migrate

# Create superuser for admin
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### 2. Frontend Development (React Native)
```bash
# Set up React Native
cd mobile
npm install

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### 3. Testing Flow
```
1. Test Django API with Postman/curl
2. Test React Native API integration
3. Test Firebase messaging separately
4. Test end-to-end flow
```

---

## Deployment Strategy

### Django Backend
- **Development**: Local SQLite
- **Production**:
  - Heroku / Railway / DigitalOcean
  - PostgreSQL database
  - AWS S3 for media files
  - Gunicorn + Nginx

### React Native App
- **Development**: Metro bundler + emulators
- **Production**:
  - Google Play Store (Android)
  - Apple App Store (iOS)
  - Over-the-air updates with CodePush

### Firebase
- **Development**: Firebase free tier
- **Production**: Spark/Blaze plan for scale

---

## Security Considerations

### Django
- JWT tokens (short-lived access, long-lived refresh)
- Email domain validation (@fordham.edu only)
- CORS configuration for mobile app
- Rate limiting on API endpoints
- Django permissions for admin-only views

### Firebase
- Security rules: Only conversation participants can read/write messages
- FCM tokens stored securely
- No sensitive data in Firestore

---

## Next Steps

1. ✅ Create Django backend structure
2. ✅ Create React Native project with native files
3. ✅ Migrate existing React Native code
4. ✅ Set up API service layer
5. ✅ Implement authentication flow
6. ✅ Build swipe listing features
7. ✅ Implement real-time messaging
8. ✅ Add push notifications
9. ✅ Build admin panel
10. ✅ Testing & deployment
