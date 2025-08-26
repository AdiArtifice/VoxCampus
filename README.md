# VoxCampus 📱🎓

**Your Campus. Your Network. Your Voice.**

VoxCampus is a modern campus networking platform built with React Native and Appwrite, designed to connect students, faculty, and staff in a seamless digital environment.

## 🌟 About VoxCampus

VoxCampus aims to revolutionize campus communication by providing a centralized platform for:
- **Student Networking** - Connect with peers across different departments
- **Event Management** - Stay updated with campus events and activities  
- **Academic Resources** - Share and access study materials
- **Campus Announcements** - Real-time updates from administration
- **Community Building** - Foster stronger campus relationships

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Appwrite (BaaS)
- **Database**: Appwrite Database
- **Authentication**: Appwrite Auth
- **Real-time**: Appwrite Realtime
- **Storage**: Appwrite Storage

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Xcode) or Android Emulator

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AdiArtifice/github-webstorm-demo.git
cd VoxCampus
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Appwrite**
- Create an Appwrite project at [cloud.appwrite.io](https://cloud.appwrite.io)
- Create a `.env` file and set:
  - `EXPO_PUBLIC_APPWRITE_ENDPOINT`=<your-endpoint>
  - `EXPO_PUBLIC_APPWRITE_PROJECT_ID`=<your-project-id>
  - `EXPO_PUBLIC_APP_BUNDLE_ID`=<your.bundle.id>
- Set up your database collections and permissions

4. **Run the application**
```bash
npm start
```
Download [Expo Go](https://expo.dev/go) to run the app on your device.

## ✅ Current Features

- [x] React Native + Appwrite integration
- [x] Project structure setup
- [x] Basic configuration
- [ ] User authentication
- [ ] Student profiles  
- [ ] Campus feed
- [ ] Event management
- [ ] Real-time messaging
- [ ] File sharing

## 🎯 Roadmap

### Phase 1: Foundation
- User authentication (signup/login)
- Student profile creation
- Basic navigation structure

### Phase 2: Core Features  
- Campus news feed
- Event discovery and management
- Student directory

### Phase 3: Advanced Features
- Real-time chat system
- Study groups
- Resource sharing
- Push notifications

### Phase 4: Enhancement
- Advanced search and filters
- Analytics dashboard
- Mobile app optimization

## 🏗️ Project Structure

```
VoxCampus/
├── .expo/              # Expo-related configuration and cache files (hidden)
├── .git/               # Git version control folder (hidden)
├── .idea/              # WebStorm / IntelliJ project config (hidden)
├── app/                # Main source code folder (React Native components & screens)
├── assets/             # Images, fonts, and other static resources
├── components/         # Reusable UI components
├── node_modules/       # Node.js dependencies installed by npm
├── scripts/            # Project scripts and utilities
├── styles/             # CSS / style-related files
├── types/              # TypeScript type definitions and interfaces
├── .env                # Environment variables configuration file (hidden)
├── .gitignore          # Git ignore rules
├── app.json            # Expo configuration file
├── expo-env.d.ts       # Expo TypeScript environment declarations
├── package.json        # Node.js project metadata and dependencies
├── package-lock.json   # Automatically generated npm lock file
├── README.md           # Project documentation markdown file
├── README.upgrade-sdk53.md # Migration notes or upgrade info
├── tsconfig.json       # TypeScript compiler configuration file

```

## 👨‍💻 Developer

**Aditya** - AI/ML Engineering Student  
- 🎓 B.Tech in AIML, St. John College of Engineering and Management
- 🏫 University of Mumbai  
- 💼 Specialized in Python, Machine Learning, and Mobile Development

## 📝 Development Notes

This project was bootstrapped from the Appwrite React Native starter template and customized for campus networking use cases.

## 🤝 Contributing

This is currently a personal project for campus networking. Future collaboration opportunities will be considered as the project grows.

## 📞 Contact

For questions or suggestions about VoxCampus:
- GitHub: [@AdiArtifice](https://github.com/AdiArtifice)
- Project Repository: [VoxCampus](https://github.com/AdiArtifice/github-webstorm-demo)

---

**Building connections, one campus at a time.** 🌟

## 🔄 How to Update

Replace your current README.md with the content above and commit the changes:

```bash
git add README.md
git commit -m "📝 Update README for VoxCampus project"
git push origin main
```

## Google Sign-In (Appwrite OAuth2 Token Flow)

This app implements "Continue with Google" using Appwrite's mobile OAuth token flow and Expo deep linking.

Prerequisites
- Ensure Google OAuth2 provider is enabled in your Appwrite project and Client ID/Secret are configured.
- Set environment variables in .env:
  - EXPO_PUBLIC_APPWRITE_ENDPOINT
  - EXPO_PUBLIC_APPWRITE_PROJECT_ID
- app.json already configures scheme: voxcampus and bundle/package: com.voxcampus.app.

How it works
- We create a redirect URL with Linking.createURL('auth-callback', { scheme: 'voxcampus' }).
- Start the flow using account.createOAuth2Token('google', successRedirect, failureRedirect).
- The returned URL is opened using WebBrowser.openAuthSessionAsync.
- When redirected back to the app, userId and secret are parsed from the URL and account.createSession(userId, secret) completes login.
- After login, we fetch the user via account.get() and store it in a global AuthContext.
- We enforce domain restriction: only emails ending with @sjcem.edu.in are allowed. Others are signed out with an error message.

Manual testing checklist
1) Manual deep link
   - On your device/emulator, open: voxcampus://auth-callback?userId=test&secret=test
   - Observe console logs: the deep link handler runs. (Session will fail with test values, but the handler should fire.)

2) Continue with Google (cold start)
   - Close the app.
   - Open the app and tap "Continue with Google" on the sign-in screen.
   - Complete Google sign-in; you should be redirected back to the app and authenticated. Check console logs for:
     - Opened OAuth URL
     - Received redirect URL
     - Parsed userId/secret
     - Session creation result

3) Continue with Google (warm start)
   - Put the app in background.
   - Tap "Continue with Google" again and complete login.
   - Same behavior as cold start; logs should confirm deep link capture.

4) Domain enforcement
   - Try a non-sjcem.edu.in Google account.
   - You should see an error message: "Only sjcem.edu.in accounts are allowed." and the session is removed.

