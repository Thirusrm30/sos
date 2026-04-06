import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { getChatMessages, sendChatMessage, getUserId } from '../services/buddyService';
import io from 'socket.io-client';
import { API_URL } from '../utils/constants';

const SOCKET_URL = API_URL;

const ChatScreen = ({ navigation, route }) => {
  const { matchId, partnerName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const isMountedRef = useRef(true);

  const currentUserId = getUserId();

  useEffect(() => {
    isMountedRef.current = true;
    
    loadMessages();
    connectSocket();

    return () => {
      isMountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [matchId]);

  const loadMessages = async () => {
    try {
      const result = await getChatMessages(matchId);
      if (result.success && isMountedRef.current) {
        setMessages(result.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const connectSocket = () => {
    try {
      socketRef.current = io(SOCKET_URL, {
        timeout: 5000,
        reconnectionAttempts: 3,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        if (isMountedRef.current) {
          setIsConnected(true);
          socketRef.current?.emit('joinChat', matchId);
        }
      });

      socketRef.current.on('newMessage', (message) => {
        if (isMountedRef.current) {
          setMessages((prev) => [...prev, message]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        if (isMountedRef.current) {
          setIsConnected(false);
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (isMountedRef.current) {
          setIsConnected(false);
        }
      });
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const result = await sendChatMessage(matchId, newMessage.trim());
      if (result.success) {
        setNewMessage('');
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      if (isMountedRef.current) {
        setSending(false);
      }
    }
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.senderId === currentUserId;
    return (
      <View style={[styles.messageWrapper, isOwn ? styles.myMessageWrapper : styles.partnerMessageWrapper]}>
        <View style={[styles.messageBubble, isOwn ? styles.myBubble : styles.partnerBubble]}>
          {!isOwn && <Text style={styles.senderName}>{item.senderName}</Text>}
          <Text style={[styles.messageText, isOwn ? styles.myText : styles.partnerText]}>
            {item.message}
          </Text>
          <Text style={[styles.messageTime, isOwn ? styles.myTime : styles.partnerTime]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const keyExtractor = useCallback((item) => item.id || item._id || Math.random().toString(), []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {partnerName ? partnerName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{partnerName}</Text>
          <Text style={styles.headerSubtitle}>Tap to view profile</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation with your buddy!</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
          )
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton, 
            (!newMessage.trim() || sending) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.textInverse,
  },
  headerContent: {},
  headerTitle: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
  },
  messagesList: {
    padding: SPACING.base,
    flexGrow: 1,
  },
  messageWrapper: {
    marginBottom: SPACING.sm,
    maxWidth: '80%',
  },
  myMessageWrapper: {
    alignSelf: 'flex-end',
  },
  partnerMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  myBubble: {
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: RADIUS.sm,
  },
  partnerBubble: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: RADIUS.sm,
    ...SHADOWS.sm,
  },
  senderName: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.semibold,
    color: COLORS.accent,
    marginBottom: 4,
  },
  messageText: {
    fontSize: FONTS.base,
    lineHeight: 22,
  },
  myText: {
    color: COLORS.textInverse,
  },
  partnerText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: FONTS.xs,
    marginTop: 4,
  },
  myTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  partnerTime: {
    color: COLORS.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.base,
    maxHeight: 100,
    color: COLORS.text,
  },
  sendButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.full,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  sendButtonText: {
    fontSize: 18,
    color: COLORS.textInverse,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.base,
  },
  emptyText: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold,
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

export default ChatScreen;
