import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { api } from '../services/api';

const createUserAccount = async (email: string, password: string, name: string, phone: string): Promise<{ uid: string; note: string }> => {
  try {
    const result = await api.createUser({ name, email, phone, password, role: 'user' });
    return { uid: result.id, note: '✅ Login account created successfully.' };
  } catch (err: any) {
    if (err.message === 'EMAIL_EXISTS') {
      return { uid: '', note: '✅ Account already exists with this email.' };
    }
    throw err;
  }
};

const { width } = Dimensions.get('window');
const GOLD = '#C9A84C';

interface Message {
  id: string;
  text: string;
  sender: 'admin' | 'client';
  timestamp: any;
}

interface LeadChatScreenProps {
  navigation: any;
  route: {
    params: {
      lead: {
        id: string;
        name: string;
        phone: string;
        status: string;
        source: string;
        interest: string;
        timestamp: string;
        propertyName?: string;
        clientCity?: string;
        clientNative?: string;
        timeSpent?: number;
        userId?: string;
      };
    };
  };
  isDark?: boolean;
}

const QUICK_REPLIES = [
  { label: '📅 Schedule Visit', text: 'Hi, I would like to schedule a site visit for this property. Are you available this weekend?' },
  { label: '📄 Send Brochure', text: 'Here is the detailed brochure for this property. Please let me know if you have any questions!' },
  { label: '📍 Share Location', text: 'Here is the location of the site: https://maps.google.com/?q=Tirunelveli. Let me know when you plan to visit!' },
  { label: '💬 Follow Up', text: 'Hi, just checking in to see if you have any questions about this property?' },
];

