import {
  extractTransactionFromVoice,
  ExtractedTransaction,
} from "@/lib/services/extractTransaction";
import { GradientIconButton } from "@/components/GradientIconButton";
import { AI_GRADIENT, RECORDING_GRADIENT, COLORS } from "@/constants/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { File } from "expo-file-system";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type Status = "idle" | "preparing" | "recording" | "processing" | "error";

const MIN_RECORDING_DURATION_MS = 1000;

function wait(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function PulseRing({ delay, active }: { delay: number; active: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    );
  }, [active, progress, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.5,
    transform: [{ scale: 1 + progress.value * 0.9 }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 96,
          height: 96,
          borderRadius: 48,
          borderWidth: 2,
          borderColor: "#0E9C79",
        },
        style,
      ]}
    />
  );
}

function ProcessingRing() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1100, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 96,
          height: 96,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[AI_GRADIENT[1], AI_GRADIENT[0], "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          padding: 3,
        }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: 48,
            backgroundColor: "#161829",
          }}
        />
      </LinearGradient>
    </Animated.View>
  );
}

export function VoiceRecorderModal({
  visible,
  onClose,
  onExtracted,
}: {
  visible: boolean;
  onClose: () => void;
  onExtracted: (result: ExtractedTransaction) => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setStatus] = useState<Status>("idle");
  const [seconds, setSeconds] = useState(0);
  const recordingStartedAt = useRef<number | null>(null);
  const actionInProgress = useRef(false);

  const orbScale = useSharedValue(1);

  useEffect(() => {
    if (!visible) {
      setStatus("idle");
      setSeconds(0);
      recordingStartedAt.current = null;
      return;
    }
    let active = true;
    setStatus("preparing");
    (async () => {
      try {
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          if (active) setStatus("error");
          return;
        }
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        if (active) setStatus("idle");
      } catch (err) {
        console.error("Voice recorder setup failed:", err);
        if (active) setStatus("error");
      }
    })();

    return () => {
      active = false;
    };
  }, [visible]);

  useEffect(() => {
    if (status !== "recording") return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status === "recording") {
      orbScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      orbScale.value = withTiming(1, { duration: 200 });
    }
  }, [status, orbScale]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const startRecording = async () => {
    if (status !== "idle" || actionInProgress.current) return;

    actionInProgress.current = true;
    setSeconds(0);
    setStatus("preparing");
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingStartedAt.current = Date.now();
      setStatus("recording");
    } catch (err) {
      console.error("Voice recording failed to start:", err);
      setStatus("error");
    } finally {
      actionInProgress.current = false;
    }
  };

  const stopRecording = async () => {
    const startedAt = recordingStartedAt.current;
    if (startedAt === null || actionInProgress.current) return;

    actionInProgress.current = true;
    setStatus("processing");
    try {
      const remaining =
        MIN_RECORDING_DURATION_MS - (Date.now() - startedAt);
      if (remaining > 0) await wait(remaining);

      await recorder.stop();
      recordingStartedAt.current = null;

      const uri = recorder.uri;
      if (!uri) throw new Error("No recording captured");

      const file = new File(uri);
      const base64 = await file.base64();
      const result = await extractTransactionFromVoice(base64, "audio/m4a");
      onExtracted(result);
      onClose();
    } catch (err) {
      recordingStartedAt.current = null;
      console.error("Voice recording or extraction failed:", err);
      setStatus("error");
    } finally {
      actionInProgress.current = false;
    }
  };

  const closeModal = async () => {
    if (actionInProgress.current) return;

    const startedAt = recordingStartedAt.current;
    if (startedAt !== null) {
      actionInProgress.current = true;
      try {
        const remaining =
          MIN_RECORDING_DURATION_MS - (Date.now() - startedAt);
        if (remaining > 0) await wait(remaining);
        await recorder.stop();
      } catch (err) {
        console.error("Could not stop canceled voice recording:", err);
      } finally {
        recordingStartedAt.current = null;
        actionInProgress.current = false;
      }
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={closeModal}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        <BlurView
          intensity={40}
          tint="dark"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        />

        <LinearGradient
          colors={["#1C1E2E", "#0F1020"]}
          style={{
            width: "100%",
            alignItems: "center",
            overflow: "hidden",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.15)",
              marginBottom: 24,
            }}
          />

          {status === "error" ? (
            <>
              <Feather name="alert-circle" size={32} color="#FF6B4A" />

              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 14,
                  marginTop: 12,
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                Couldn&apos;t process that. Check your microphone permission and
                try again.
              </Text>

              <TouchableOpacity
                onPress={closeModal}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <MaterialCommunityIcons
                  name="robot-outline"
                  size={13}
                  color={COLORS.teal}
                />

                <Text
                  style={{
                    color: COLORS.teal,
                    fontSize: 11,
                    fontWeight: "600",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  AI voice log
                </Text>
              </View>

              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                {status === "recording"
                  ? "Listening…"
                  : status === "processing"
                  ? "Understanding that…"
                  : status === "preparing"
                  ? "Getting ready…"
                  : "Tell me about a transaction"}
              </Text>

              <Text
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  marginBottom: 32,
                  textAlign: "center",
                  paddingHorizontal: 16,
                }}
              >
                {status === "recording"
                  ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
                  : status === "processing"
                  ? "Transcribing and extracting the details"
                  : status === "preparing"
                  ? "Preparing microphone"
                  : '"I spent 400 on groceries yesterday"'}
              </Text>

              <View
                style={{
                  width: 96,
                  height: 96,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 32,
                }}
              >
                {status === "idle" && (
                  <>
                    <PulseRing delay={0} active />
                    <PulseRing delay={800} active />
                  </>
                )}

                {status === "recording" && (
                  <>
                    <PulseRing delay={0} active />
                    <PulseRing delay={500} active />
                  </>
                )}

                {status === "processing" && <ProcessingRing />}

                <Animated.View style={orbStyle}>
                  <GradientIconButton
                    icon={status === "recording" ? "square" : "mic"}
                    colors={
                      status === "recording"
                        ? RECORDING_GRADIENT
                        : [AI_GRADIENT[1], AI_GRADIENT[0]]
                    }
                    disabled={status === "preparing" || status === "processing"}
                    onPress={
                      status === "recording" ? stopRecording : startRecording
                    }
                  />
                </Animated.View>
              </View>

              <TouchableOpacity
                onPress={closeModal}
                disabled={status === "preparing" || status === "processing"}
              >
                <Text
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 14,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
}