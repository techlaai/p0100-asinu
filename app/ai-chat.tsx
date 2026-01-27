import { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { AiChatLayout, ChatBubble } from '../src/components/AiChatLayout';
import { chatApi } from '../src/features/chat/chat.api';
import { colors } from '../src/styles';
import { navigation } from '../src/lib/navigation';

const initialMessages: ChatBubble[] = [
  {
    id: '1',
    role: 'assistant',
    text: 'Xin chào, Asinu nè. Bạn cần hỗ trợ gì?',
    timestamp: new Date().toISOString()
  },
  { id: '2', role: 'user', text: 'Tôi muốn theo dõi sức khỏe hằng ngày.', timestamp: new Date().toISOString() }
];

const isUnauthorized = (error: unknown) => {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('401') || message.toLowerCase().includes('missing token');
};

export default function AiChatScreen() {
  const [messages, setMessages] = useState<ChatBubble[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const avatars = useMemo(
    () => ({
      assistant: 'https://placekitten.com/200/200',
      user: 'https://placekitten.com/201/201'
    }),
    []
  );

  const handleSend = async (text: string) => {
    const userMessage: ChatBubble = {
      id: `local-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);
    try {
      const { reply } = await chatApi.sendMessage({ message: text, context: { lang: 'vi' } });
      const assistantText = reply || 'Xin lỗi, tôi chưa thể trả lời lúc này.';
      const assistantMessage: ChatBubble = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: assistantText,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      if (isUnauthorized(error)) {
        navigation.goToLogin();
        setIsTyping(false);
        return;
      }
      const assistantMessage: ChatBubble = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: 'Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AiChatLayout
        messages={messages}
        assistantAvatar={avatars.assistant}
        userAvatar={avatars.user}
        isTyping={isTyping}
        onSend={handleSend}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  }
});
