# Firebase Setup Guide for Fordham SwipeShare

This guide will walk you through setting up Firebase for your Fordham SwipeShare application.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: **`fordham-swipeshare`** (or your preferred name)
4. Click **Continue**
5. Disable Google Analytics (optional for this project) or configure it
6. Click **Create project**
7. Wait for project creation to complete, then click **Continue**

## Step 2: Register Your Apps

### For Android:

1. In Firebase Console, click the **Android icon** to add an Android app
2. Enter Android package name: **`com.fordhamcampusplatform`**
   - You can find this in `android/app/build.gradle` under `applicationId`
3. (Optional) Add app nickname: **"Fordham SwipeShare Android"**
4. (Optional) Skip SHA-1 for now (needed later for Google Sign-In if you add it)
5. Click **Register app**
6. **Download `google-services.json`**
7. Place the file in: `d:\Capstone\FordhamCampusPlatform\android\app\google-services.json`
8. Click **Next** through the SDK setup steps (already configured in your project)
9. Click **Continue to console**

### For iOS:

1. In Firebase Console, click the **iOS icon** to add an iOS app
2. Enter iOS bundle ID: **`org.reactjs.native.example.FordhamCampusPlatform`**
   - You can find this in `ios/FordhamCampusPlatform.xcodeproj/project.pbxproj`
3. (Optional) Add app nickname: **"Fordham SwipeShare iOS"**
4. Click **Register app**
5. **Download `GoogleService-Info.plist`**
6. Place the file in: `d:\Capstone\FordhamCampusPlatform\ios\FordhamCampusPlatform\GoogleService-Info.plist`
7. Click **Next** through the SDK setup steps (already configured)
8. Click **Continue to console**

## Step 3: Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click **Get started**
3. Click on **Email/Password** under "Sign-in providers"
4. Toggle **Enable** to ON
5. Leave "Email link (passwordless sign-in)" disabled
6. Click **Save**

### Configure Email Verification Settings:

1. Still in **Authentication**, go to **Settings** tab
2. Scroll to **Authorized domains**
3. Verify `localhost` is listed (for testing)
4. Under **Email templates**, customize the email verification template if desired

## Step 4: Create Firestore Database

1. In Firebase Console, go to **Build > Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll add security rules later)
4. Click **Next**
5. Select your preferred Cloud Firestore location (e.g., `us-central` for USA)
6. Click **Enable**
7. Wait for database creation to complete

### Collections (will be created automatically by app):
- `users` - User profiles
- `swipes` - Meal swipe listings
- `posts` - Forum posts
- `messages` - Chat messages
- `conversations` - Message threads
- `notifications` - User notifications
- `reports` - Content reports for moderation

## Step 5: Set Up Firebase Storage

