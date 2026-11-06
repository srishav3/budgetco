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
        className="flex-1 justify-end bg-black/40"
      >
        <View className="bg-[#F8F7F2] rounded-t-2xl px-5 pt-5 pb-8">
          <Text className="text-[#1A1D26] text-base font-semibold mb-4">
            {title}
          </Text>

          {children}

          <TouchableOpacity
            onPress={onClose}
            className="py-2 items-center"
          >
            <Text className="text-[#6B6E77] text-sm">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}