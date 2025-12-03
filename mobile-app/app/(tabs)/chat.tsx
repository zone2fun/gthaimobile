import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { getConversations } from '@/services/api';

export default function ChatScreen() {
    const { isAuthenticated } = useProtectedRoute();
    const { user, token } = useAuth();
    const router = useRouter();
    const [conversations, setConversations] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchConversations = async () => {
        if (isAuthenticated && token) {
            try {
                const data = await getConversations(token);
                setConversations(data);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        } else {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [isAuthenticated, token]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchConversations();
    };

    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    };

    const renderConversation = ({ item }: { item: any }) => {
        // Find the other user in the conversation
        // If 'user' property exists (direct structure), use it
        // Otherwise try to find from members array
        let otherUser = item.user;

        if (!otherUser && item.members && user) {
            otherUser = item.members.find((m: any) => m._id !== user._id);
        }

        // Fallback if still no user found (shouldn't happen with correct API)
        if (!otherUser) return null;

        const isMe = item.lastMessage?.sender?._id === user?._id || item.lastMessage?.sender === user?._id;

        // Determine last message text
        let lastMessageText = 'Start a conversation';
        if (item.lastMessage) {
            if (item.lastMessage.image) {
                lastMessageText = isMe ? 'You sent a photo' : 'Sent a photo';
            } else if (item.lastMessage.text) {
                lastMessageText = isMe ? `You: ${item.lastMessage.text}` : item.lastMessage.text;
            }
        }

        return (
            <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => router.push({
                    pathname: '/chat/[id]',
                    params: { id: otherUser._id }
                } as any)}
            >
                <View style={styles.avatarContainer}>
                    {otherUser.img ? (
                        <Image
                            source={{ uri: otherUser.img }}
                            style={styles.avatar}
                            contentFit="cover"
                            transition={200}
                        />
                    ) : (
                        <View style={styles.placeholderAvatar}>
                            <MaterialIcons name="person" size={30} color="#666" />
                        </View>
                    )}
                    {otherUser.isOnline && <View style={styles.onlineBadge} />}
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.topRow}>
                        <View style={styles.nameContainer}>
                            <Text style={styles.name} numberOfLines={1}>{otherUser.name}</Text>
                            {otherUser.isVerified && (
                                <MaterialIcons name="verified" size={14} color="#1DA1F2" style={styles.verifiedIcon} />
                            )}
                        </View>
                        {item.lastMessage && (
                            <Text style={styles.time}>{formatTime(item.lastMessage.createdAt)}</Text>
                        )}
                    </View>

                    <View style={styles.bottomRow}>
                        <Text
                            style={[
                                styles.lastMessage,
                                (item.unreadCount > 0 && !isMe) && styles.unreadMessage
                            ]}
                            numberOfLines={1}
                        >
                            {lastMessageText}
                        </Text>
                        {item.unreadCount > 0 && !isMe && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (!isAuthenticated) return null;

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Messages</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.tint} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity style={styles.searchButton}>
                    <MaterialIcons name="search" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="chat-bubble-outline" size={64} color="#444" />
                    <Text style={styles.emptyText}>No messages yet</Text>
                    <Text style={styles.emptySubText}>Start chatting with people you like!</Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderConversation}
                    keyExtractor={(item) => item._id || (item.user && item.user._id) || Math.random().toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.tint} />
                    }
                />
            )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark.text,
    },
    searchButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 20,
    },
    conversationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#333',
    },
    placeholderAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2ecc71',
        borderWidth: 2,
        borderColor: Colors.dark.background,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginRight: 4,
    },
    verifiedIcon: {
        marginTop: 2,
    },
    time: {
        fontSize: 12,
        color: '#888',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: '#888',
        flex: 1,
        marginRight: 8,
    },
    unreadMessage: {
        color: '#fff',
        fontWeight: '600',
    },
    unreadBadge: {
        backgroundColor: Colors.dark.tint,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 8,
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