5) Sign out
   - Tap Logout in the header.
   - The app returns to the unauthenticated state.

Where to change allowed email domain
- utils/validation.ts: function isSJCEMEmail controls the allowed domain. Update the regex there to change domain policy.

Key files
- lib/appwrite.js: initializes Appwrite Client and Account; sets platform to com.voxcampus.app.
- context/AuthContext.tsx: global auth state, Google sign-in, deep link handling, domain enforcement, and sign-out.
- features/auth/google.ts: contains the token-based Google OAuth flow and helpers.
- components/auth/LoginForm.tsx: adds the "Continue with Google" button and loading states.

Troubleshooting
- If the browser is closed during sign-in, you will see a canceled message.
- If the app does not return to the foreground, ensure that the scheme (voxcampus) is correctly set and that your device can open custom URL schemes.
- Confirm Appwrite endpoint and project ID env variables are correctly set.


## Shared SocialAuthButtons and Sign Up with Google

We added a reusable SocialAuthButtons component used by both the Sign In and Sign Up forms. It uses the same token-based Appwrite OAuth2 mobile flow under the hood.

- Sign In screen text: "Continue with Google"
- Sign Up screen text: "Sign up with Google"
- Buttons disable during OAuth and show a spinner. Accessible labels are added and touch target is at least 44px.

First-time user detection
- After sign-in, the component logs whether the user appears to be new based on:
  - preferences.onboarded !== true, or
  - account created in last 10 minutes, or
  - missing name
- Use the onSuccess(user) callback to route to your Onboarding screen and mark preferences.onboarded = true when done. Otherwise route to Home.

Acceptance checks update
- Sign Up shows "Sign up with Google"; tapping completes the same Google flow and logs first-time detection.
- Sign In shows "Continue with Google" and routes to Home.
- Non-sjcem.edu.in accounts are rejected with a clear message and the session is deleted.

## Email Verification Deep Link

We added a dedicated verify-email route that is wrapped by the global AuthProvider and works on both cold and warm starts.

How it works
- Verification emails are sent using a deep-link redirect to the app: voxcampus://verify-email?userId=...&secret=...
- The screen app/verify-email.tsx parses userId and secret from either the route or the incoming URL.
- It calls Appwrite updateVerification via AuthContext and then refreshes the user.
- Robust handling for both:
  - Cold start: reads Linking.getInitialURL()
  - Warm start: listens to Linking.addEventListener('url') and cleans up on unmount
- UI shows states: pending, success, and error. Includes actions: Resend email, Try again, Refresh status.

Diagnostics
- Console logs show: provider mount/unmount, verify-email mount/unmount, received URL, parsed params, updateVerification result, and refresh result.
- In development, a small banner at the top says “AuthProvider mounted” so you can quickly confirm the provider is present.

Manual testing
1) Cold start
   - Close the app.
   - Tap the Confirm Email link from your inbox.
   - The app opens on the Verify Email screen; it should move from pending → success.

2) Warm start
   - Put the app in background.
   - Tap the Confirm Email link.
   - The screen should capture the URL and verify successfully.

3) Invalid/missing params
   - Open voxcampus://verify-email (without params) or a malformed link.
   - Screen shows an error with actions to Resend and Try again.

Regression
- Google SSO, email/password sign-in, and resend verification continue to work under the single AuthProvider mounted at app/_layout.tsx.
