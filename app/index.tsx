import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { Header } from "@/components/Header";
import { useMemo, useRef, useState, useEffect } from "react";
import { Card } from "@/components/Card";
import { fontStyles } from "@/styles/font";
import { IconArrowSmRight } from "@/assets/images/IconArrowSmRight";
import { Code } from "@/components/Code";
import { Logs } from "@/components/Logs";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Log } from "@/types/log";
import { AppwriteException, Client } from "appwrite";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Button } from "@/components/Button";

const client = new Client()
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? "")
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? "");

// prevent ssr issues
function ClientOnlyBottomSheet({ children, ...props }: any) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return <BottomSheet {...props}>{children}</BottomSheet>;
}

function ClientOnlyGestureHandler({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  return <GestureHandlerRootView>{children}</GestureHandlerRootView>;
}

function HomeScreen() {
  const [connectionState, setConnectionState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [currentSnapIndex, setCurrentSnapIndex] = useState<number>(0);
  const [logs, setLogs] = useState<Array<Log>>([]);
  const [cardPadding, setCardPadding] = useState<number>(0);

  const doPing = async () => {
    setConnectionState("loading");
    let log: Log;
    try {
      const res = await client.ping();
      log = {
        date: new Date(),
        method: "GET",
        path: "/v1/ping",
        status: 200,
        response: res,
      };
      setConnectionState("success");
    } catch (err) {
      log = {
        date: new Date(),
        method: "GET",
        path: "/v1/ping",
        status: err instanceof AppwriteException ? err.code : 500,
        response: err instanceof AppwriteException ? err.message : "unknown",
      };
      setConnectionState("error");
    }
    setLogs([...logs, log]);
  };

  const toggleBottomSheet = () => {
    if (bottomSheetRef.current) {
      const newIndex = currentSnapIndex === 1 ? 0 : 1;
      setCurrentSnapIndex(newIndex);
      bottomSheetRef.current.snapToIndex(newIndex);
    }
  };

  const snapPoints = useMemo(
    () => [Platform.OS === "android" ? 50 : 70, "50%", "90%"],
    [],
  );

  const resolveSnapPoint = (point: string | number): number => {
    if (typeof point === "number") return point;
    if (point.endsWith("%")) {
      const percent = parseFloat(point.replace("%", ""));
      return (percent / 100) * Dimensions.get("window").height;
    }
    return 0;
  };

  const handleSnapChange = (index: number) => {
    setCardPadding(resolveSnapPoint(snapPoints[index]) + 48);
    setCurrentSnapIndex(index);
  };

  return (
    <View style={{ flex: 1 }}>
      <ClientOnlyGestureHandler>
        <ScrollView>
          <Header pingFunction={doPing} state={connectionState} />
          <View
            style={{ ...styles.cardContainer, paddingBlockEnd: cardPadding }}
          >
            <Card>
              <View style={styles.cardHeader}>
                <Text style={fontStyles.titleM}>Edit your app</Text>
              </View>
              <Text>
                <Code variant={"secondary"}>Edit </Code>
                <Code variant={"primary"}>app/index.tsx</Code>
                <Code variant={"secondary"}>
                  to get started with building your app
                </Code>
              </Text>
            </Card>
            <Card href={"https://cloud.appwrite.io"}>
              <View style={styles.cardHeader}>
                <Text style={fontStyles.titleM}>Go to console</Text>
                <IconArrowSmRight />
              </View>
              <Text style={fontStyles.bodyM}>
                Navigate to the console to control and oversee the Appwrite
                services.
              </Text>
            </Card>
            <Card href={"https://appwrite.io/docs"}>
              <View style={styles.cardHeader}>
                <Text style={fontStyles.titleM}>Explore docs</Text>
                <IconArrowSmRight />
              </View>
              <Text style={fontStyles.bodyM}>
                Discover the full power of Appwrite by diving into our
                documentation.
              </Text>
            </Card>
          </View>
        </ScrollView>
        <ClientOnlyBottomSheet
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          handleComponent={null}
          ref={bottomSheetRef}
          onChange={handleSnapChange}
        >
          <BottomSheetView style={styles.bottomSheet}>
            <Logs
              toggleBottomSheet={toggleBottomSheet}
              isOpen={currentSnapIndex > 0}
              logs={logs}
            />
          </BottomSheetView>
        </ClientOnlyBottomSheet>
      </ClientOnlyGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    borderTopWidth: 1,
    minHeight: Platform.OS === "android" ? 50 : 70,
    flex: 1,
    borderColor: "#EDEDF0",
  },
  cardContainer: {
    paddingInline: 20,
    display: "flex",
    flexDirection: Dimensions.get("window").width < 1024 ? "column" : "row",
    justifyContent: "center",
    gap: 28,
  },
  scrollview: {
    height: 200,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  editDescription: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
});

function ProtectedContent() {
  const { user, initializing, logout, refresh, sendVerificationEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [resending, setResending] = useState(false);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return mode === 'login' ? (
      <LoginForm onSwitchToRegister={() => setMode('register')} />
    ) : (
      <RegisterForm onSwitchToLogin={() => setMode('login')} />
    );
  }

  const onResend = async () => {
    try {
      setResending(true);
      await sendVerificationEmail();
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          padding: 12,
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#F9F9FA',
          borderBottomWidth: 1,
          borderColor: '#EDEDF0',
        }}
      >
        <Text style={{ fontSize: 14 }}>Welcome, {user.name || user.email}</Text>
        <Button text={"Logout"} onPress={logout} />
      </View>

      {!user.emailVerification && (
        <View style={{ padding: 12, backgroundColor: '#FFF8E1', borderBottomWidth: 1, borderColor: '#FFECB3' }}>
          <Text style={{ color: '#8D6E63', marginBottom: 8 }}>
            Your email is not verified. Please check your inbox and click the verification link.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button text={resending ? 'Sending…' : 'Resend verification email'} onPress={onResend} />
            <View style={{ width: 12 }} />
            <Button text={'Refresh status'} onPress={refresh} />
          </View>
        </View>
      )}

      <HomeScreen />
    </View>
  );
}

export default function Index() {
  return (
    <ProtectedContent />
  );
}
