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
import React, { useEffect } from "react";
import { AuthProvider, ProviderGuard } from "@/context/AuthContext";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator } from "react-native";
import * as SplashScreen from 'expo-splash-screen';
import TestUserBanner from "@/components/TestUserBanner";
import MainLayout from "@/components/MainLayout";

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

  // Determine if all fonts are loaded
  const fontsLoaded = poppinsLoaded && interLoaded;

  // After fonts are loaded, hide the splash screen
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

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
            <MainLayout>
              <Slot />
            </MainLayout>
          </ProviderGuard>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
