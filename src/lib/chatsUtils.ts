import { ChatMessage, Conversation, ChatAnalytics } from '../store/useChatsStore';

export interface ConversationEngagement {
  conversationId: string;
  participantName: string;
  engagementScore: number;
  engagementLevel: 'high' | 'medium' | 'low';
  messageCount: number;
  avgResponseTime: number;
  lastActivity: string;
}

export interface SearchResult {
  messageId: string;
  conversationId: string;
  content: string;
  senderRole: 'vendor' | 'customer';
  timestamp: number;
  context: string; // Message before and after for context
}

export interface ChatInsight {
  type: string;
  title: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface ChatPerformanceMetrics {
  totalChats: number;
  avgResponseTime: number;
  customerSatisfactionScore: number;
  messageCompletionRate: number;
  peakActivityTime: string;
  peakActivityDay: string;
}

/**
 * Calculate engagement level for a single conversation
 */
export function calculateConversationEngagement(
  messages: ChatMessage[],
  conversation: Conversation
): ConversationEngagement {
  const messageCount = messages.length;
  let totalResponseTime = 0;
  let responseCount = 0;

  // Calculate average response time
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].senderRole !== messages[i - 1].senderRole) {
      const responseTime = messages[i].timestamp - messages[i - 1].timestamp;
      totalResponseTime += responseTime;
      responseCount++;
    }
  }

  const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

  // Engagement score: message frequency (0-40) + response consistency (0-30) + recency (0-30)
  const frequencyScore = Math.min(messageCount / 10, 1) * 40;
  const consistencyScore =
    responseCount > 0 ? Math.min(responseCount / messageCount, 1) * 30 : 0;
  const recencyScore =
    Date.now() - conversation.lastMessageAt < 604800000 ? 30 : 0; // 7 days
  const engagementScore = Math.round(frequencyScore + consistencyScore + recencyScore);

  const engagementLevel =
    engagementScore >= 70 ? 'high' : engagementScore >= 40 ? 'medium' : 'low';

  const lastActivityMinutes = Math.floor(
    (Date.now() - conversation.lastMessageAt) / 60000
  );
  let lastActivity: string;
  if (lastActivityMinutes < 1) {
    lastActivity = 'just now';
  } else if (lastActivityMinutes < 60) {
    lastActivity = `${lastActivityMinutes}m ago`;
  } else if (lastActivityMinutes < 1440) {
    lastActivity = `${Math.floor(lastActivityMinutes / 60)}h ago`;
  } else {
    lastActivity = `${Math.floor(lastActivityMinutes / 1440)}d ago`;
  }

  return {
    conversationId: conversation.conversationId,
    participantName: conversation.participantNames.customer,
    engagementScore,
    engagementLevel,
    messageCount,
    avgResponseTime,
    lastActivity,
  };
}

/**
 * Analyze response time patterns
 */
export function analyzeResponseTime(messages: ChatMessage[]): {
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  trend: 'improving' | 'declining' | 'stable';
} {
  const responseTimes: number[] = [];

  for (let i = 1; i < messages.length; i++) {
    if (messages[i].senderRole !== messages[i - 1].senderRole) {
      const responseTime = messages[i].timestamp - messages[i - 1].timestamp;
      responseTimes.push(responseTime);
    }
  }

  if (responseTimes.length === 0) {
    return {
      avgResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      trend: 'stable',
    };
  }

  const avgResponseTime =
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);

  // Determine trend: compare first half vs second half
  const midpoint = Math.floor(responseTimes.length / 2);
  const firstHalfAvg =
    responseTimes.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
  const secondHalfAvg =
    responseTimes.slice(midpoint).reduce((a, b) => a + b, 0) /
    (responseTimes.length - midpoint);

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (secondHalfAvg < firstHalfAvg * 0.9) {
    trend = 'improving';
  } else if (secondHalfAvg > firstHalfAvg * 1.1) {
    trend = 'declining';
  }

  return { avgResponseTime, minResponseTime, maxResponseTime, trend };
}

/**
 * Generate typing indicator display
 */
export function generateTypingIndicator(userName: string): string {
  const animations = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const animation = animations[Math.floor(Math.random() * animations.length)];
  return `${userName} ${animation} typing...`;
}

/**
 * Search and format message results
 */
