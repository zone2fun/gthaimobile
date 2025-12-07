import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList, Platform, Modal, TouchableWithoutFeedback, Keyboard, Alert, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/theme';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getPosts, createPost, likePost, addComment, deletePost, createReport } from '@/services/api';
import { uploadImageToCloudinary } from '@/services/cloudinary';

export default function SpecialScreen() {
    const { isAuthenticated } = useProtectedRoute();
    const { user, token, blockedUsers } = useAuth();
    const { socket } = useSocket();
    const { getOnlineStatus } = useOnlineStatus();
    const router = useRouter();
    const params = useLocalSearchParams();
    const highlightPostId = params.highlightPostId as string | undefined;

    const [posts, setPosts] = useState<any[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [isCreatePostModalVisible, setIsCreatePostModalVisible] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [creatingPost, setCreatingPost] = useState(false);
    const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);

    // Report Modal
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportPostId, setReportPostId] = useState<string | null>(null);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');

    // Likes Modal
    const [likesModalVisible, setLikesModalVisible] = useState(false);
    const [selectedPostLikes, setSelectedPostLikes] = useState<any[]>([]);

    useEffect(() => {
        if (user && token) {
            fetchPosts();
        }
    }, [user, token, blockedUsers]);

    // Handle highlight post from notification
    useEffect(() => {
        if (highlightPostId && posts.length > 0) {
            setHighlightedPostId(highlightPostId);
            // Clear highlight after 3 seconds
            setTimeout(() => {
                setHighlightedPostId(null);
            }, 3000);
        }
    }, [highlightPostId, posts]);

    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket) return;

        socket.on('new post', (newPost: any) => {
            // Only add to feed if the post is approved (or has no image)
            if (newPost.isApproved !== false) {
                setPosts(prev => [newPost, ...prev]);
            }
        });

        socket.on('post_approved', (approvedPost: any) => {
            // Add the newly approved post to the feed
            setPosts(prev => {
                // Check if post already exists (shouldn't, but just in case)
                const exists = prev.some(p => p._id === approvedPost._id);
                if (!exists) {
                    return [approvedPost, ...prev];
                }
                return prev;
            });
        });

        socket.on('post_rejected', ({ postId }: any) => {
            // Remove the rejected post from feed (if user somehow had it)
            setPosts(prev => prev.filter(post => post._id !== postId));
        });

        socket.on('post liked', ({ postId, userId }: any) => {
            setPosts(prev => prev.map(post => {
                if (post._id === postId) {
                    const isLiked = post.likes.some((like: any) => like._id === userId);
                    if (!isLiked) {
                        return { ...post, likes: [...post.likes, { _id: userId }] };
                    }
                }
                return post;
            }));
        });

        socket.on('post unliked', ({ postId, userId }: any) => {
            setPosts(prev => prev.map(post => {
                if (post._id === postId) {
                    return { ...post, likes: post.likes.filter((like: any) => like._id !== userId) };
                }
                return post;
            }));
        });

        socket.on('new comment', ({ postId, comment }: any) => {
            setPosts(prev => prev.map(post => {
                if (post._id === postId) {
                    return { ...post, comments: [...post.comments, comment] };
                }
                return post;
            }));
        });

        socket.on('post deleted', ({ postId }: any) => {
            setPosts(prev => prev.filter(post => post._id !== postId));
        });

        return () => {
            socket.off('new post');
            socket.off('post_approved');
            socket.off('post_rejected');
            socket.off('post liked');
            socket.off('post unliked');
            socket.off('new comment');
            socket.off('post deleted');
        };
    }, [socket]);

    // Re-bind listeners when blockedUsers changes to ensure fresh closure context if needed,
    // although fetching from backend relies on DB state mainly.
    // However, to be cleaner, we could separate this. 
    // For now, adding to the main socket effect is risky if dependencies aren't updated.
    // Let's create a separate effect for block/unblock to be safe.

    useEffect(() => {
        if (!socket) return;
        socket.on('blocked', fetchPosts);
        socket.on('unblocked', fetchPosts);
        return () => {
            socket.off('blocked', fetchPosts);
            socket.off('unblocked', fetchPosts);
        };
    }, [socket, user, token, blockedUsers]); // Re-bind if auth state changes

    const fetchPosts = async () => {
        try {
            const data = await getPosts(token!);
            // Filter out posts that are not approved (posts with images pending admin approval)
            // And filter out posts from blocked users
            const approvedPosts = data.filter((post: any) =>
                post.isApproved !== false &&
                !blockedUsers.includes(post.user?._id)
            );
            setPosts(approvedPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            Alert.alert('Error', 'Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPosts();
        setRefreshing(false);
    };

    const handleLike = async (postId: string) => {
        try {
            // Optimistic update
            setPosts(posts.map(post => {
                if (post._id === postId) {
                    const isLiked = post.likes.some((like: any) => like._id === user?._id);
                    return {
                        ...post,
                        likes: isLiked
                            ? post.likes.filter((like: any) => like._id !== user?._id)
                            : [...post.likes, { _id: user?._id, name: user?.name, img: user?.img }]
                    };
                }
                return post;
            }));

            await likePost(postId, token!);
        } catch (error) {
            console.error('Error liking post:', error);
            // Revert on error
            await fetchPosts();
        }
    };

    const toggleComments = (postId: string) => {
        setActiveCommentPostId(activeCommentPostId === postId ? null : postId);
        setCommentText('');
    };

    const handleCommentSubmit = async (postId: string) => {
        if (!commentText.trim()) return;

        try {
            const updatedComments = await addComment(postId, commentText, token!);

            // Backend returns all comments array, update the post with new comments
            setPosts(posts.map(post => {
                if (post._id === postId) {
                    return {
                        ...post,
                        comments: updatedComments
                    };
                }
                return post;
            }));

            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
            Alert.alert('Error', 'Failed to add comment');
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            // Store the local URI, will upload when creating post
            setNewPostImage(result.assets[0].uri);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && !newPostImage) {
            Alert.alert('Error', 'Please add some content or an image');
            return;
        }

        setCreatingPost(true);
        try {
            const newPost = await createPost(
                { content: newPostContent },
                newPostImage || undefined,
                token!
            );

            // Only add to local state if approved (posts without images are auto-approved)
            if (newPost.isApproved !== false) {
                setPosts([newPost, ...posts]);
            }

            setNewPostContent('');
            setNewPostImage(null);
            setIsCreatePostModalVisible(false);

            // Different message based on whether post has image
            if (newPostImage) {
                Alert.alert(
                    'Post Submitted',
                    'Your post with image has been submitted for admin approval. It will be visible once approved.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Success', 'Post created successfully!');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Error', 'Failed to create post');
        } finally {
            setCreatingPost(false);
        }
    };

    const handleDeletePost = (postId: string) => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePost(postId, token!);
                            setPosts(posts.filter(post => post._id !== postId));
                            Alert.alert('Success', 'Post deleted successfully');
                        } catch (error) {
                            console.error('Error deleting post:', error);
                            Alert.alert('Error', 'Failed to delete post');
                        }
                    }
                }
            ]
        );
    };

    const openReportModal = (postId: string) => {
        setReportPostId(postId);
        setReportModalVisible(true);
    };

    const handleSubmitReport = async () => {
        if (!reportReason.trim()) {
            Alert.alert('Error', 'Please select a reason');
            return;
        }

        try {
            await createReport({
                reportedId: reportPostId!,
                reportedType: 'post',
                reason: reportReason,
                description: reportDescription,
            }, token!);

            setReportModalVisible(false);
            setReportPostId(null);
            setReportReason('');
            setReportDescription('');

            Alert.alert('Success', 'Report submitted successfully');
        } catch (error) {
            console.error('Error submitting report:', error);
            Alert.alert('Error', 'Failed to submit report');
        }
    };

    const openLikesModal = (likes: any[]) => {
        setSelectedPostLikes(likes);
        setLikesModalVisible(true);
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
        const isLiked = item.likes.some((like: any) => like._id === user?._id);
        const showComments = activeCommentPostId === item._id;
        const isMyPost = item.user._id === user?._id;
        const isHighlighted = highlightedPostId === item._id;

        return (
            <View style={[styles.postCard, isHighlighted && styles.highlightedPost]}>
                {/* Post Header */}
                <TouchableOpacity
                    style={styles.postHeader}
                    onPress={() => router.push(`/user/${item.user._id}` as any)}
                >
                    <View style={styles.postAvatarContainer}>
                        <Image source={{ uri: item.user.img }} style={styles.postAvatar} contentFit="cover" />
                        {getOnlineStatus(item.user._id, item.user.isOnline) && (
                            <View style={styles.onlineDot} />
                        )}
                    </View>
                    <View style={styles.postUserInfo}>
                        <View style={styles.postUserName}>
                            <Text style={styles.userName}>{item.user.name}</Text>
                            {item.user.isVerified && (
                                <MaterialIcons name="verified" size={14} color="#1DA1F2" style={{ marginLeft: 4 }} />
                            )}
                        </View>
                        <Text style={styles.postTime}>{formatTime(item.createdAt)}</Text>
                    </View>
                    {isMyPost && (
                        <TouchableOpacity onPress={() => handleDeletePost(item._id)}>
                            <MaterialIcons name="delete-outline" size={20} color="#888" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>

                {/* Post Content */}
                {item.content && (
                    <Text style={styles.postContent}>{item.content}</Text>
                )}

                {/* Post Image */}
                {item.image && (
                    <Image source={{ uri: item.image }} style={styles.postImage} contentFit="cover" />
                )}

                {/* Post Stats - Like Avatars */}
                {item.likes.length > 0 && (
                    <TouchableOpacity
                        style={styles.postStats}
                        onPress={() => openLikesModal(item.likes)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.likeAvatarsContainer}>
                            {item.likes.slice(0, 10).map((like: any, index: number) => (
                                <View key={like._id} style={{ marginLeft: index === 0 ? 0 : -8 }}>
                                    <Image
                                        source={{ uri: like.img }}
                                        style={styles.likeAvatar}
                                        contentFit="cover"
                                    />
                                    {like.isVerified && (
                                        <View style={styles.likeAvatarVerifiedBadge}>
                                            <MaterialIcons name="verified" size={10} color="#1DA1F2" />
                                        </View>
                                    )}
                                </View>
                            ))}
                            {item.likes.length > 10 && (
                                <View style={[styles.likeAvatar, styles.likeAvatarMore, { marginLeft: -8 }]}>
                                    <Text style={styles.likeAvatarMoreText}>+</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.statsText}>
                            {item.likes.length} {item.likes.length === 1 ? 'like' : 'likes'}
                        </Text>
                    </TouchableOpacity>
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

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openReportModal(item._id)}
                    >
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
                                <Image source={{ uri: comment.user?.img }} style={styles.commentAvatar} contentFit="cover" />
                                <View style={styles.commentBubble}>
                                    <Text style={styles.commentUserName}>{comment.user?.name}</Text>
                                    <Text style={styles.commentText}>{comment.text}</Text>
                                </View>
                            </View>
                        ))}

                        {item.comments.length === 0 && (
                            <Text style={styles.noCommentsText}>No comments yet</Text>
                        )}

                        {/* Add Comment */}
                        <View style={styles.addCommentBox}>
                            <Image source={{ uri: user?.img }} style={styles.commentAvatar} contentFit="cover" />
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

    if (!isAuthenticated || !user) return null;

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
                onRequestClose={() => {
                    setIsCreatePostModalVisible(false);
                    setNewPostContent('');
                    setNewPostImage(null);
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.createPostModal}>
                                {/* Header */}
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Create Post</Text>
                                    <TouchableOpacity onPress={() => {
                                        setIsCreatePostModalVisible(false);
                                        setNewPostContent('');
                                        setNewPostImage(null);
                                    }}>
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

                                {/* Image Preview */}
                                {newPostImage && (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image source={{ uri: newPostImage }} style={styles.imagePreview} contentFit="cover" />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => setNewPostImage(null)}
                                        >
                                            <MaterialIcons name="close" size={20} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Action Icons */}
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.modalActionButton}
                                        onPress={pickImage}
                                        disabled={uploadingImage}
                                    >
                                        {uploadingImage ? (
                                            <ActivityIndicator size="small" color={Colors.dark.tint} />
                                        ) : (
                                            <>
                                                <MaterialIcons name="photo-library" size={24} color={Colors.dark.tint} />
                                                <Text style={styles.modalActionText}>Photo</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.modalActionButton}
                                        onPress={() => {
                                            // Add hashtag to text
                                            setNewPostContent(prev => prev + '#');
                                        }}
                                    >
                                        <MaterialIcons name="tag" size={24} color={Colors.dark.tint} />
                                        <Text style={styles.modalActionText}>Hashtag</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Save Button */}
                                <TouchableOpacity
                                    style={[styles.modalSaveButton, creatingPost && { opacity: 0.7 }]}
                                    onPress={handleCreatePost}
                                    disabled={creatingPost || (!newPostContent.trim() && !newPostImage)}
                                >
                                    {creatingPost ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.modalSaveButtonText}>Post</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

            {/* Report Modal */}
            <Modal
                visible={reportModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setReportModalVisible(false)}
            >
                <View style={styles.reportModalOverlay}>
                    <View style={styles.reportModal}>
                        <Text style={styles.reportModalTitle}>Report Post</Text>

                        <Text style={styles.reportLabel}>Reason:</Text>
                        <View style={styles.reportReasons}>
                            {['Spam', 'Harassment', 'Inappropriate Content', 'False Information', 'Other'].map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    style={[
                                        styles.reasonButton,
                                        reportReason === reason && styles.reasonButtonActive
                                    ]}
                                    onPress={() => setReportReason(reason)}
                                >
                                    <Text style={[
                                        styles.reasonButtonText,
                                        reportReason === reason && styles.reasonButtonTextActive
                                    ]}>{reason}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.reportLabel}>Additional Details (Optional):</Text>
                        <TextInput
                            style={styles.reportDescriptionInput}
                            placeholder="Provide more details..."
                            placeholderTextColor="#888"
                            value={reportDescription}
                            onChangeText={setReportDescription}
                            multiline
                            numberOfLines={4}
                        />

                        <View style={styles.reportModalButtons}>
                            <TouchableOpacity
                                style={styles.reportCancelButton}
                                onPress={() => {
                                    setReportModalVisible(false);
                                    setReportReason('');
                                    setReportDescription('');
                                }}
                            >
                                <Text style={styles.reportCancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.reportSubmitButton}
                                onPress={handleSubmitReport}
                            >
                                <Text style={styles.reportSubmitButtonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Likes Modal */}
            <Modal
                visible={likesModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLikesModalVisible(false)}
            >
                <View style={styles.reportModalOverlay}>
                    <View style={styles.likesModal}>
                        <View style={styles.likesModalHeader}>
                            <Text style={styles.likesModalTitle}>Likes</Text>
                            <TouchableOpacity onPress={() => setLikesModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.likesModalContent}>
                            {selectedPostLikes.map((like: any) => (
                                <TouchableOpacity
                                    key={like._id}
                                    style={styles.likeUserItem}
                                    onPress={() => {
                                        setLikesModalVisible(false);
                                        router.push(`/user/${like._id}` as any);
                                    }}
                                >
                                    <View style={styles.likeUserAvatarContainer}>
                                        <Image
                                            source={{ uri: like.img }}
                                            style={styles.likeUserAvatar}
                                            contentFit="cover"
                                        />
                                        {getOnlineStatus(like._id, like.isOnline) && (
                                            <View style={styles.likeUserOnlineDot} />
                                        )}
                                    </View>
                                    <View style={styles.likeUserInfo}>
                                        <Text style={styles.likeUserName}>{like.name}</Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={24} color="#888" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
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
    highlightedPost: {
        borderWidth: 2,
        borderColor: Colors.dark.tint,
        backgroundColor: '#252525',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    postAvatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    postAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2ecc71',
        borderWidth: 2,
        borderColor: '#1a1a1a',
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    likeAvatarsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    likeAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#1a1a1a',
    },
    likeAvatarMore: {
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    likeAvatarMoreText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    likeAvatarVerifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        width: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
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
        alignItems: 'center',
        padding: 20,
    },
    createPostModal: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 500,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    modalAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        borderWidth: 2,
        borderColor: Colors.dark.tint,
    },
    modalUserName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    modalInput: {
        color: '#fff',
        fontSize: 16,
        minHeight: 80,
        maxHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
    },
    imagePreviewContainer: {
        position: 'relative',
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#2a2a2a',
        borderWidth: 1,
        borderColor: '#333',
    },
    imagePreview: {
        width: '100%',
        aspectRatio: 1,
    },
    removeImageButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 16,
        gap: 24,
    },
    modalActionButton: {
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#2a2a2a',
    },
    modalActionText: {
        color: Colors.dark.tint,
        fontSize: 13,
        fontWeight: '500',
    },
    modalSaveButton: {
        backgroundColor: Colors.dark.tint,
        paddingVertical: 14,
        borderRadius: 28,
        alignItems: 'center',
        shadowColor: Colors.dark.tint,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    modalSaveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    // Report Modal
    reportModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    reportModal: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxWidth: 400,
    },
    reportModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    reportLabel: {
        fontSize: 14,
        color: '#ccc',
        marginBottom: 10,
        marginTop: 10,
    },
    reportReasons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 10,
    },
    reasonButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#2a2a2a',
        borderWidth: 1,
        borderColor: '#444',
    },
    reasonButtonActive: {
        backgroundColor: Colors.dark.tint,
        borderColor: Colors.dark.tint,
    },
    reasonButtonText: {
        color: '#ccc',
        fontSize: 13,
    },
    reasonButtonTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    reportDescriptionInput: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    reportModalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    reportCancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#2a2a2a',
        alignItems: 'center',
    },
    reportCancelButtonText: {
        color: '#ccc',
        fontSize: 16,
        fontWeight: '600',
    },
    reportSubmitButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#e74c3c',
        alignItems: 'center',
    },
    reportSubmitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Likes Modal Styles
    likesModal: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        width: '85%',
        maxHeight: '70%',
        overflow: 'hidden',
    },
    likesModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    likesModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    likesModalContent: {
        maxHeight: 400,
    },
    likeUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    likeUserAvatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    likeUserAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    likeUserOnlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#2ecc71',
        borderWidth: 2,
        borderColor: '#1a1a1a',
    },
    likeUserInfo: {
        flex: 1,
    },
    likeUserName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
