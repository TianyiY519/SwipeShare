# React Native Mobile App Setup

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **React Native CLI** - `npm install -g react-native-cli`
- **Android Studio** (for Android) - [Download](https://developer.android.com/studio)
- **Xcode** (for iOS, Mac only) - [Download from App Store](https://apps.apple.com/us/app/xcode/id497799835)

## Step 1: Initialize React Native Project

Since we're creating a fresh React Native project, run:

```bash
cd d:\Capstone\FordhamSwipeShare

# Create new React Native project with TypeScript
npx react-native init mobile --template react-native-template-typescript

# This will create the mobile/ directory with Android and iOS native files
```

**Important**: This command will create a complete React Native project with all necessary native files.

## Step 2: Install Dependencies

```bash
cd mobile

# Install all required packages
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler
npm install @react-native-firebase/app @react-native-firebase/firestore @react-native-firebase/messaging
npm install react-native-paper react-native-vector-icons
npm install axios
npm install @react-native-async-storage/async-storage
npm install date-fns
npm install formik yup
npm install react-native-image-picker

# Install dev dependencies
npm install --save-dev @types/react @types/react-native
```

## Step 3: Configure Path Aliases (TypeScript)

Update `tsconfig.json`:

```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@screens/*": ["src/screens/*"],
      "@components/*": ["src/components/*"],
      "@services/*": ["src/services/*"],
      "@navigation/*": ["src/navigation/*"],
      "@contexts/*": ["src/contexts/*"],
      "@config/*": ["src/config/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@assets/*": ["src/assets/*"]
    }
  }
}
```

## Step 4: Configure Babel

Update `babel.config.js`:

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@screens': './src/screens',
          '@components': './src/components',
          '@services': './src/services',
          '@navigation': './src/navigation',
          '@contexts': './src/contexts',
          '@config': './src/config',
          '@utils': './src/utils',
          '@types': './src/types',
          '@assets': './src/assets',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
```

Install babel plugin:
```bash
npm install --save-dev babel-plugin-module-resolver
```

## Step 5: Set Up Project Structure

Create the source directory structure:

```bash
# Windows (PowerShell or CMD):
mkdir src
mkdir src\screens src\screens\Auth src\screens\Home src\screens\Swipes src\screens\Forum src\screens\Messages src\screens\Profile
mkdir src\navigation
mkdir src\services
mkdir src\contexts
mkdir src\components src\components\common src\components\swipes src\components\forum
mkdir src\config
mkdir src\types
mkdir src\utils
mkdir src\assets src\assets\images

# Mac/Linux:
mkdir -p src/{screens/{Auth,Home,Swipes,Forum,Messages,Profile},navigation,services,contexts,components/{common,swipes,forum},config,types,utils,assets/images}
```

## Step 6: Configure React Native Paper

The app uses React Native Paper for Material Design components.

Install peer dependencies:
```bash
npm install react-native-vector-icons
```

### For Android:

Edit `android/app/build.gradle`, add:

```gradle
apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")
```

### For iOS:

```bash
cd ios
pod install
cd ..
```

Edit `ios/mobile/Info.plist`, add before `</dict>`:

```xml
<key>UIAppFonts</key>
<array>
  <string>MaterialCommunityIcons.ttf</string>
</array>
```

## Step 7: Configure Firebase (Messaging Only)

We're using Firebase only for real-time messaging and push notifications.

### Get Firebase Config:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project: **"fordham-swipeshare"**
3. Add Android and iOS apps
4. Download:
   - `google-services.json` (Android) → Place in `android/app/`
   - `GoogleService-Info.plist` (iOS) → Place in `ios/mobile/`

### Android Configuration:

1. Edit `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

2. Edit `android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'  // At the bottom
```

### iOS Configuration:

```bash
cd ios
pod install
cd ..
```

## Step 8: Configure API Connection

Create `src/config/api.ts`:

```typescript
export const API_CONFIG = {
  // Development
  BASE_URL: __DEV__
    ? 'http://10.0.2.2:8000/api'  // Android emulator
    : 'https://your-production-api.com/api',

  // For iOS simulator, use: 'http://localhost:8000/api'
  // For physical device, use your computer's local IP: 'http://192.168.1.x:8000/api'

  TIMEOUT: 10000,  // 10 seconds
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
```

## Step 9: Run the App

### Android:

```bash
# Start Metro bundler
npm start

# In another terminal, run Android
npm run android

# Or manually:
npx react-native run-android
```

**Troubleshooting Android:**
- Make sure Android Studio is installed
- Set up Android SDK (API 33+)
- Create an emulator (Pixel 5, API 33)
- Or connect a physical device with USB debugging

### iOS (Mac only):

```bash
# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Run iOS
npm run ios

# Or manually:
npx react-native run-ios
```

**Troubleshooting iOS:**
- Xcode must be installed
- Open `ios/mobile.xcworkspace` in Xcode
- Select a simulator (iPhone 14)
- Build and run

## Step 10: Link Existing Source Code

Now you can copy the existing React Native source code from the old `FordhamCampusPlatform` project:

```bash
# Copy source files (adjust path as needed)
cp -r d:\Capstone\FordhamCampusPlatform\src\* d:\Capstone\FordhamSwipeShare\mobile\src\

# This copies:
# - screens/
# - navigation/
# - contexts/
# - types/
# - config/
```

**Important**: You'll need to update the services to use REST API instead of direct Firebase calls.

## Step 11: Verify Setup

Test that everything works:

1. **Run the app:**
   ```bash
   npm run android  # or npm run ios
   ```

2. **Check Metro bundler:**
   - Should show "Loading..." then your app

3. **Hot reload:**
   - Press `R` twice in the app to reload
   - Or shake device and select "Reload"

## Common Issues

### Metro Bundler Error:
```bash
# Clear cache
npm start -- --reset-cache
```

### Android Build Error:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS Build Error:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

### Module Not Found:
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# For iOS:
cd ios && pod install && cd ..
```

## Next Steps

1. ✅ React Native project is set up
2. 📝 Copy existing source code from old project
3. 🔄 Update services to use Django API instead of Firebase
4. 🎨 Test authentication flow with Django backend
5. 🚀 Build out remaining features

## Useful Commands

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Clear cache and restart
npm start -- --reset-cache

# Check TypeScript errors
npx tsc --noEmit

# Lint code
npm run lint

# Format code (if Prettier is configured)
npm run format
```

## Resources

- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Native Firebase](https://rnfirebase.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Need help?** Check the main [README.md](../README.md) or [ARCHITECTURE.md](../ARCHITECTURE.md)