1. In Firebase Console, go to **Build > Storage**
2. Click **Get started**
3. Choose **Start in test mode** (we'll add security rules later)
4. Click **Next**
5. Confirm the storage location (same as Firestore)
6. Click **Done**

### Storage Structure (will be created by app):
```
profile_pictures/
  ├── {userId}.jpg
post_images/
  ├── {postId}/
      ├── image1.jpg
      ├── image2.jpg
message_attachments/
  ├── {conversationId}/
      ├── {messageId}.jpg
```

## Step 6: Enable Cloud Messaging (for Push Notifications)

1. In Firebase Console, go to **Build > Cloud Messaging**
2. If prompted, click **Get started**
3. The setup is mostly automatic for React Native

### For Android:
- FCM is automatically configured via `google-services.json`

### For iOS:
- You'll need to upload your APNs certificate later (requires Apple Developer account)

## Step 7: Get Your Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. You'll see your registered apps (Android and iOS)
4. Click on the **Web app** icon `</>` to add a web app (for configuration values)
5. Register the web app with nickname: **"Fordham SwipeShare Config"**
6. Copy the `firebaseConfig` object values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

7. Update `src/config/firebase.ts` with these values

## Step 8: Update Configuration File

Replace the placeholder values in `src/config/firebase.ts`:

```typescript
export const FIREBASE_CONFIG = {
  apiKey: 'YOUR_ACTUAL_API_KEY',
  authDomain: 'your-project-id.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project-id.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

## Step 9: Install Firebase Native Modules

Run these commands in your project directory:

```bash
# Install Firebase packages (if not already installed)
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage @react-native-firebase/messaging

# For iOS, install CocoaPods dependencies
cd ios
pod install
cd ..
```

## Step 10: Security Rules (Important!)

### Firestore Security Rules

1. Go to **Firestore Database > Rules**
2. Replace the default rules with production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isFordhamEmail() {
      return request.auth.token.email.matches('.*@fordham.edu$');
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isEmailVerified() {
      return request.auth.token.email_verified == true;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn() && isFordhamEmail();
      allow create: if isSignedIn() && isFordhamEmail() && isOwner(userId);
      allow update: if isSignedIn() && isOwner(userId);
      allow delete: if isSignedIn() && isOwner(userId);
    }

    // Swipes collection
    match /swipes/{swipeId} {
      allow read: if isSignedIn() && isFordhamEmail() && isEmailVerified();
      allow create: if isSignedIn() && isFordhamEmail() && isEmailVerified();
      allow update: if isSignedIn() && (
        isOwner(resource.data.userId) ||
        isOwner(resource.data.requesterId)
      );
      allow delete: if isSignedIn() && isOwner(resource.data.userId);
    }

    // Posts collection
    match /posts/{postId} {
      allow read: if isSignedIn() && isFordhamEmail() && isEmailVerified();
      allow create: if isSignedIn() && isFordhamEmail() && isEmailVerified();
      allow update: if isSignedIn() && isOwner(resource.data.userId);
      allow delete: if isSignedIn() && isOwner(resource.data.userId);

      // Comments subcollection
      match /comments/{commentId} {
        allow read: if isSignedIn() && isFordhamEmail() && isEmailVerified();
        allow create: if isSignedIn() && isFordhamEmail() && isEmailVerified();
        allow update: if isSignedIn() && isOwner(resource.data.userId);
        allow delete: if isSignedIn() && isOwner(resource.data.userId);
      }
    }

    // Conversations collection
    match /conversations/{conversationId} {
      allow read: if isSignedIn() && isOwner(resource.data.participants[0]) || isOwner(resource.data.participants[1]);
      allow create: if isSignedIn() && isFordhamEmail() && isEmailVerified();
      allow update: if isSignedIn() && (isOwner(resource.data.participants[0]) || isOwner(resource.data.participants[1]));
    }

    // Messages collection
    match /messages/{messageId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && isFordhamEmail() && isEmailVerified();
    }

    // Reports collection (admin access needed for read)
    match /reports/{reportId} {
      allow read: if false; // Only admins via backend
      allow create: if isSignedIn() && isFordhamEmail() && isEmailVerified();
    }

    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      allow create: if isSignedIn();
      allow update: if isSignedIn() && isOwner(resource.data.userId);
      allow delete: if isSignedIn() && isOwner(resource.data.userId);
    }
  }
}
```

3. Click **Publish**

### Storage Security Rules

1. Go to **Storage > Rules**
2. Replace the default rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() {
      return request.auth != null;
    }

    function isFordhamEmail() {
      return request.auth.token.email.matches('.*@fordham.edu$');
    }

    function isValidImage() {
      return request.resource.contentType.matches('image/.*') &&
             request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }

    // Profile pictures
    match /profile_pictures/{userId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() &&
                      isFordhamEmail() &&
                      request.auth.uid == userId &&
                      isValidImage();
    }

    // Post images
    match /post_images/{postId}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() &&
                      isFordhamEmail() &&
                      isValidImage();
    }

    // Message attachments
    match /message_attachments/{conversationId}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() &&
                      isFordhamEmail() &&
                      isValidImage();
    }
  }
}
```

3. Click **Publish**

## Step 11: Test the Setup

1. Clean and rebuild your project:

```bash
# Clean the project
cd android && ./gradlew clean && cd ..

# For iOS
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Rebuild
npm run android
# or
npm run ios
```

2. Try signing up with a test Fordham email
3. Check Firebase Console > Authentication to see the user
4. Check Firestore to see the user document created

## Step 12: Environment Variables (Optional but Recommended)

For better security, you can move sensitive config to environment variables:

1. Install react-native-config:
```bash
npm install react-native-config
```

2. Create `.env` file in project root (add to `.gitignore`):
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

## Troubleshooting

### Android Issues:
- Verify `google-services.json` is in `android/app/`
- Check `android/build.gradle` has Google services plugin
- Run `cd android && ./gradlew clean && cd ..`

### iOS Issues:
- Verify `GoogleService-Info.plist` is in `ios/FordhamCampusPlatform/`
- Run `cd ios && pod install && cd ..`
- Clean build folder in Xcode

### Authentication Issues:
- Ensure Email/Password is enabled in Firebase Console
- Check email domain validation in code
- Verify email verification is sent

### Firestore Issues:
- Check security rules are published
- Verify collections are created
- Check browser console for errors

## Next Steps

Once Firebase is configured:
1. Test authentication flow (signup, login, email verification)
2. Implement Firestore CRUD operations for swipes
3. Set up real-time listeners for messaging
4. Configure push notifications

## Resources

- [Firebase Console](https://console.firebase.google.com)
- [React Native Firebase Docs](https://rnfirebase.io)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
