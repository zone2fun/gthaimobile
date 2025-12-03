import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getMessages, sendMessage, getUser } from '@/services/api';

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user, token } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUser, setOtherUser] = useState<any>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (id && token) {
            fetchChatData();
        }
    }, [id, token]);

    const fetchChatData = async () => {
        try {
            // Fetch user details
            const userData = await getUser(id as string, token!);
            setOtherUser(userData);

            // Fetch messages
            const msgs = await getMessages(id as string, token!);
            setMessages(msgs);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching chat data:', error);
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() || !token) return;

        const textToSend = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            // Optimistic update
            const tempMessage = {
                _id: Math.random().toString(),
                text: textToSend,
                sender: { _id: user?._id },
                createdAt: new Date().toISOString(),
                pending: true,
            };
            setMessages(prev => [...prev, tempMessage]);

            // Send to API
            await sendMessage(id as string, textToSend, token);

            // Refresh messages to get the real one (or just update status)
            // For simplicity, we'll just fetch all again or assume success
            // Ideally backend returns the created message
            const msgs = await getMessages(id as string, token);
            setMessages(msgs);
        } catch (error) {
            console.error('Error sending message:', error);
            // TODO: Handle error (show retry, etc.)
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender._id === user?._id || item.sender === user?._id;

        return (
            <View style={[
                styles.messageContainer,
                isMe ? styles.myMessageContainer : styles.theirMessageContainer
            ]}>
                {!isMe && (
                    <Image
                        source={{ uri: otherUser?.img }}
                        style={styles.messageAvatar}
                        contentFit="cover"
                    />
                )}
                <View style={[
                    styles.messageBubble,
                    isMe ? styles.myMessageBubble : styles.theirMessageBubble
                ]}>
                    {item.image && (
                        <Image
                            source={{ uri: item.image }}
                            style={styles.messageImage}
                            contentFit="cover"
                        />
                    )}
                    {item.text && (
                        <Text style={[
                            styles.messageText,
                            isMe ? styles.myMessageText : styles.theirMessageText
                        ]}>
                            {item.text}
                        </Text>
                    )}
                    <Text style={[
                        styles.messageTime,
                        isMe ? styles.myMessageTime : styles.theirMessageTime
                    ]}>
                        {formatTime(item.createdAt)}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                {otherUser ? (
                    <View style={styles.headerUserInfo}>
                        <Image
                            source={{ uri: otherUser.img }}
                            style={styles.headerAvatar}
                            contentFit="cover"
                        />
                        <View>
                            <Text style={styles.headerName}>{otherUser.name}</Text>
                            {otherUser.isOnline && (
                                <Text style={styles.headerStatus}>Online</Text>
                            )}
                        </View>
                    </View>
                ) : (
                    <Text style={styles.headerName}>Chat</Text>
                )}

                <TouchableOpacity style={styles.headerAction}>
                    <MaterialIcons name="more-vert" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.tint} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton}>
                        <MaterialIcons name="add-photo-alternate" size={24} color="#888" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#666"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        <MaterialIcons name="send" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        backgroundColor: Colors.dark.background,
    },
    backButton: {
        marginRight: 16,
    },
    headerUserInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#333',
    },
    headerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerStatus: {
        fontSize: 12,
        color: '#2ecc71',
    },
    headerAction: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        padding: 16,
        paddingBottom: 20,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '80%',
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    theirMessageContainer: {
        alignSelf: 'flex-start',
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        backgroundColor: '#333',
    },
    messageBubble: {
        borderRadius: 20,
        padding: 12,
        maxWidth: '100%',
    },
    myMessageBubble: {
        backgroundColor: Colors.dark.tint,
        borderBottomRightRadius: 4,
    },
    theirMessageBubble: {
        backgroundColor: '#333',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#fff',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myMessageTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirMessageTime: {
        color: '#888',
    },
    messageImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
        backgroundColor: Colors.dark.background,
    },
    attachButton: {
        padding: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#333',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
        color: '#fff',
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.dark.tint,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#444',
    },
});
