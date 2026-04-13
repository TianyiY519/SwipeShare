# Fordham SwipeShare - Mobile App

A React Native mobile application for the Fordham SwipeShare platform.

## 📱 Features

- User authentication (register, login, email verification)
- Browse and create swipe listings (donations/requests)
- Match with other users
- Campus forum for posts and discussions
- User profiles with statistics
- Real-time updates
- JWT-based authentication with auto-refresh

## 🛠️ Tech Stack

- **React Native 0.73** - Mobile framework
- **TypeScript** - Type safety
- **React Navigation 6** - Navigation
- **Axios** - API client
- **AsyncStorage** - Local storage
- **React Context** - State management

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Android Studio (for Android development)
- Xcode (for iOS development, Mac only)
- React Native CLI

### Install Dependencies

```bash
npm install
```

### iOS Setup (Mac only)

```bash
cd ios
pod install
cd ..
```

## 🚀 Running the App

### Start Metro Bundler

```bash
npm start
```

### Run on Android

```bash
npm run android
```

### Run on iOS (Mac only)

```bash
npm run ios
```

## ⚙️ Configuration

### API Configuration

Update the base URL in `src/config/api.ts`:

```typescript
// For Android Emulator
BASE_URL: 'http://10.0.2.2:8000'

// For iOS Simulator
BASE_URL: 'http://localhost:8000'

// For Physical Device
BASE_URL: 'http://YOUR_COMPUTER_IP:8000'
```

## 📂 Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Loading.tsx
│   ├── config/           # Configuration files
│   │   └── api.ts
│   ├── contexts/         # React Context providers
│   │   └── AuthContext.tsx
│   ├── navigation/       # Navigation setup
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   ├── SwipesNavigator.tsx
│   │   ├── ForumNavigator.tsx
│   │   └── ProfileNavigator.tsx
│   ├── screens/          # App screens
│   │   ├── auth/         # Authentication screens
│   │   ├── main/         # Main dashboard
│   │   ├── swipes/       # Swipe listings
│   │   ├── forum/        # Forum posts
│   │   └── profile/      # User profile
│   ├── services/         # API services
│   │   ├── apiClient.ts
│   │   ├── authService.ts
│   │   ├── swipeService.ts
│   │   ├── forumService.ts
│   │   └── moderationService.ts
│   └── types/            # TypeScript types
│       └── index.ts
├── App.tsx               # App entry point
├── index.js              # React Native entry
└── package.json
```

## 🎨 UI Components

### Button
```typescript
<Button
  title="Login"
  onPress={handleLogin}
  variant="primary"  // primary | secondary | outline | danger
  size="medium"      // small | medium | large
  loading={isLoading}
/>
```

### Input
```typescript
<Input
  label="Email"
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
  icon="email"
  error={errors.email}
  secureTextEntry  // For passwords
/>
```

### Card
```typescript
<Card style={styles.card}>
  <Text>Card Content</Text>
</Card>
```

## 🔐 Authentication Flow

1. **Register**: User enters @fordham.edu email and creates account
2. **Email Verification**: Token sent to email
3. **Login**: JWT tokens stored in AsyncStorage
4. **Auto-Refresh**: Access token auto-refreshes when expired
5. **Logout**: Tokens cleared from storage

## 🌐 API Integration

All API calls use the service layer:

```typescript
// Example: Get swipe listings
import {swipeService} from '@services/swipeService';

const listings = await swipeService.getListings({
  type: 'donation',
  campus: 'RH',
});
```

## 🎨 Theming

Primary color: `#800000` (Fordham Maroon)

Colors are defined in component stylesheets. To create a theme system, extract colors to a theme file.

## 🐛 Troubleshooting

### Clear Metro Cache
```bash
npm start -- --reset-cache
```

### Clear Build Cache (Android)
```bash
cd android
./gradlew clean
cd ..
```

### Reinstall Dependencies
```bash
rm -rf node_modules
npm install
```

### iOS Pod Issues (Mac)
```bash
cd ios
pod deintegrate
pod install
cd ..
```

## 📝 Next Steps

### Screens to Complete

Most screens are created with basic structure. The following need full implementation:

- **Swipe Detail**: Show listing details, match button
- **Create Swipe**: Form to create new listing
- **Match Detail**: Show match info, confirm button
- **Forum Posts**: List and detail views
- **Profile Editing**: Update user information

### Features to Add

- [ ] Image upload for profile pictures
- [ ] Image upload for forum posts
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Real-time chat (Firebase Firestore)
- [ ] Advanced search and filters
- [ ] Pagination for long lists
- [ ] Pull-to-refresh on all lists
- [ ] Error boundaries
- [ ] Loading skeletons
- [ ] Dark mode support
- [ ] Offline mode support

## 📚 Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 License

This project is part of the Fordham SwipeShare capstone project.
