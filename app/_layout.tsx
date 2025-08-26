import { Slot } from "expo-router";
import { Platform, View, Text } from "react-native";
import { Poppins_300Light, useFonts } from "@expo-google-fonts/poppins";
import { Inter_400Regular, Inter_300Light } from "@expo-google-fonts/inter";
import Head from "expo-router/head";
import React from "react";
import { AuthProvider, ProviderGuard } from "@/context/AuthContext";

export default function HomeLayout() {
  const [loaded, error] = useFonts({
    Poppins_300Light,
    Inter_400Regular,
    Inter_300Light,
  });
  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAFB" }}>
      {Platform.OS === "web" && (
        <Head>
          <title>Appwrite + React Native</title>
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
          <Slot />
        </ProviderGuard>
      </AuthProvider>
    </View>
  );
}
