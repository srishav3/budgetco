import { GradientIconButton } from "@/components/GradientIconButton";
import { AI_GRADIENT, COLORS } from "@/constants/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function ReceiptScannerModal({
  visible,
  onClose,
  onCaptured,
}: {
  visible: boolean;
  onClose: () => void;
  onCaptured: (base64: string, mimeType: string) => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (visible && !permission?.granted) requestPermission();
  }, [visible, permission?.granted, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
      });
      if (photo?.base64) onCaptured(photo.base64, "image/jpeg");
    } catch (err) {
      console.error("Camera capture failed:", err);
    } finally {
      setCapturing(false);
    }
  };

  const handlePickFromLibrary = async () => {
    const libraryPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!libraryPermission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.base64) onCaptured(asset.base64, asset.mimeType ?? "image/jpeg");
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View
        style={{
          flex: 1,
          backgroundColor: "#000000",
        }}
      >
        {permission?.granted && (
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        )}

        {/* Scan-frame overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              width: "100%",
              aspectRatio: 3 / 4,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.7)",
              borderStyle: "dashed",
            }}
          />
        </View>

        <SafeAreaView
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
          edges={["top", "bottom"]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 12,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0,0,0,0.4)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="x" size={18} color="#fff" />
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(0,0,0,0.4)",
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <MaterialCommunityIcons
                name="robot-outline"
                size={12}
                color={COLORS.teal}
              />
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: "500",
                }}
              >
                Align the receipt
              </Text>
            </View>

            <View style={{ width: 40, height: 40 }} />
          </View>

          <View style={{ flex: 1 }} />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 40,
              paddingBottom: 24,
            }}
          >
            <TouchableOpacity
              onPress={handlePickFromLibrary}
              disabled={capturing}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(0,0,0,0.4)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="image" size={18} color="#fff" />
            </TouchableOpacity>

            <GradientIconButton
              icon="camera"
              colors={[AI_GRADIENT[1], AI_GRADIENT[0]]}
              size={72}
              iconSize={26}
              loading={capturing}
              disabled={!permission?.granted}
              borderColor="rgba(255,255,255,0.85)"
              onPress={handleCapture}
            />

            <View style={{ width: 48, height: 48 }} />
          </View>
        </SafeAreaView>

        {!permission?.granted && permission?.canAskAgain === false && (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.8)",
              paddingHorizontal: 40,
            }}
          >
            <Feather name="camera-off" size={32} color="#8A8D96" />

            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 14,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              Camera access is off. Enable it in Settings to scan receipts.
            </Text>

            <TouchableOpacity
              onPress={onClose}
              style={{ marginTop: 24 }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}