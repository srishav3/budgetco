import { useBudgetQuery } from "@/hooks/queries/useBudgetQuery";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { askAssistant } from "@/lib/services/assistant";
import { useUserStore } from "@/store/userStore";
import { useUser } from "@clerk/expo";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "How much did I spend on food this month?",
  "What's my biggest expense this week?",
  "Am I over budget anywhere?",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi! I'm your AI budget assistant. Ask me anything about your spending, accounts, or budgets in the last 30 days.",
  },
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <View className="mb-3.5 max-w-[85%] self-end">
        <View className="rounded-2xl rounded-tr-sm px-4 py-3 bg-[#1A1D26] shadow-sm shadow-black/10">
          <Text className="text-sm text-white leading-5">
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-3.5 max-w-[88%] self-start flex-row items-end gap-2">
      <View className="w-7 h-7 rounded-full bg-[#1A85FF]/10 items-center justify-center mb-0.5">
        <MaterialCommunityIcons name="robot-outline" size={15} color="#1A85FF" />
      </View>

      <View className="flex-1 rounded-2xl rounded-tl-sm px-4 py-3 bg-white border border-[#E8E6DF] shadow-sm shadow-black/5">
        <Text className="text-sm text-[#1A1D26] leading-5">
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export default function AssistantScreen() {
  const { user } = useUser();
  const currency = useUserStore((s) => s.currency);
  const { refetch: refetchTransactions } = useTransactionsQuery();
  const { refetch: refetchBudget } = useBudgetQuery();

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToBottom = (delay = 100) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, delay);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending || !user) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    scrollToBottom(50);

    try {
      const [{ data: transactions = [] }, { data: budget = null }] =
        await Promise.all([refetchTransactions(), refetchBudget()]);

      const reply = await askAssistant(text.trim(), transactions, budget, currency);

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: reply },
      ]);
      scrollToBottom(100);
    } catch (err) {
      console.error("Assistant error:", err);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I couldn't process that. Please try again.",
        },
      ]);
      scrollToBottom(100);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7F2]" edges={["top"]}>
      {/* Header with AI status */}
      <View className="px-5 pt-3 pb-3 flex-row items-center justify-between border-b border-[#E8E6DF]/70 bg-[#F8F7F2]">
        <View>
          <Text className="text-[#1A1D26] text-xl font-semibold">
            Assistant
          </Text>
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <View className="w-2 h-2 rounded-full bg-[#3DDC84]" />
            <Text className="text-xs text-[#8A8D96] font-medium">
              Powered by Gemini
            </Text>
          </View>
        </View>

        {messages.length > 1 && (
          <TouchableOpacity
            onPress={() => setMessages(INITIAL_MESSAGES)}
            className="px-3 py-1.5 rounded-full bg-white border border-[#E8E6DF] flex-row items-center gap-1.5 shadow-sm"
          >
            <Feather name="rotate-ccw" size={12} color="#8A8D96" />
            <Text className="text-xs text-[#8A8D96] font-medium">Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 85 : 0}
        className="flex-1"
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 16,
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            sending ? (
              <View className="mb-3 self-start flex-row items-end gap-2">
                <View className="w-7 h-7 rounded-full bg-[#1A85FF]/10 items-center justify-center mb-0.5">
                  <MaterialCommunityIcons name="robot-outline" size={15} color="#1A85FF" />
                </View>
                <View className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white border border-[#E8E6DF] shadow-sm flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#1A85FF" />
                  <Text className="text-xs text-[#8A8D96]">Analyzing your finances…</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Suggested Prompts */}
        {messages.length <= 1 && (
          <View className="px-4 pb-3">
            <Text className="text-xs font-medium text-[#8A8D96] mb-2 px-1">
              Suggested questions:
            </Text>
            <View className="gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  onPress={() => sendMessage(prompt)}
                  className="bg-white rounded-xl border border-[#E8E6DF] px-3.5 py-2.5 flex-row items-center justify-between shadow-sm shadow-black/5"
                  activeOpacity={0.7}
                >
                  <Text className="text-[#1A1D26] text-xs font-medium flex-1 pr-2">
                    {prompt}
                  </Text>
                  <Feather name="arrow-up-right" size={14} color="#8A8D96" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Dynamic bottom input container that shifts above the keyboard and tabs */}
        <View
          className="flex-row items-center gap-2.5 px-4 pt-2.5 bg-[#F8F7F2] border-t border-[#E8E6DF]/60"
          style={{
            paddingBottom: isKeyboardVisible
              ? 12
              : Platform.OS === "ios"
                ? 85
                : 76,
          }}
        >
          <View className="flex-1 flex-row items-center bg-white border border-[#E8E6DF] rounded-full px-4 py-1.5 shadow-sm shadow-black/5">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your spending..."
              placeholderTextColor="#8A8D96"
              editable={!sending}
              className="flex-1 text-sm text-[#1A1D26] py-2"
              onSubmitEditing={() => sendMessage(input)}
              returnKeyType="send"
            />
            {input.length > 0 && (
              <TouchableOpacity onPress={() => setInput("")} className="p-1 mr-1">
                <Feather name="x" size={14} color="#8A8D96" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={sending || !input.trim()}
            className={`w-11 h-11 rounded-full items-center justify-center shadow-sm ${
              input.trim() && !sending
                ? "bg-[#1A1D26] shadow-black/10"
                : "bg-[#E8E6DF]"
            }`}
            activeOpacity={0.8}
          >
            <Feather
              name="arrow-up"
              size={18}
              color={input.trim() && !sending ? "#FFFFFF" : "#8A8D96"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}