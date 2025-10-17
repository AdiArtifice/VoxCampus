import { Slot } from "expo-router";
import { Platform, View, Text } from "react-native";
import { 
  Poppins_300Light, 
  useFonts as usePoppinsFonts 
} from "@expo-google-fonts/poppins";
import { 
  Inter_400Regular, 
  Inter_300Light,
  useFonts as useInterFonts
} from "@expo-google-fonts/inter";
import Head from "expo-router/head";
import React, { useEffect, useState } from "react";
import { AuthProvider, ProviderGuard } from "@/context/AuthContext";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import { InstitutionFilter } from "@/utils/institutionFilter";
import GuestSessionExpiryModal, { useGuestSession } from "@/components/GuestSessionExpiryModal";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Load only the fonts that are available
  const [poppinsLoaded] = usePoppinsFonts({
    Poppins_300Light,
  });

  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_300Light,
  });
  
  // State for institution initialization
  const [institutionInitialized, setInstitutionInitialized] = useState(false);

  // Determine if all resources are loaded
  const fontsLoaded = poppinsLoaded && interLoaded;

  // Initialize the default institution
  useEffect(() => {
    const initializeInstitution = async () => {
      try {
        // Ensure the default institution exists for guest access
        await InstitutionFilter.ensureDefaultInstitutionExists();
        setInstitutionInitialized(true);
      } catch (error) {
        console.error('Failed to initialize default institution:', error);
        // Continue anyway to avoid blocking the app
        setInstitutionInitialized(true);
      }
    };
    
    initializeInstitution();
  }, []);

  // After resources are loaded, hide the splash screen
  useEffect(() => {
    if (fontsLoaded && institutionInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, institutionInitialized]);

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4682B4" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: "#FAFAFB" }}>
        {Platform.OS === "web" && (
          <Head>
            <title>VoxCampus</title>
          </Head>
        )}
        <AuthProvider>
          <ProviderGuard>
            <AppWithGuestSession />
          </ProviderGuard>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}

// Wrapper component to handle guest sessions
function AppWithGuestSession() {
  // Use the guest session hook to handle session expiry
  const { 
    isGuestSession,
    showModal, 
    handleLogin, 
    handleRegister 
  } = useGuestSession();
  
  return (
    <>
      <Slot />
      
      {/* Show the guest session modal when needed */}
      {isGuestSession && (
        <GuestSessionExpiryModal
          isVisible={showModal}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}
    </>
  );
}
