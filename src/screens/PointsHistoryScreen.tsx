import React from 'react';
import { StyleSheet, View, SafeAreaView, FlatList } from 'react-native';
import { theme, normalize } from '../theme/designSystem';
import { VText, HeaderBar } from '../components/SharedComponents';
import { useApp } from '../contexts/AppContext';
import { Ionicons } from '@expo/vector-icons';

interface PointsHistoryScreenProps {
  onBack: () => void;
}

export const PointsHistoryScreen: React.FC<PointsHistoryScreenProps> = ({ onBack }) => {
  const { points } = useApp();

  // Mock Ledger Data
  const historyData = [
    {
      id: '1',
      title: 'Physical Visit Verified',
      desc: 'You visited "Mama Nkechi Kitchen"',
      amount: '+100',
      type: 'earn',
      date: 'Today, 2:30 PM',
      icon: 'checkmark-circle'
    },
    {
      id: '2',
      title: 'Referral Bonus',
      desc: 'Welcome bonus claimed',
      amount: '+50',
      type: 'earn',
      date: 'Today, 1:15 PM',
      icon: 'gift'
    },
    {
      id: '3',
      title: 'Store Boost Activation',
      desc: 'Redeemed points for 24hr visibility boost',
      amount: '-150',
      type: 'spend',
      date: 'Yesterday',
      icon: 'rocket'
    },
    {
      id: '4',
      title: 'Explored Vendor',
      desc: 'Viewed 5 local profiles',
      amount: '+10',
      type: 'earn',
      date: '2 Days ago',
      icon: 'eye'
    }
  ];

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.ledgerItem}>
      <View style={[styles.iconCircle, { backgroundColor: item.type === 'earn' ? theme.colors.primaryLight : '#FFE8E8' }]}>
        <Ionicons 
          name={item.icon} 
          size={20} 
          color={item.type === 'earn' ? theme.colors.primary : theme.colors.danger} 
        />
      </View>
      
      <View style={styles.itemContent}>
        <VText variant="h3">{item.title}</VText>
        <VText variant="caption" color={theme.colors.textMuted}>{item.desc}</VText>
        <VText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 4, fontSize: 10 }}>{item.date}</VText>
      </View>
      
      <View style={styles.itemRight}>
        <VText 
          variant="h2" 
          color={item.type === 'earn' ? theme.colors.primary : theme.colors.danger}
        >
          {item.amount}
        </VText>
        <VText variant="caption" color={theme.colors.textMuted}>PTS</VText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar 
        title="Points Ledger" 
        showBack 
        onBack={onBack} 
        showPoints={false} 
      />

      <View style={styles.balanceCard}>
        <VText variant="body" color={theme.colors.textMuted}>Total Balance</VText>
        <VText variant="h1" color={theme.colors.primary} style={styles.balanceBig}>
          {points} <VText variant="h3" color={theme.colors.primary}>PTS</VText>
        </VText>
      </View>

      <View style={styles.listHeader}>
        <VText variant="h3">Transaction History</VText>
      </View>

      <FlatList
        data={historyData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  balanceCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: normalize(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  balanceBig: {
    fontSize: normalize(48),
    marginTop: 8,
  },
  listHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  ledgerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 60,
  }
});
