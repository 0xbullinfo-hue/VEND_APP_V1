import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderRole: 'vendor' | 'customer';
  content: string;
  timestamp: number;
  isRead: boolean;
  deliveryStatus: 'sent' | 'delivered' | 'failed';
  messageType: 'text' | 'image' | 'voice';
  metadata?: {
    imageUrl?: string;
    voiceUrl?: string;
    duration?: number;
  };
}

export interface Conversation {
  conversationId: string;
  vendorId: string;
  customerId: string;
  lastMessage: string;
  lastMessageAt: number;
  isActive: boolean;
  unreadCount: number;
  participantNames: {
    vendor: string;
    customer: string;
  };
}

export interface ChatAnalytics {
  conversationId: string;
  messageCount: number;
  avgResponseTime: number;
  engagementScore: number;
  lastActivityAt: number;
  customerEngagementLevel: 'high' | 'medium' | 'low';
  vendorResponseRate: number;
}

export interface ChatStats {
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  totalUnreadMessages: number;
  averageResponseTime: number;
  engagementTrend: 'increasing' | 'stable' | 'declining';
  topEngagedConversation: string | null;
}

interface ChatsStore {
  messages: Map<string, ChatMessage[]>;
  conversations: Map<string, Conversation>;
  typingIndicators: Map<string, { userId: string; timestamp: number }>;
  chatAnalytics: Map<string, ChatAnalytics>;

  // Message operations
  createMessage(
    conversationId: string,
    senderId: string,
    senderRole: 'vendor' | 'customer',
    content: string,
    messageType?: 'text' | 'image' | 'voice',
    metadata?: ChatMessage['metadata']
  ): ChatMessage;
  getMessages(conversationId: string): ChatMessage[];
  markMessageAsRead(messageId: string, conversationId: string): void;
  searchMessages(conversationId: string, query: string): ChatMessage[];

  // Conversation operations
  createConversation(
    vendorId: string,
    customerId: string,
    vendorName: string,
    customerName: string
  ): Conversation;
  getConversation(conversationId: string): Conversation | undefined;
  getConversations(userId: string): Conversation[];
  updateConversationLastMessage(
    conversationId: string,
    message: string,
    timestamp: number
  ): void;
  getUnreadCount(conversationId: string): number;

  // Analytics operations
  calculateChatAnalytics(conversationId: string): ChatAnalytics;
  getChatStats(): ChatStats;
  generateChatInsights(): string[];

  // Typing indicators
  setTypingIndicator(conversationId: string, userId: string): void;
  removeTypingIndicator(conversationId: string): void;
  getTypingIndicator(conversationId: string): { userId: string; timestamp: number } | null;
}

