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
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/50"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="flex-1"
        />
        <View className="bg-[#F8F7F2] rounded-t-[32px] px-6 pt-3 pb-8 border-t border-[#E8E6DF] shadow-2xl">
          {/* Grab handle indicator */}
          <View className="w-11 h-1.5 bg-[#D5D3CC] rounded-full self-center mb-4 mt-1" />

          <Text className="text-[#1A1D26] text-lg font-bold mb-4 tracking-tight">
            {title}
          </Text>

          {children}

          <TouchableOpacity
            onPress={onClose}
            className="py-2.5 items-center mt-1"
            activeOpacity={0.7}
          >
            <Text className="text-[#6B6E77] text-sm font-medium">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
