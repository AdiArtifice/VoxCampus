import { Slot } from "expo-router";
import { Platform, View, Text } from "react-native";
import { 
  Poppins_300Light, 
  useFonts 
} from "@expo-google-fonts/poppins";
import { 
  Inter_400Regular, 
  Inter_300Light 
} from "@expo-google-fonts/inter";
import { 
  Itim_400Regular 
} from "@expo-google-fonts/itim";
import { 
  Neuton_400Regular 
} from "@expo-google-fonts/neuton";
import { 
  StardosStencil_400Regular 
} from "@expo-google-fonts/stardos-stencil";
import Head from "expo-router/head";
import React, { useEffect } from "react";
import { AuthProvider, ProviderGuard } from "@/context/AuthContext";
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_300Light,
    Inter_400Regular,
    Inter_300Light,
    Itim_400Regular,
    Neuton_400Regular,
    StardosStencil_400Regular,
    // Aliases for easier use in styles
    Itim: Itim_400Regular,
    Neuton: Neuton_400Regular,
    'Stardos Stencil': StardosStencil_400Regular,
  });

  // Show loading screen while fonts are loading
  if (!fontsLoaded && !fontError) {
    return null;
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
          {/* Dev banner to quickly detect provider presence */}
          {__DEV__ && (
            <View
              pointerEvents="none"
              style={{ position: "absolute", top: 0, left: 0, right: 0, backgroundColor: "#E3F2FD", paddingVertical: 2, borderBottomWidth: 1, borderColor: "#BBDEFB", zIndex: 9999 }}
            >
              <Text style={{ textAlign: "center", color: "#1565C0", fontSize: 10 }}>AuthProvider mounted</Text>
            </View>
          )}
          <ProviderGuard>
            <NavigationContainer>
              <Slot />
            </NavigationContainer>
          </ProviderGuard>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
