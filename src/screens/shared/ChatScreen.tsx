import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar } from '../../components/SharedComponents';
import { useApp } from '../../contexts/AppContext';
import { Ionicons } from '../../components/VIcons';

interface ChatScreenProps {
  recipientId: string; // vendorId or customerId
  onBack: () => void;
  onNavigateToDirections?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  recipientId,
  onBack,
  onNavigateToDirections
}) => {
  const { vendors, addPoints } = useApp();
  
  // Resolve recipient details
  const vendor = vendors.find(v => v.id === recipientId) || vendors[0];

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: 'me' | 'them'; time: string }>>([
    { id: '1', text: `Hello! Thanks for reaching out to ${vendor.business_name}. How can we help you today?`, sender: 'them', time: '10:02 AM' },
    { id: '2', text: 'Hi! I want to confirm if you are open today and if you have the Senator Attire designs available?', sender: 'me', time: '10:05 AM' },
    { id: '3', text: 'Yes, we are open! We have several materials and colors in stock. You can request directions using the top bar to visit our shop.', sender: 'them', time: '10:06 AM' }
  ]);

  const scrollViewRef = useRef<ScrollView>(null);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMsg = {
      id: Math.random().toString(36).substring(2, 11),
      text: message.trim(),
      sender: 'me' as const,
      time: '10:08 AM'
    };
    
    setMessages(prev => [...prev, newMsg]);
    setMessage('');
    addPoints(1); // Reward small point for messaging interaction

    // Trigger mock response after a delay
    setTimeout(() => {
      const mockResponse = {
        id: Math.random().toString(36).substring(2, 11),
        text: "Perfect! We're ready for you. Let us know when you request directions.",
        sender: 'them' as const,
        time: '10:09 AM'
      };
      setMessages(prev => [...prev, mockResponse]);
      addPoints(1);
    }, 1500);
  };

  useEffect(() => {
    // Scroll to bottom upon receiving or sending messages
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View style={styles.container}>
      <HeaderBar 
        showBack={true} 
        onBack={onBack} 
        title={vendor.business_name} 
        rightComponent={
          onNavigateToDirections ? (
            <TouchableOpacity onPress={onNavigateToDirections} style={styles.headerRouteBtn}>
              <Ionicons name="navigate-circle" size={normalize(22)} color={theme.colors.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Chat message stream */}
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.messageScroll}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isMe = msg.sender === 'me';
            return (
              <View 
                key={msg.id} 
                style={[
                  styles.messageRow,
                  isMe ? styles.rowMe : styles.rowThem
                ]}
              >
                <View style={[
                  styles.bubble,
                  isMe ? styles.bubbleMe : styles.bubbleThem
                ]}>
                  <VText 
                    variant="body" 
                    color={isMe ? theme.colors.background : theme.colors.textMain}
                  >
                    {msg.text}
                  </VText>
                  
                  <VText 
                    variant="caption" 
                    align={isMe ? 'right' : 'left'}
                    color={isMe ? 'rgba(255,255,255,0.7)' : theme.colors.textMuted}
                    style={styles.timeText}
                  >
                    {msg.time}
                  </VText>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Messaging Text Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            placeholder="Type your message here..."
            placeholderTextColor={theme.colors.textMuted}
            value={message}
            onChangeText={setMessage}
            style={[styles.chatInput, { fontFamily: theme.typography.fontSans }]}
          />
          
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleSendMessage}
            style={styles.sendBtn}
          >
            <Ionicons name="send" size={16} color={theme.colors.background} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerRouteBtn: {
    padding: 4,
  },
  messageScroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  rowThem: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    borderRadius: normalize(16),
  },
  bubbleMe: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  timeText: {
    fontSize: 9,
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  chatInput: {
    flex: 1,
    height: normalize(40),
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    fontSize: normalize(13),
    color: theme.colors.textMain,
  },
  sendBtn: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(18),
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
});