export function searchAndFormatMessages(
  messages: ChatMessage[],
  query: string,
  contextLines: number = 1
): SearchResult[] {
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  messages.forEach((msg, index) => {
    if (msg.content.toLowerCase().includes(lowerQuery)) {
      // Build context: include messages before and after
      let contextBefore = '';
      let contextAfter = '';

      for (let i = Math.max(0, index - contextLines); i < index; i++) {
        contextBefore += `${messages[i].senderRole}: ${messages[i].content}\n`;
      }

      for (let i = index + 1; i < Math.min(messages.length, index + contextLines + 1); i++) {
        contextAfter += `${messages[i].senderRole}: ${messages[i].content}\n`;
      }

      results.push({
        messageId: msg.messageId,
        conversationId: msg.conversationId,
        content: msg.content,
        senderRole: msg.senderRole,
        timestamp: msg.timestamp,
        context: `${contextBefore}[MATCHED] ${msg.content}\n${contextAfter}`,
      });
    }
  });

  return results.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Detect suspicious patterns (spam, harassment, etc)
 */
export function detectMessagePatterns(messages: ChatMessage[]): {
  hasSpamPattern: boolean;
  spamScore: number;
  recommendations: string[];
} {
  let spamScore = 0;
  const recommendations: string[] = [];

  if (messages.length === 0) {
    return { hasSpamPattern: false, spamScore: 0, recommendations };
  }

  // Check for rapid consecutive messages from same sender
  let consecutiveCount = 0;
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].senderRole === messages[i - 1].senderRole) {
      consecutiveCount++;
    } else {
      consecutiveCount = 0;
    }
    if (consecutiveCount >= 5) {
      spamScore += 20;
      recommendations.push('Multiple consecutive messages detected');
    }
  }

  // Check for very short messages in high volume
  const shortMessages = messages.filter((msg) => msg.content.length < 5).length;
  if (shortMessages > messages.length * 0.5) {
    spamScore += 15;
    recommendations.push('High volume of very short messages');
  }

  // Check for messages with mostly special characters
  const specialCharMessages = messages.filter(
    (msg) => (msg.content.match(/[!@#$%^&*]/g) || []).length > msg.content.length * 0.3
  ).length;
  if (specialCharMessages > messages.length * 0.2) {
    spamScore += 25;
    recommendations.push('Messages contain excessive special characters');
  }

  // Check for time pattern (unusual hours)
  const lateNightMessages = messages.filter((msg) => {
    const hour = new Date(msg.timestamp).getHours();
    return hour >= 0 && hour <= 5;
  }).length;
  if (lateNightMessages > messages.length * 0.4) {
    spamScore += 10;
    recommendations.push('Unusual activity pattern detected (late night)');
  }

  const hasSpamPattern = spamScore >= 50;

  return { hasSpamPattern, spamScore: Math.min(spamScore, 100), recommendations };
}

/**
 * Calculate chat performance metrics for aggregate analytics
 */
export function calculateChatPerformanceMetrics(
  messages: ChatMessage[],
  conversations: Conversation[]
): ChatPerformanceMetrics {
  if (messages.length === 0) {
    return {
      totalChats: 0,
      avgResponseTime: 0,
      customerSatisfactionScore: 0,
      messageCompletionRate: 0,
      peakActivityTime: 'N/A',
      peakActivityDay: 'N/A',
    };
  }

  // Calculate response time
  let totalResponseTime = 0;
  let responseCount = 0;
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].senderRole !== messages[i - 1].senderRole) {
      totalResponseTime += messages[i].timestamp - messages[i - 1].timestamp;
      responseCount++;
    }
  }
  const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

  // Calculate message completion rate (delivered / sent)
  const deliveredCount = messages.filter((m) => m.deliveryStatus === 'delivered').length;
  const messageCompletionRate = (deliveredCount / messages.length) * 100;

  // Customer satisfaction (based on engagement patterns)
  const satisfactionBase =
    messages.filter((m) => m.senderRole === 'customer').length > 0
      ? 75
      : 50;
  const customerSatisfactionScore = Math.min(
    satisfactionBase + (responseCount > 0 ? 15 : 0),
    100
  );

  // Find peak activity time
  const hourlyActivity: { [key: number]: number } = {};
  messages.forEach((msg) => {
    const hour = new Date(msg.timestamp).getHours();
    hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
  });
  const peakHour = Object.keys(hourlyActivity).reduce((a, b) =>
    hourlyActivity[Number(a)] > hourlyActivity[Number(b)] ? a : b
  );
  const peakActivityTime = `${peakHour}:00 - ${parseInt(peakHour) + 1}:00`;

  // Find peak activity day
  const dailyActivity: { [key: number]: number } = {};
  messages.forEach((msg) => {
    const day = new Date(msg.timestamp).getDay();
    dailyActivity[day] = (dailyActivity[day] || 0) + 1;
  });
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const peakDay = Object.keys(dailyActivity).reduce((a, b) =>
    dailyActivity[Number(a)] > dailyActivity[Number(b)] ? a : b
  );
  const peakActivityDay = days[Number(peakDay)];

  return {
    totalChats: conversations.length,
    avgResponseTime,
    customerSatisfactionScore: Math.round(customerSatisfactionScore),
    messageCompletionRate: Math.round(messageCompletionRate),
    peakActivityTime,
    peakActivityDay,
  };
}

