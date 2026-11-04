import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function FormSheetModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        }}
      >
        <View
          style={{
            backgroundColor: "#F8F7F2",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 32,
          }}
        >
          <Text
            style={{
              color: "#1A1D26",
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 16,
            }}
          >
            {title}
          </Text>

          {children}

          <TouchableOpacity
            onPress={onClose}
            style={{
              paddingVertical: 8,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#6B6E77",
                fontSize: 14,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}