import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const GOLD = '#c9a84c';
const GOLD_LIGHT = '#f0d07a';
const BG = '#080f08';
const CARD_BG = '#111a11';
const BORDER = 'rgba(201,168,76,0.2)';

const stats = [
  { icon: '🏠', label: 'Total Properties', value: '24', change: '+2 this week', color: '#c9a84c' },
  { icon: '📋', label: 'Active Listings', value: '18', change: '75% active', color: '#4caf8c' },
  { icon: '🔔', label: 'New Enquiries', value: '7', change: '+3 today', color: '#e07c4c' },
  { icon: '👥', label: 'Total Users', value: '142', change: '+12 this month', color: '#7c8ce0' },
];

const quickActions = [
  { icon: '➕', label: 'Add\nProperty', bg: '#1a2a1a' },
  { icon: '📨', label: 'Enquiries', bg: '#1a1a2a' },
  { icon: '👤', label: 'Users', bg: '#2a1a1a' },
  { icon: '📊', label: 'Reports', bg: '#1a2a2a' },
];

const recentActivity = [
  { icon: '🏡', title: 'New property added', sub: 'Plot #47 - Coimbatore', time: '2 hrs ago', dot: '#4caf8c' },
  { icon: '📩', title: 'New enquiry received', sub: 'Ramesh Kumar • 9876543210', time: '4 hrs ago', dot: '#e07c4c' },
  { icon: '👤', title: 'New user registered', sub: 'Priya Lakshmi', time: '6 hrs ago', dot: '#7c8ce0' },
  { icon: '✅', title: 'Property marked sold', sub: 'Plot #32 - Salem', time: 'Yesterday', dot: GOLD },
  { icon: '📩', title: 'New enquiry received', sub: 'Karthik R • 8765432109', time: 'Yesterday', dot: '#e07c4c' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Home');

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.adminName}>Admin 👋</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notifBtn}>
            <Text style={styles.notifIcon}>🔔</Text>
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}>

        {/* Gold separator line */}
        <View style={styles.goldLine} />

        {/* Stats Section */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={[styles.statCard, { borderTopColor: stat.color }]}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statChange}>{stat.change}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          {quickActions.map((action, i) => (
            <TouchableOpacity key={i} style={[styles.actionBtn, { backgroundColor: action.bg }]} activeOpacity={0.75}>
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Properties Summary Banner */}
        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerTitle}>Tamizha Properties</Text>
            <Text style={styles.bannerSub}>Admin Control Centre</Text>
            <TouchableOpacity style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>View All Properties →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bannerEmoji}>🏘️</Text>
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {recentActivity.map((item, i) => (
            <View key={i}>
              <View style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: item.dot }]} />
                <Text style={styles.activityIcon}>{item.icon}</Text>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activitySub}>{item.sub}</Text>
                </View>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
              {i < recentActivity.length - 1 && <View style={styles.activityDivider} />}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {[{ icon: '🏠', label: 'Home' }, { icon: '🏘️', label: 'Properties' }, { icon: '📨', label: 'Enquiries' }, { icon: '👥', label: 'Users' }, { icon: '⚙️', label: 'Settings' }].map((tab) => (
          <TouchableOpacity
            key={tab.label}
            style={styles.navItem}
            onPress={() => setActiveTab(tab.label)}
            activeOpacity={0.7}>
            <Text style={[styles.navIcon, activeTab === tab.label && { fontSize: 22 }]}>
              {tab.icon}
            </Text>
            <Text style={[styles.navLabel, activeTab === tab.label && styles.navLabelActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.label && <View style={styles.navActiveDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  greeting: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '400',
  },
  adminName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifIcon: { fontSize: 18 },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e07c4c',
    borderWidth: 1.5,
    borderColor: CARD_BG,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GOLD_LIGHT,
  },
  avatarText: {
    color: '#1a0e00',
    fontSize: 16,
    fontWeight: '800',
  },
  scroll: { flex: 1 },
  goldLine: {
    height: 2,
    backgroundColor: GOLD,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 1,
    opacity: 0.6,
  },
  sectionTitle: {
    color: GOLD,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderTopWidth: 3,
  },
  statIcon: { fontSize: 24, marginBottom: 10 },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  statChange: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  actionIcon: { fontSize: 22, marginBottom: 6 },
  actionLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#1a2610',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
  },
  bannerTitle: {
    color: GOLD_LIGHT,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    marginTop: 3,
    marginBottom: 14,
  },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  bannerBtnText: {
    color: '#1a0e00',
    fontSize: 12,
    fontWeight: '700',
  },
  bannerEmoji: { fontSize: 50 },
  activityCard: {
    marginHorizontal: 16,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityIcon: { fontSize: 20 },
  activityInfo: { flex: 1 },
  activityTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  activitySub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginTop: 2,
  },
  activityTime: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
  },
  activityDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 14,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingBottom: 20,
    paddingTop: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  navIcon: { fontSize: 20 },
  navLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '500',
  },
  navLabelActive: {
    color: GOLD,
    fontWeight: '700',
  },
  navActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GOLD,
    marginTop: 1,
  },
});
