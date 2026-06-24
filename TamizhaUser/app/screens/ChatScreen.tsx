import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getUserSession, getUserProfile, getLeadId, saveLeadId } from '../services/api';

const { width } = Dimensions.get('window');

const BottomTabIcons = [
  { id: 'Home', label: 'HOME', icon: '🏠', route: 'Dashboard' },
  { id: 'Saved', label: 'SAVED', icon: '❤️', route: 'SavedProperties' },
  { id: 'Activity', label: 'ACTIVITY', icon: '📅', route: 'Activity' },
  { id: 'Chat', label: 'CHAT', icon: '💬', route: 'Chat' },
  { id: 'Profile', label: 'PROFILE', icon: '👤', route: 'Profile' },
];

const ChatScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const activeTab = 'Chat';
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const [userName, setUserName] = useState('');
  const [avatarUri, setAvatarUri] = useState('https://cdn-icons-png.flaticon.com/512/3135/3135715.png');
  // chatLeadId: admin-created lead doc ID if this user was added by admin, else user.uid
  const [chatLeadId, setChatLeadId] = useState<string | null>(null);
  const pollRef = useRef<any>(null);
  const sessionBotReplied = useRef(false); // resets every time ChatScreen mounts

  // Load session + lead ID on mount, then start polling
  useEffect(() => {
    const init = async () => {
      try {
        const session = await getUserSession();
        const profile = await getUserProfile();
        setUserName(profile?.name || session?.name || (session?.email?.split('@')[0]) || 'User');

        let leadId = await getLeadId();
        if (!leadId) {
          // Try by userId first
          if (session?.id) {
            const lead = await api.getLeadByUser(session.id).catch(() => null);
            if (lead?.id) { leadId = lead.id; await saveLeadId(lead.id); }
          }
          // Fallback: match by email
          if (!leadId && session?.email) {
            const leads = await api.getLeads();
            const myLead = leads.find((l: any) =>
              l.email?.toLowerCase() === session.email.toLowerCase()
            );
            if (myLead) { leadId = myLead.id; await saveLeadId(myLead.id); }
          }
        }
        setChatLeadId(leadId);
      } catch (e) {
        console.error('Chat init error:', e);
      }
    };
    init();
  }, []);

  // Poll messages every 5 seconds when we have a leadId
  useEffect(() => {
    if (!chatLeadId) return;
    const fetchMessages = async () => {
      try {
        const msgs = await api.getMessages(chatLeadId);
        setMessages(msgs.map((m: any) => ({ ...m, timestamp: m.timestamp || m.created_at })));
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
      } catch (_) {}
    };
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [chatLeadId]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !chatLeadId) return;
    const text = messageInput.trim();
    setMessageInput('');
    try {
      const msg = await api.sendMessage(chatLeadId, text, 'client');
      setMessages(prev => [...prev, { ...msg, timestamp: msg.created_at }]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      // Bot auto-reply — once per session (resets every time app opens)
      if (!sessionBotReplied.current) {
        sessionBotReplied.current = true;
        setTimeout(async () => {
          const greeting = `Hi ${userName || 'there'}! 👋 Thanks for reaching out to Tamizha Properties. We've received your message and our team will respond shortly. We're here to help you find your perfect property! 🏡`;
          try {
            const botMsg = await api.sendMessage(chatLeadId, greeting, 'admin');
            setMessages(prev => [...prev, { ...botMsg, timestamp: botMsg.created_at }]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          } catch (_) {}
        }, 1500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDeleteAllMessages = () => {
    Alert.alert(
      'Clear Chat',
      'Clear chat history from this screen? (Messages on server remain)',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setMessages([]) },
      ]
    );
  };

  const handleDeleteMessage = (msgId: string) => {
    setMessages(prev => prev.filter((m: any) => m.id !== msgId));
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 15 }]}>
        <View style={styles.headerInfo}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View>
            <Text style={styles.headerTitle}>Tamizha Support</Text>
            <Text style={styles.onlineStatus}>● Online</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn}>
          <Text style={styles.callBtnIcon}>📞</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.callBtn, { backgroundColor: '#FEE2E2', marginLeft: 8 }]} onPress={handleDeleteAllMessages}>
          <Text style={styles.callBtnIcon}>🗑</Text>
        </TouchableOpacity>
      </View>

      {/* Messages & Input wrapped in KeyboardAvoidingView */}
      {chatLeadId ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesContent}
            ListEmptyComponent={() => (
               <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                 <Text style={{ fontSize: 50, marginBottom: 15 }}>👋</Text>
                 <Text style={{ fontSize: 16, fontWeight: '800', color: '#111' }}>Hello! How can we help you?</Text>
                 <Text style={{ fontSize: 13, color: '#888', marginTop: 5 }}>Send a message to start chatting.</Text>
               </View>
            )}
            renderItem={({ item }) => {
              const isMe = item.sender === 'client';
              return (
                <View style={[styles.msgBubbleWrap, isMe ? styles.msgRight : styles.msgLeft]}>
                  <TouchableOpacity
                    onLongPress={() => handleDeleteMessage(item.id)}
                    activeOpacity={0.8}
                    style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleThem]}
                  >
                    <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextThem]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeThem]}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.msgInput}
              placeholder="Type your message..."
              placeholderTextColor="#AAA"
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, messageInput.trim() ? styles.sendBtnActive : {}]}
              onPress={sendMessage}
            >
              <Text style={styles.sendBtnIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 10 }}>Please Login</Text>
          <Text style={{ fontSize: 13, color: '#666' }}>You must be logged in to chat with Support.</Text>
        </View>
      )}

      {/* Bottom Tab Bar */}
      <View style={[styles.bottomTabContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 10 }]}>
        {BottomTabIcons.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => {
                if (tab.route !== activeTab) {
                  navigation.navigate(tab.route);
                }
              }}
            >
              <View style={[styles.tabIconWrapper, isActive && styles.tabIconWrapperActive]}>
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6F9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  headerInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EEE', marginRight: 12 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#111' },
  onlineStatus: { fontSize: 11, color: '#2ecc71', fontWeight: '800', marginTop: 2 },
  callBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  callBtnIcon: { fontSize: 16 },
  messagesContent: { padding: 15, paddingBottom: 20 },
  msgBubbleWrap: { marginBottom: 15 },
  msgLeft: { alignItems: 'flex-start' },
  msgRight: { alignItems: 'flex-end' },
  msgBubble: { maxWidth: width * 0.75, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  msgBubbleMe: { backgroundColor: '#0B132B', borderBottomRightRadius: 4 },
  msgBubbleThem: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  msgText: { fontSize: 14, lineHeight: 22 },
  msgTextMe: { color: '#FFF' },
  msgTextThem: { color: '#111' },
  msgTime: { fontSize: 9, marginTop: 5 },
  msgTimeMe: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  msgTimeThem: { color: '#999' },
  inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  msgInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, fontSize: 14, color: '#111', maxHeight: 100, marginRight: 12 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: '#0B132B' },
  sendBtnIcon: { color: '#FFF', fontSize: 18 },
  
  // Bottom Tab
  bottomTabContainer: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#EEE', alignItems: 'center', justifyContent: 'space-around' },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tabIconWrapper: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  tabIconWrapperActive: { backgroundColor: '#E8F1FF' },
  tabIcon: { fontSize: 18, color: '#888', opacity: 0.6 },
  tabIconActive: { color: '#0D6EFD', opacity: 1 },
  tabLabel: { fontSize: 9, fontWeight: '700', color: '#888' },
  tabLabelActive: { color: '#0D6EFD' },
});

export default ChatScreen;