const LeadChatScreen = ({ navigation, route, isDark = false }: LeadChatScreenProps) => {
  const { lead } = route.params;
  const leadId = lead.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [linkedProperty, setLinkedProperty] = useState<any>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isCreatingLogin, setIsCreatingLogin] = useState(false);
  const [loginAlertMsg, setLoginAlertMsg] = useState('');
  const [leadUserId, setLeadUserId] = useState(lead.userId || '');

  const scrollViewRef = useRef<ScrollView>(null);

  // 1. Fetch linked property details
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoadingProperty(true);
        const searchName = (lead.propertyName || lead.interest || '').toLowerCase().trim();
        if (!searchName) {
          setLoadingProperty(false);
          return;
        }

        const propsData = await api.getProperties();
        const matched = propsData.find((d: any) => {
          const pName = (d.title || d.name || '').toLowerCase().trim();
          return pName && (pName.includes(searchName) || searchName.includes(pName));
        });
        if (matched) setLinkedProperty(matched);
      } catch (error) {
        console.error('Error fetching linked property:', error);
      } finally {
        setLoadingProperty(false);
      }
    };

    fetchProperty();
  }, [lead.propertyName, lead.interest]);

  // Load and poll messages
  useEffect(() => {
    const loadMessages = () => {
      api.getMessages(leadId).then((data: any[]) => {
        setMessages(data.map(d => ({
          id: d.id,
          text: d.text,
          sender: d.sender,
          timestamp: d.created_at,
        })));
      }).catch(err => console.error('Messages load error:', err));
    };
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [leadId]);

  // 3. Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  const handleCall = () => {
    Linking.openURL(`tel:${lead.phone}`);
  };

  const handleWhatsApp = () => {
    Linking.openURL(`whatsapp://send?phone=${lead.phone}`);
  };

  const handleSendMessage = async (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    setInputText('');
    setIsSending(true);

    try {
      await api.sendMessage(leadId, textToSend.trim(), 'admin');
      const data = await api.getMessages(leadId);
      setMessages(data.map((d: any) => ({ id: d.id, text: d.text, sender: d.sender, timestamp: d.created_at })));
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', `Unable to send message: ${error.message || error}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickReply = (text: string) => {
    setInputText(text);
  };

  const handleDeleteAllMessages = () => {
    Alert.alert(
      'Delete All Messages',
      `Delete entire chat with ${lead.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const msgs = await api.getMessages(leadId);
              await Promise.all(msgs.map((m: any) => fetch(`${require('../config/api.config').API_BASE_URL}/leads/${leadId}/messages/${m.id}`, { method: 'DELETE' })));
              setMessages([]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete messages.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteMessage = (msg: Message) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setMessages(prev => prev.filter(m => m.id !== msg.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message.');
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'LD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    const s = String(status).toUpperCase();
    if (s === 'HOT') return '#EF4444';
    if (s === 'WARM') return GOLD;
    return '#60A5FA';
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Sending...';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Dynamic colors based on isDark
  const theme = {
    background: isDark ? '#0B0F19' : '#FFF',
    cardBg: isDark ? '#111827' : '#FFF',
    headerBg: isDark ? '#0B0F19' : '#FFF',
    text: isDark ? '#F9FAFB' : '#1E293B',
    subText: isDark ? '#9CA3AF' : '#64748B',
    border: isDark ? '#1F2937' : '#F1F5F9',
    headerBorder: isDark ? '#1F2937' : '#F1F5F9',
    iconBtnBg: isDark ? '#1F2937' : '#F1F5F9',
    iconBtnText: isDark ? '#F9FAFB' : '#1E293B',
    propertyBannerBg: isDark ? '#111827' : '#FFF',
    propertyCardBg: isDark ? '#1F2937' : '#FFF',
    chatContainerBg: isDark ? '#0B0F19' : '#F8FAFC',
    bubbleClientBg: isDark ? '#1F2937' : '#F1F5F9',
    bubbleClientText: isDark ? '#F9FAFB' : '#1E293B',
    bubbleAdminBg: GOLD,
    bubbleAdminText: '#FFF',
    quickRepliesBg: isDark ? '#111827' : '#FFF',
    quickReplyChipBg: isDark ? '#1F2937' : '#F1F5F9',
    quickReplyText: isDark ? '#9CA3AF' : '#64748B',
    composerBg: isDark ? '#111827' : '#FFF',
    inputBg: isDark ? '#1F2937' : '#F1F5F9',
    inputText: isDark ? '#FFF' : '#1E293B',
    statusBar: isDark ? 'light-content' as const : 'dark-content' as const,
    statusBarBg: isDark ? '#0B0F19' : '#FFF',
    emptyTitle: isDark ? '#E2E8F0' : '#1E293B',
    emptyText: isDark ? '#9CA3AF' : '#64748B',
  };

  const handleCreateLogin = async () => {
    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();
    if (!email || !password) {
      setLoginAlertMsg('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setLoginAlertMsg('Password must be at least 6 characters.');
      return;
    }
    setLoginAlertMsg('');
    setIsCreatingLogin(true);
    try {
      const { uid, note } = await createUserAccount(email, password, lead.name, lead.phone);
      await api.updateLead(lead.id, { email, userId: uid });
      setLeadUserId(uid);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginPassword('');
      Alert.alert('Login Created ✅', `${note}\n\nEmail: ${email}\n\n${lead.name} can now login to the User App with this email and password.`);
    } catch (err: any) {
      if (err.message?.startsWith('EMAIL_EXISTS_RESET_SENT:')) {
        setLoginAlertMsg('This email exists with a different password. Password reset email sent — ask user to check inbox.');
      } else {
        setLoginAlertMsg(err.message || 'Account creation failed. Please try again.');
      }
    } finally {
      setIsCreatingLogin(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBarBg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.userInfoContainer}>
            <View style={[styles.avatar, { backgroundColor: getStatusColor(lead.status) }]}>
              <Text style={styles.avatarText}>{getInitials(lead.name)}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                {lead.name}
              </Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={[styles.statusText, { color: theme.subText }]}>
                  Active · Score {lead.timeSpent ? Math.min(99, Math.floor(lead.timeSpent / 2) + 60) : 75}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.iconBtnBg }]} onPress={handleCall}>
              <Text style={[styles.iconBtnText, { color: theme.iconBtnText }]}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.iconBtnBg }]} onPress={handleWhatsApp}>
              <Text style={[styles.iconBtnText, { color: theme.iconBtnText }]}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#FEE2E2' }]} onPress={handleDeleteAllMessages}>
              <Text style={styles.iconBtnText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LINKED PROPERTY BANNER */}
        <View style={[styles.propertyBannerContainer, { backgroundColor: theme.propertyBannerBg, borderBottomColor: theme.border }]}>
          {loadingProperty ? (
            <View style={styles.propertyLoader}>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={[styles.propertyLoaderText, { color: theme.subText }]}>Finding property details...</Text>
            </View>
          ) : linkedProperty ? (
            <TouchableOpacity
              style={[styles.propertyCard, { backgroundColor: theme.propertyCardBg, borderColor: theme.border }]}
              onPress={() =>
                navigation.navigate('PropertyDetail', {
                  property: linkedProperty,
                  fromScreen: 'LeadChat',
                  lead,
                })
              }
            >
              <Image
                source={{ uri: linkedProperty.image || 'https://images.unsplash.com/photo-1600585154340-be6199f7d009' }}
                style={styles.propertyImage}
              />
              <View style={styles.propertyInfo}>
                <Text style={[styles.propertyName, { color: theme.text }]} numberOfLines={1}>
                  {linkedProperty.name || linkedProperty.title}
                </Text>
                <Text style={[styles.propertySpecs, { color: theme.subText }]}>
                  {linkedProperty.price} • {linkedProperty.grounds || '1 Ground'} • {linkedProperty.location}
                </Text>
              </View>
              <View style={styles.interestBadge}>
                <Text style={styles.interestBadgeText}>INTERESTED</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.fallbackPropertyCard, { backgroundColor: theme.propertyCardBg, borderColor: theme.border }]}>
              <Text style={styles.fallbackPropertyIcon}>🏢</Text>
              <View style={styles.propertyInfo}>
                <Text style={[styles.propertyName, { color: theme.text }]} numberOfLines={1}>
                  {lead.propertyName || lead.interest}
                </Text>
                <Text style={[styles.propertySpecs, { color: theme.subText }]}>Inquiry regarding this asset listing</Text>
              </View>
              <View style={[styles.interestBadge, { backgroundColor: isDark ? '#1F2937' : '#E2E8F0' }]}>
                <Text style={[styles.interestBadgeText, { color: theme.subText }]}>INQUIRY</Text>
              </View>
            </View>
          )}
        </View>

        {/* CHAT MESSAGES PANEL */}
        <ScrollView
          ref={scrollViewRef}
          style={[styles.chatContainer, { backgroundColor: theme.chatContainerBg }]}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.systemDateContainer}>
            <Text style={styles.systemDateText}>TODAY</Text>
          </View>

          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={[styles.emptyTitle, { color: theme.emptyTitle }]}>Start a conversation</Text>
              <Text style={[styles.emptyText, { color: theme.emptyText }]}>
                No message history found with {lead.name}. Use templates below to reach out.
              </Text>
            </View>
          ) : (
            messages.map(item => {
              const isAdmin = item.sender === 'admin';
              return (
                <View
                  key={item.id}
                  style={[
                    styles.messageRow,
                    isAdmin ? styles.messageRowAdmin : styles.messageRowClient,
                  ]}
                >
                  <TouchableOpacity
                    onLongPress={() => handleDeleteMessage(item)}
                    activeOpacity={0.8}
                    style={[
                      styles.bubble,
                      isAdmin ? [styles.bubbleAdmin, { backgroundColor: theme.bubbleAdminBg }] : [styles.bubbleClient, { backgroundColor: theme.bubbleClientBg }],
                    ]}
                  >
                    <Text style={[styles.messageText, isAdmin ? { color: theme.bubbleAdminText } : { color: theme.bubbleClientText }]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.messageTime, isAdmin ? { color: 'rgba(255,255,255,0.7)' } : { color: theme.subText }]}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* QUICK REPLY SECTION */}
        <View style={[styles.quickRepliesContainer, { backgroundColor: theme.quickRepliesBg, borderTopColor: theme.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRepliesScroll}>
            {QUICK_REPLIES.map((reply, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.quickReplyChip, { backgroundColor: theme.quickReplyChipBg }]}
                onPress={() => handleQuickReply(reply.text)}
              >
                <Text style={[styles.quickReplyText, { color: theme.quickReplyText }]}>{reply.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* COMPOSER BOX */}
        <View style={[styles.composerContainer, { backgroundColor: theme.composerBg, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.inputText }]}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.sendBtnIcon}>➔</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* CREATE LOGIN MODAL */}
      <Modal visible={showLoginModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => { if (!isCreatingLogin) setShowLoginModal(false); }} />
          <View style={{ backgroundColor: isDark ? '#111827' : '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#FFF' : '#111', marginBottom: 4 }}>
              {leadUserId ? 'Update Login Account' : 'Create Login Account'}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
              {lead.name} — User App login credentials
            </Text>

            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1, marginBottom: 6 }}>EMAIL ADDRESS</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 13, fontSize: 15, color: isDark ? '#FFF' : '#1E293B', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', marginBottom: 14 }}
              placeholder="e.g. krish@gmail.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={loginEmail}
              onChangeText={setLoginEmail}
              editable={!isCreatingLogin}
            />

            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1, marginBottom: 6 }}>PASSWORD</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 13, fontSize: 15, color: isDark ? '#FFF' : '#1E293B', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', marginBottom: 14 }}
              placeholder="Min 6 characters"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={loginPassword}
              onChangeText={setLoginPassword}
              editable={!isCreatingLogin}
            />

            {loginAlertMsg ? (
              <Text style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{loginAlertMsg}</Text>
            ) : null}

            <TouchableOpacity
              style={{ backgroundColor: isCreatingLogin ? '#9CA3AF' : '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 }}
              onPress={handleCreateLogin}
              disabled={isCreatingLogin}
            >
              {isCreatingLogin
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>CREATE ACCOUNT</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={{ borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }}
              onPress={() => setShowLoginModal(false)}
              disabled={isCreatingLogin}
            >
              <Text style={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
    marginRight: 5,
  },
  backBtnIcon: {
    fontSize: 24,
    fontWeight: '900',
    color: GOLD,
  },
  userInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBtnText: {
    fontSize: 16,
  },
  propertyBannerContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAF9F6',
  },
  propertyLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  propertyLoaderText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
    fontWeight: '600',
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  propertyImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  propertyInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  propertyName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  propertySpecs: {
    fontSize: 10,
    color: GOLD,
    fontWeight: '800',
    marginTop: 2,
  },
  interestBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  interestBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#15803D',
  },
  fallbackPropertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fallbackPropertyIcon: {
    fontSize: 20,
    paddingHorizontal: 8,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 15,
  },
  chatContent: {
    paddingVertical: 15,
    paddingBottom: 30,
  },
  systemDateContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  systemDateText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    letterSpacing: 1.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 40,
    color: '#CBD5E1',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#475569',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    width: '100%',
  },
  messageRowAdmin: {
    justifyContent: 'flex-end',
  },
  messageRowClient: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleAdmin: {
    backgroundColor: GOLD,
    borderTopRightRadius: 4,
  },
  bubbleClient: {
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  messageTextAdmin: {
    color: '#FFF',
  },
  messageTextClient: {
    color: '#1E293B',
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: '700',
  },
  messageTimeAdmin: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeClient: {
    color: '#94A3B8',
  },
  quickRepliesContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  quickRepliesScroll: {
    paddingHorizontal: 15,
    gap: 8,
  },
  quickReplyChip: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickReplyText: {
    fontSize: 12,
    color: '#854D0E',
    fontWeight: '700',
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFF',
    gap: 10,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 45,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnIcon: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
});

export default LeadChatScreen;
