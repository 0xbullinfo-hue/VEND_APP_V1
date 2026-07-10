import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList,
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { theme, normalize } from '../../theme/designSystem';
import { VText, HeaderBar, VendorProfilePendingState } from '../../components/SharedComponents';
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
  const { vendors, addPoints, user } = useApp();
  
  // Resolve recipient details
  // If user is a vendor and opening 'general', they are viewing their lead list
  const isVendorViewingLeads = user?.role === 'vendor' && recipientId === 'general';
  const vendor = vendors.find(v => v.id === recipientId);

  if (!vendor && !isVendorViewingLeads) {
    return <VendorProfilePendingState title="Chat Unavailable" onBack={onBack} />;
  }

  const [message, setMessage] = useState('');
  // For 'general' leads, we show a mock list or a single lead for now
  const chatTitle = isVendorViewingLeads ? 'My Inquiries' : (vendor?.business_name || 'Chat');
  const initialMessages = isVendorViewingLeads
    ? [{ id: '1', text: "New lead! Adeolu O. is interested in your services in Yaba.", sender: 'them' as const, time: '10:02 AM' }]
    : [{ id: '1', text: `Hello! Thanks for reaching out to ${vendor?.business_name}. How can we help you today?`, sender: 'them' as const, time: '10:02 AM' }];

  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: 'me' | 'them'; time: string }>>(initialMessages);

  const faqs = isVendorViewingLeads ? [] : [
    { q: 'Are you open today?', a: vendor?.is_open ? 'Yes, we are open and ready to serve you!' : 'We are currently closed, but we typically open at 9 AM.' },
    { q: 'Where are you located?', a: `Our shop is located at ${vendor?.street_address}. You can request directions via the map!` },
    { q: 'What services do you offer?', a: `We offer various services in the ${vendor?.category} category. Check our profile for the full list!` },
  ];

  const handleSendMessage = (text?: string) => {
    const messageToSend = text || message;
    if (!messageToSend.trim()) return;
    
    const newMsg = {
      id: Math.random().toString(36).substring(2, 11),
      text: messageToSend.trim(),
      sender: 'me' as const,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [newMsg, ...prev]);
    if (!text) setMessage('');
    addPoints(1);

    // Handle FAQ responses
    const faqMatch = faqs.find(f => f.q === messageToSend);

    setTimeout(() => {
      const responseText = faqMatch
        ? faqMatch.a
        : !vendor.is_open
          ? `Thanks for your message! ${vendor.business_name} is currently away, but they'll get back to you as soon as they're back online.`
          : "Perfect! We're ready for you. Let us know when you request directions.";

      const mockResponse = {
        id: Math.random().toString(36).substring(2, 11),
        text: responseText,
        sender: 'them' as const,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [mockResponse, ...prev]);
      addPoints(1);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <HeaderBar 
        showBack={true} 
        onBack={onBack} 
        title={chatTitle}
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
        {/* Chat message stream using FlatList for virtualization */}
        <FlatList
          data={[...messages].reverse()}
          keyExtractor={item => item.id}
          inverted
          renderItem={({ item: msg }) => {
            const isMe = msg.sender === 'me';
            return (
              <View 
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
          }}
          contentContainerStyle={styles.messageScroll}
          showsVerticalScrollIndicator={false}
        />

        {/* FAQ Quick Buttons */}
        {messages.length < 5 && (
          <View style={styles.faqContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.faqScroll}>
              {faqs.map((f, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.faqBtn}
                  onPress={() => handleSendMessage(f.q)}
                >
                  <VText variant="caption" color={theme.colors.primary} style={{ fontWeight: '700' }}>
                    {f.q}
                  </VText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
            onPress={() => handleSendMessage()}
            style={styles.sendBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
  faqContainer: {
    paddingVertical: 10,
    backgroundColor: theme.colors.background,
  },
  faqScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
  },
  faqBtn: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(17, 92, 85, 0.1)',
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
