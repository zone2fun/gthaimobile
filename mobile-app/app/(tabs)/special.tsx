import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function SpecialScreen() {
    const { isAuthenticated } = useProtectedRoute();
    const router = useRouter();
    const [posts, setPosts] = useState<any[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

    const [commentText, setCommentText] = useState('');
    const [isCreatePostModalVisible, setIsCreatePostModalVisible] = useState(false);

    // Mock user
    const user = {
        _id: '1',
        name: 'Me',
        img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
        isVerified: true,
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        // Mock posts data
        const mockPosts = [
            {
                _id: '1',
                user: {
                    _id: '2',
                    name: 'James',
                    img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
                    isOnline: true,
                    isVerified: false,
                },
                content: 'Just finished an amazing workout! 💪 #fitness #healthy',
                image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600',
                likes: [
                    { _id: '1', name: 'Me', img: user.img },
                    { _id: '3', name: 'Korn', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
                ],
                comments: [
                    {
                        _id: 'c1',
                        user: { _id: '3', name: 'Korn', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
                        text: 'Looking great! 🔥',
                    },
                ],
                createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
                _id: '2',
                user: {
                    _id: '3',
                    name: 'Korn',
                    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
                    isOnline: false,
                    isVerified: true,
                },
                content: 'Beautiful sunset today 🌅',
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
                likes: [],
                comments: [],
                createdAt: new Date(Date.now() - 7200000).toISOString(),
            },
        ];

        setPosts(mockPosts);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPosts();
        setRefreshing(false);
    };

    const handleLike = (postId: string) => {
        setPosts(posts.map(post => {
            if (post._id === postId) {
                const isLiked = post.likes.some((like: any) => like._id === user._id);
                return {
                    ...post,
                    likes: isLiked
                        ? post.likes.filter((like: any) => like._id !== user._id)
                        : [...post.likes, { _id: user._id, name: user.name, img: user.img }]
                };
            }
            return post;
        }));
    };

    const toggleComments = (postId: string) => {
        setActiveCommentPostId(activeCommentPostId === postId ? null : postId);
        setCommentText('');
    };

    const handleCommentSubmit = (postId: string) => {
        if (!commentText.trim()) return;

        setPosts(posts.map(post => {
            if (post._id === postId) {
                return {
                    ...post,
                    comments: [
                        ...post.comments,
                        {
                            _id: Date.now().toString(),
                            user: { _id: user._id, name: user.name, img: user.img },
                            text: commentText,
                        }
                    ]
                };
            }
            return post;
        }));

        setCommentText('');
    };

    const handleCreatePost = () => {
        if (!newPostContent.trim()) return;

        const newPost = {
            _id: Date.now().toString(),
            user: {
                _id: user._id,
                name: user.name,
                img: user.img,
                isVerified: user.isVerified,
            },
            content: newPostContent,
            image: null,
            likes: [],
            comments: [],
            createdAt: new Date().toISOString(),
        };

        setPosts([newPost, ...posts]);
        setNewPostContent('');
        setIsCreatePostModalVisible(false);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    const renderPost = ({ item }: { item: any }) => {
        const isLiked = item.likes.some((like: any) => like._id === user._id);
        const showComments = activeCommentPostId === item._id;

        return (
            <View style={styles.postCard}>
                {/* Post Header */}
                <TouchableOpacity
                    style={styles.postHeader}
                    onPress={() => router.push(`/user/${item.user._id}` as any)}
                >
                    <Image source={{ uri: item.user.img }} style={styles.postAvatar} contentFit="cover" />
                    <View style={styles.postUserInfo}>
                        <View style={styles.postUserName}>
                            <Text style={styles.userName}>{item.user.name}</Text>
                            {item.user.isVerified && (
                                <MaterialIcons name="verified" size={14} color="#1DA1F2" style={{ marginLeft: 4 }} />
                            )}
                        </View>
                        <Text style={styles.postTime}>{formatTime(item.createdAt)}</Text>
                    </View>
                </TouchableOpacity>

                {/* Post Content */}
                {item.content && (
                    <Text style={styles.postContent}>{item.content}</Text>
                )}

                {/* Post Image */}
                {item.image && (
                    <Image source={{ uri: item.image }} style={styles.postImage} contentFit="cover" />
                )}

                {/* Post Stats */}
                {item.likes.length > 0 && (
                    <View style={styles.postStats}>
                        <Text style={styles.statsText}>{item.likes.length} likes</Text>
                    </View>
                )}

                {/* Post Actions */}
                <View style={styles.postActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleLike(item._id)}
                    >
                        <MaterialIcons
                            name={isLiked ? "thumb-up" : "thumb-up-off-alt"}
                            size={20}
                            color={isLiked ? Colors.dark.tint : '#888'}
                        />
                        <Text style={[styles.actionText, isLiked && { color: Colors.dark.tint }]}>Like</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => toggleComments(item._id)}
                    >
                        <MaterialIcons name="chat-bubble-outline" size={20} color={showComments ? Colors.dark.tint : '#888'} />
                        <Text style={[styles.actionText, showComments && { color: Colors.dark.tint }]}>
                            Comment ({item.comments.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <MaterialIcons name="report" size={20} color="#888" />
                        <Text style={styles.actionText}>Report</Text>
                    </TouchableOpacity>
                </View>

                {/* Comments Section */}
                {showComments && (
                    <View style={styles.commentsSection}>
                        {/* Comments List */}
                        {item.comments.map((comment: any) => (
                            <View key={comment._id} style={styles.commentItem}>
                                <Image source={{ uri: comment.user.img }} style={styles.commentAvatar} contentFit="cover" />
                                <View style={styles.commentBubble}>
                                    <Text style={styles.commentUserName}>{comment.user.name}</Text>
                                    <Text style={styles.commentText}>{comment.text}</Text>
                                </View>
                            </View>
                        ))}

                        {item.comments.length === 0 && (
                            <Text style={styles.noCommentsText}>No comments yet</Text>
                        )}

                        {/* Add Comment */}
                        <View style={styles.addCommentBox}>
                            <Image source={{ uri: user.img }} style={styles.commentAvatar} contentFit="cover" />
                            <View style={styles.commentInputContainer}>
                                <TextInput
                                    style={styles.commentInput}
                                    placeholder="Write a comment..."
                                    placeholderTextColor="#888"
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    multiline
                                />
                                <TouchableOpacity
                                    onPress={() => handleCommentSubmit(item._id)}
                                    disabled={!commentText.trim()}
                                >
                                    <MaterialIcons
                                        name="send"
                                        size={20}
                                        color={commentText.trim() ? Colors.dark.tint : '#444'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Special</Text>
                </View>

                {/* Skeleton Posts */}
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={styles.skeletonPost}>
                            <View style={styles.skeletonHeader}>
                                <View style={styles.skeletonAvatar} />
                                <View style={{ flex: 1 }}>
                                    <View style={styles.skeletonName} />
                                    <View style={styles.skeletonTime} />
                                </View>
                            </View>
                            <View style={styles.skeletonContent} />
                            <View style={styles.skeletonImage} />
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Special</Text>
            </View>

            {/* Create Post Trigger */}
            <View style={styles.createPost}>
                <Image source={{ uri: user.img }} style={styles.createAvatar} contentFit="cover" />
                <TouchableOpacity
                    style={styles.createInputTrigger}
                    onPress={() => setIsCreatePostModalVisible(true)}
                >
                    <Text style={styles.createInputPlaceholder}>What's on your mind?</Text>
                </TouchableOpacity>
            </View>

            {/* Posts Feed */}
            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.feedContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.tint} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="post-add" size={64} color="#444" />
                        <Text style={styles.emptyText}>No posts yet</Text>
                        <Text style={styles.emptySubText}>Be the first to share something!</Text>
                    </View>
                }
            />

            {/* Create Post Modal */}
            <Modal
                visible={isCreatePostModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsCreatePostModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.createPostModal}>
                            {/* Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Create Post</Text>
                                <TouchableOpacity onPress={() => setIsCreatePostModalVisible(false)}>
                                    <MaterialIcons name="close" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {/* User Info */}
                            <View style={styles.modalUserInfo}>
                                <Image source={{ uri: user.img }} style={styles.modalAvatar} contentFit="cover" />
                                <Text style={styles.modalUserName}>{user.name}</Text>
                            </View>

                            {/* Input */}
                            <TextInput
                                style={styles.modalInput}
                                placeholder="What's on your mind?"
                                placeholderTextColor="#888"
                                value={newPostContent}
                                onChangeText={setNewPostContent}
                                multiline
                                autoFocus
                                textAlignVertical="top"
                            />

                            {/* Action Icons */}
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalActionButton}>
                                    <MaterialIcons name="photo-library" size={24} color={Colors.dark.tint} />
                                    <Text style={styles.modalActionText}>Photo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalActionButton}>
                                    <MaterialIcons name="location-on" size={24} color="#e74c3c" />
                                    <Text style={styles.modalActionText}>Location</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalActionButton}>
                                    <MaterialIcons name="tag" size={24} color="#3498db" />
                                    <Text style={styles.modalActionText}>Hashtag</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                style={styles.modalSaveButton}
                                onPress={handleCreatePost}
                            >
                                <Text style={styles.modalSaveButtonText}>Post</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
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
    scrollContent: {
        padding: 16,
    },
    createPost: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 8,
        borderBottomColor: '#1a1a1a',
    },
    createAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    createInputTrigger: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
    },
    createInputPlaceholder: {
        color: '#888',
        fontSize: 15,
    },
    feedContent: {
        paddingBottom: 16,
    },
    postCard: {
        backgroundColor: '#1a1a1a',
        marginBottom: 8,
        paddingVertical: 12,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    postAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    postUserInfo: {
        flex: 1,
    },
    postUserName: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    postTime: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    postContent: {
        fontSize: 15,
        color: '#fff',
        lineHeight: 22,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    postImage: {
        width: '100%',
        height: 300,
        backgroundColor: '#2a2a2a',
    },
    postStats: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    statsText: {
        fontSize: 13,
        color: '#888',
    },
    postActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 8,
        paddingHorizontal: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    actionText: {
        fontSize: 13,
        color: '#888',
        marginLeft: 6,
    },
    commentsSection: {
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#333',
        marginTop: 8,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
    },
    commentBubble: {
        flex: 1,
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        padding: 10,
    },
    commentUserName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 14,
        color: '#fff',
        lineHeight: 18,
    },
    noCommentsText: {
        fontSize: 13,
        color: '#888',
        textAlign: 'center',
        paddingVertical: 12,
    },
    addCommentBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    commentInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    commentInput: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        maxHeight: 80,
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
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
    },
    // Skeleton styles
    skeletonPost: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        marginBottom: 8,
        borderRadius: 8,
    },
    skeletonHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    skeletonAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2a2a2a',
        marginRight: 12,
    },
    skeletonName: {
        width: 120,
        height: 16,
        backgroundColor: '#2a2a2a',
        borderRadius: 4,
        marginBottom: 6,
    },
    skeletonTime: {
        width: 80,
        height: 12,
        backgroundColor: '#2a2a2a',
        borderRadius: 4,
    },
    skeletonContent: {
        width: '100%',
        height: 40,
        backgroundColor: '#2a2a2a',
        borderRadius: 4,
        marginBottom: 12,
    },
    skeletonImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    createPostModal: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 20,
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    modalUserName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    modalInput: {
        color: '#fff',
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 20,
    },
    modalActionButton: {
        alignItems: 'center',
        gap: 6,
    },
    modalActionText: {
        color: '#ccc',
        fontSize: 12,
    },
    modalSaveButton: {
        backgroundColor: Colors.dark.tint,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
    modalSaveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