export const useChatsStore = create<ChatsStore>()(
  persist(
    (set, get) => ({
      messages: new Map(),
      conversations: new Map(),
      typingIndicators: new Map(),
      chatAnalytics: new Map(),

      createMessage: (
        conversationId,
        senderId,
        senderRole,
        content,
        messageType = 'text',
        metadata
      ) => {
        const messageId = uuidv4();
        const timestamp = Date.now();
        const newMessage: ChatMessage = {
          messageId,
          conversationId,
          senderId,
          senderRole,
          content,
          timestamp,
          isRead: false,
          deliveryStatus: 'delivered',
          messageType,
          metadata,
        };

        set((state) => {
          const convMessages = state.messages.get(conversationId) || [];
          const updatedMessages = new Map(state.messages);
          updatedMessages.set(conversationId, [...convMessages, newMessage]);
          return { messages: updatedMessages };
        });

        // Update conversation last message
        const conversation = get().conversations.get(conversationId);
        if (conversation) {
          get().updateConversationLastMessage(conversationId, content, timestamp);
        }

        return newMessage;
      },

      getMessages: (conversationId) => {
        const state = get();
        return state.messages.get(conversationId) || [];
      },

      markMessageAsRead: (messageId, conversationId) => {
        set((state) => {
          const convMessages = state.messages.get(conversationId) || [];
          const updatedMessages = convMessages.map((msg) =>
            msg.messageId === messageId ? { ...msg, isRead: true } : msg
          );
          const newMessagesMap = new Map(state.messages);
          newMessagesMap.set(conversationId, updatedMessages);

          // Update conversation unread count
          const conversation = state.conversations.get(conversationId);
          const unreadCount = updatedMessages.filter((msg) => !msg.isRead).length;
          const updatedConversation = conversation
            ? { ...conversation, unreadCount }
            : null;
          const newConversationsMap = new Map(state.conversations);
          if (updatedConversation) {
            newConversationsMap.set(conversationId, updatedConversation);
          }

          return {
            messages: newMessagesMap,
            conversations: newConversationsMap,
          };
        });
      },

      searchMessages: (conversationId, query) => {
        const state = get();
        const messages = state.messages.get(conversationId) || [];
        const lowerQuery = query.toLowerCase();
        return messages.filter((msg) =>
          msg.content.toLowerCase().includes(lowerQuery)
        );
      },

      createConversation: (vendorId, customerId, vendorName, customerName) => {
        const conversationId = uuidv4();
        const newConversation: Conversation = {
          conversationId,
          vendorId,
          customerId,
          lastMessage: '',
          lastMessageAt: Date.now(),
          isActive: true,
          unreadCount: 0,
          participantNames: {
            vendor: vendorName,
            customer: customerName,
          },
        };

        set((state) => {
          const newConversationsMap = new Map(state.conversations);
          newConversationsMap.set(conversationId, newConversation);
          return { conversations: newConversationsMap };
        });

        return newConversation;
      },

      getConversation: (conversationId) => {
        return get().conversations.get(conversationId);
      },

      getConversations: (userId) => {
        const state = get();
        const conversations: Conversation[] = [];
        state.conversations.forEach((conv) => {
          if (conv.vendorId === userId || conv.customerId === userId) {
            conversations.push(conv);
          }
        });
        return conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      },

      updateConversationLastMessage: (conversationId, message, timestamp) => {
        set((state) => {
          const conversation = state.conversations.get(conversationId);
          if (conversation) {
            const updatedConversation = {
              ...conversation,
              lastMessage: message,
              lastMessageAt: timestamp,
            };
            const newConversationsMap = new Map(state.conversations);
            newConversationsMap.set(conversationId, updatedConversation);
            return { conversations: newConversationsMap };
          }
          return state;
        });
      },

      getUnreadCount: (conversationId) => {
        const state = get();
        const messages = state.messages.get(conversationId) || [];
        return messages.filter((msg) => !msg.isRead).length;
      },

      calculateChatAnalytics: (conversationId) => {
        const state = get();
        const messages = state.messages.get(conversationId) || [];
        const conversation = state.conversations.get(conversationId);

        const messageCount = messages.length;
        let totalResponseTime = 0;
        let responseCount = 0;

        // Calculate response time between messages
        for (let i = 1; i < messages.length; i++) {
          if (messages[i].senderRole !== messages[i - 1].senderRole) {
            const responseTime = messages[i].timestamp - messages[i - 1].timestamp;
            totalResponseTime += responseTime;
            responseCount++;
          }
        }

        const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

        // Calculate engagement score (0-100)
        const messageFrequency = Math.min(messageCount / 100, 1) * 40; // Max 40
        const responseRate =
          responseCount > 0
            ? Math.min(responseCount / messageCount, 1) * 30
            : 0; // Max 30
        const recentActivity =
          conversation && Date.now() - conversation.lastMessageAt < 86400000
            ? 30
            : 0; // Max 30 if active in last 24h
        const engagementScore = Math.round(
          messageFrequency + responseRate + recentActivity
        );

        const customerEngagementLevel =
          engagementScore >= 70 ? 'high' : engagementScore >= 40 ? 'medium' : 'low';

        const vendorResponseRate =
          responseCount > 0
            ? (messages.filter((msg) => msg.senderRole === 'vendor').length /
                messageCount) *
              100
            : 0;

        const analytics: ChatAnalytics = {
          conversationId,
          messageCount,
          avgResponseTime,
          engagementScore,
          lastActivityAt: conversation?.lastMessageAt || 0,
          customerEngagementLevel,
          vendorResponseRate,
        };

        set((state) => {
          const newAnalyticsMap = new Map(state.chatAnalytics);
          newAnalyticsMap.set(conversationId, analytics);
          return { chatAnalytics: newAnalyticsMap };
        });

        return analytics;
      },

      getChatStats: () => {
        const state = get();
        const conversations = Array.from(state.conversations.values());
        const totalConversations = conversations.length;

        let totalMessages = 0;
        let totalUnreadMessages = 0;
        let totalResponseTime = 0;
        let responseCount = 0;
        let topEngagementScore = 0;
        let topEngagedConversation: string | null = null;

        state.messages.forEach((messages, conversationId) => {
          totalMessages += messages.length;
          totalUnreadMessages += messages.filter((msg) => !msg.isRead).length;

          for (let i = 1; i < messages.length; i++) {
            if (messages[i].senderRole !== messages[i - 1].senderRole) {
              const responseTime = messages[i].timestamp - messages[i - 1].timestamp;
              totalResponseTime += responseTime;
              responseCount++;
            }
          }

          // Find top engaged conversation
          const analytics = state.chatAnalytics.get(conversationId);
          if (analytics && analytics.engagementScore > topEngagementScore) {
            topEngagementScore = analytics.engagementScore;
            topEngagedConversation = conversationId;
          }
        });

        const avgMessagesPerConversation =
          totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0;
        const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

        // Determine engagement trend
        const recentConversations = conversations.filter(
          (c) => Date.now() - c.lastMessageAt < 604800000 // Last 7 days
        ).length;
        const engagementTrend =
          recentConversations > totalConversations * 0.7
            ? 'increasing'
            : recentConversations < totalConversations * 0.3
              ? 'declining'
              : 'stable';

        const stats: ChatStats = {
          totalConversations,
          totalMessages,
          avgMessagesPerConversation,
          totalUnreadMessages,
          averageResponseTime,
          engagementTrend,
          topEngagedConversation,
        };

        return stats;
      },

      generateChatInsights: () => {
        const state = get();
        const stats = get().getChatStats();
        const insights: string[] = [];

        if (stats.totalConversations === 0) {
          insights.push('No conversations yet. Start chatting to build engagement.');
          return insights;
        }

        // Insight 1: High engagement
        if (stats.engagementTrend === 'increasing') {
          insights.push(
            'Great momentum! Chat engagement is increasing. Keep responding promptly.'
          );
        }

        // Insight 2: Response time
        const avgResponseHours = stats.averageResponseTime / 3600000;
        if (avgResponseHours < 1) {
          insights.push('Fast responses! Your avg response time is under 1 hour.');
        } else if (avgResponseHours > 24) {
          insights.push(
            'Consider responding faster. Current avg is over 24 hours.'
          );
        }

        // Insight 3: Message volume
        if (stats.avgMessagesPerConversation > 50) {
          insights.push(
            'High conversation volume! Your average conversation has ' +
              stats.avgMessagesPerConversation +
              ' messages.'
          );
        } else if (stats.avgMessagesPerConversation < 5) {
          insights.push(
            'Low engagement. Try to deepen conversations with customers.'
          );
        }

        // Insight 4: Top engaged conversation
        if (stats.topEngagedConversation) {
          const topConv = state.conversations.get(stats.topEngagedConversation);
          if (topConv) {
            insights.push(
              `Top performer: Conversation with ${topConv.participantNames.customer} has highest engagement.`
            );
          }
        }

        // Insight 5: Unread messages
        if (stats.totalUnreadMessages > 0) {
          insights.push(
            `You have ${stats.totalUnreadMessages} unread messages. Check them out!`
          );
        }

        // Insight 6: Conversation health
        const activeConversations = Array.from(state.conversations.values()).filter(
          (c) => Date.now() - c.lastMessageAt < 86400000
        ).length;
        const activityRate = Math.round((activeConversations / stats.totalConversations) * 100);
        insights.push(
          `Activity status: ${activityRate}% of conversations active in last 24 hours.`
        );

        return insights;
      },

      setTypingIndicator: (conversationId, userId) => {
        set((state) => {
          const newIndicators = new Map(state.typingIndicators);
          newIndicators.set(conversationId, { userId, timestamp: Date.now() });
          return { typingIndicators: newIndicators };
        });
      },

      removeTypingIndicator: (conversationId) => {
        set((state) => {
          const newIndicators = new Map(state.typingIndicators);
          newIndicators.delete(conversationId);
          return { typingIndicators: newIndicators };
        });
      },

      getTypingIndicator: (conversationId) => {
        const state = get();
        const indicator = state.typingIndicators.get(conversationId);
        // Only return if timestamp is recent (within 3 seconds)
        if (indicator && Date.now() - indicator.timestamp < 3000) {
          return indicator;
        }
        return null;
      },
    }),
    {
      name: 'chats-storage',
      storage: {
        getItem: async (name) => {
          const item = await AsyncStorage.getItem(name);
          if (!item) return null;
          const parsed = JSON.parse(item);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              messages: new Map(parsed.state.messages),
              conversations: new Map(parsed.state.conversations),
              typingIndicators: new Map(parsed.state.typingIndicators),
              chatAnalytics: new Map(parsed.state.chatAnalytics),
            },
          };
        },
        setItem: async (name, value) => {
          const castValue = value as unknown as {
            state: {
              messages: Map<string, ChatMessage[]>;
              conversations: Map<string, Conversation>;
              typingIndicators: Map<string, { userId: string; timestamp: number }>;
              chatAnalytics: Map<string, ChatAnalytics>;
            };
          };
          await AsyncStorage.setItem(
            name,
            JSON.stringify({
              ...castValue,
              state: {
                ...castValue.state,
                messages: Array.from(castValue.state.messages.entries()),
                conversations: Array.from(castValue.state.conversations.entries()),
                typingIndicators: Array.from(
                  castValue.state.typingIndicators.entries()
                ),
                chatAnalytics: Array.from(castValue.state.chatAnalytics.entries()),
              },
            })
          );
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
