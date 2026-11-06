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
      className="absolute w-24 h-24 rounded-full border-2 border-[#0E9C79]"
      style={style}
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
      className="absolute w-24 h-24"
      style={style}
    >
      <LinearGradient
        colors={[AI_GRADIENT[1], AI_GRADIENT[0], "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-24 h-24 rounded-full p-[3px]"
      >
        <View className="flex-1 rounded-full bg-[#161829]" />
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
      <View className="flex-1 justify-end">
        <BlurView
          intensity={40}
          tint="dark"
          className="absolute inset-0"
        />

        <LinearGradient
          colors={["#1C1E2E", "#0F1020"]}
          className="w-full items-center overflow-hidden rounded-t-[28px] px-6 pt-7 pb-10"
        >
          <View className="w-10 h-1 rounded-full bg-white/15 mb-6" />

          {status === "error" ? (
            <>
              <Feather name="alert-circle" size={32} color="#FF6B4A" />

              <Text className="text-white/60 text-sm mt-3 mb-6 text-center">
                Couldn&apos;t process that. Check your microphone permission and
                try again.
              </Text>

              <TouchableOpacity
                onPress={closeModal}
                className="bg-white/10 rounded-xl px-6 py-3.5"
              >
                <Text className="text-white text-sm font-semibold">
                  Close
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View className="flex-row items-center gap-1.5 mb-1">
                <MaterialCommunityIcons
                  name="robot-outline"
                  size={13}
                  color={COLORS.teal}
                />

                <Text
                  className="text-[11px] font-semibold tracking-wider uppercase"
                  style={{
                    color: COLORS.teal,
                  }}
                >
                  AI voice log
                </Text>
              </View>

              <Text className="text-white text-base font-semibold mb-1">
                {status === "recording"
                  ? "Listening…"
                  : status === "processing"
                  ? "Understanding that…"
                  : status === "preparing"
                  ? "Getting ready…"
                  : "Tell me about a transaction"}
              </Text>

              <Text className="text-white/50 text-xs mb-8 text-center px-4">
                {status === "recording"
                  ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
                  : status === "processing"
                  ? "Transcribing and extracting the details"
                  : status === "preparing"
                  ? "Preparing microphone"
                  : '"I spent 400 on groceries yesterday"'}
              </Text>

              <View className="w-24 h-24 items-center justify-center mb-8">
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
                <Text className="text-white/40 text-sm">
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