/**
 * Generate actionable chat insights
 */
export function generateChatInsights(
  messages: ChatMessage[],
  conversations: Conversation[]
): ChatInsight[] {
  const insights: ChatInsight[] = [];

  if (messages.length === 0) {
    insights.push({
      type: 'engagement',
      title: 'No Conversations Yet',
      description: 'Start chatting with customers to build engagement.',
      actionable: true,
      priority: 'medium',
    });
    return insights;
  }

  // Response time insights
  const responseAnalysis = analyzeResponseTime(messages);
  if (responseAnalysis.avgResponseTime > 86400000) {
    // Over 24 hours
    insights.push({
      type: 'performance',
      title: 'Slow Response Time',
      description: `Your average response time is ${Math.round(
        responseAnalysis.avgResponseTime / 3600000
      )} hours. Faster responses improve customer satisfaction.`,
      actionable: true,
      priority: 'high',
    });
  } else if (responseAnalysis.avgResponseTime < 600000) {
    // Under 10 minutes
    insights.push({
      type: 'performance',
      title: 'Excellent Response Time',
      description:
        'Your quick responses are impressive and likely increase customer satisfaction.',
      actionable: false,
      priority: 'low',
    });
  }

  // Engagement trend
  const recentMessages = messages.filter(
    (m) => Date.now() - m.timestamp < 604800000
  ).length;
  const engagementRatio = recentMessages / messages.length;
  if (engagementRatio > 0.7) {
    insights.push({
      type: 'engagement',
      title: 'High Recent Activity',
      description: `${Math.round(engagementRatio * 100)}% of messages are from the last 7 days.`,
      actionable: false,
      priority: 'low',
    });
  } else if (engagementRatio < 0.1) {
    insights.push({
      type: 'engagement',
      title: 'Low Recent Engagement',
      description: 'Most conversations are inactive. Try re-engaging with customers.',
      actionable: true,
      priority: 'medium',
    });
  }

  // Pattern detection
  const patterns = detectMessagePatterns(messages);
  if (patterns.hasSpamPattern) {
    insights.push({
      type: 'safety',
      title: 'Unusual Message Pattern',
      description: `Pattern detected: ${patterns.recommendations.join(', ')}`,
      actionable: true,
      priority: 'high',
    });
  }

  // Conversation health
  if (conversations.length > 0) {
    const avgMessagesPerConv = Math.round(messages.length / conversations.length);
    if (avgMessagesPerConv > 100) {
      insights.push({
        type: 'engagement',
        title: 'Deep Conversations',
        description: `Your conversations average ${avgMessagesPerConv} messages, indicating strong customer relationships.`,
        actionable: false,
        priority: 'low',
      });
    } else if (avgMessagesPerConv < 5) {
      insights.push({
        type: 'engagement',
        title: 'Shallow Conversations',
        description:
          'Conversations are brief. Try asking follow-up questions to deepen engagement.',
        actionable: true,
        priority: 'medium',
      });
    }
  }

  // Failed delivery
  const failedDelivery = messages.filter((m) => m.deliveryStatus === 'failed').length;
  if (failedDelivery > messages.length * 0.1) {
    insights.push({
      type: 'technical',
      title: 'High Delivery Failures',
      description: `${Math.round(
        (failedDelivery / messages.length) * 100
      )}% of messages failed to deliver. Check your connection.`,
      actionable: true,
      priority: 'high',
    });
  }

  return insights;
}
