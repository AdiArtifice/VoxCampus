# Expo SDK 53 Upgrade Notes

This project has been upgraded to Expo SDK 53 with React 19 and React Native 0.79.

What changed (high-level):
- Expo SDK: 53.x
- React: 19.x, React Native: 0.79.x
- jest-expo: ~53.0.10, react-test-renderer: 19.x, @types/react: ~19.0.10, TypeScript: ~5.8.x
- Removed an invalid `expo-font` config plugin from app.json
- Fixed app.json icon paths to valid files in `assets/images`

Verify locally (Windows/PowerShell):
1) Clean install (optional, recommended if you see resolver/peer conflicts)
   - cmd.exe:
     - rmdir /s /q node_modules
     - del package-lock.json
   - PowerShell:
     - cmd /c rmdir /s /q node_modules
     - Remove-Item -Force .\package-lock.json
   - npm install

2) Check health
   - npx expo-doctor
   - npx tsc --noEmit
   - npx expo install --check

3) Run the app
   - npm run start
   - npm run android (or) npm run ios (or) npm run web
   - If you see cache issues: npx expo start -c

Notes:
- app.json icons now use assets/images/appwrite-logo.png for both `icon` and Android `adaptiveIcon.foregroundImage`. Replace these with your branding as needed.
- If you prebuild (bare): npx expo prebuild --clean (then open native projects). Not required for managed workflows.
