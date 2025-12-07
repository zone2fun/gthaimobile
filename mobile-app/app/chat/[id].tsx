import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { getMessages, sendMessage, getUser, respondToAlbumRequest, markMessagesAsRead, deleteMessage, createReport } from '@/services/api';
import { uploadImageToCloudinary } from '@/services/cloudinary';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user, token } = useAuth();
    const { socket, refreshUnreadCount } = useSocket();
    const { getOnlineStatus } = useOnlineStatus();
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [respondedRequests, setRespondedRequests] = useState<Set<string>>(new Set());
    const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (id && token) {
            fetchChatData();
        }
    }, [id, token]);

    // Socket integration for real-time messaging
    useEffect(() => {
        if (!socket || !id || !user) return;

        console.log('Setting up socket listeners for chat:', id);

        // Join the chat room
        socket.emit('join chat', id);
        console.log('Emitted join chat for room:', id);

        // Listen for new messages
        const handleMessageReceived = (newMessage: any) => {
            console.log('Message received via socket:', newMessage);

            // Check if message belongs to this chat
            const messageChat = newMessage.chat?._id || newMessage.chat;
            const senderId = newMessage.sender?._id || newMessage.sender;
            const recipientId = newMessage.recipient?._id || newMessage.recipient;

            // Add message if it's for this conversation
            if (messageChat === id ||
                (senderId === id || recipientId === id) ||
                (senderId === user._id && recipientId === id) ||
                (senderId === id && recipientId === user._id)) {

                setMessages(prev => {
                    // Check if message already exists
                    const exists = prev.some(msg => msg._id === newMessage._id);
                    if (exists) return prev;

                    return [...prev, newMessage];
                });

                // Mark as read if we're not the sender
                if (senderId !== user._id) {
                    markMessagesAsRead(id as string, token!).catch(console.error);
                    refreshUnreadCount();
                }
            }
        };

        socket.on('message received', handleMessageReceived);

        // Cleanup
        return () => {
            console.log('Cleaning up socket listeners for chat:', id);
            socket.off('message received', handleMessageReceived);
            socket.emit('leave chat', id);
        };
    }, [socket, id, user, token]);

    const fetchChatData = async () => {
        try {
            const userData = await getUser(id as string, token!);
            setOtherUser(userData);

            const msgs = await getMessages(id as string, token!);
            setMessages(msgs);

            await markMessagesAsRead(id as string, token!);
            await refreshUnreadCount();

            setLoading(false);
        } catch (error) {
            console.error('Error fetching chat data:', error);
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if ((!inputText.trim() && !selectedImage) || !token || !socket) return;

        const textToSend = inputText.trim();
        const imageToSend = selectedImage;

        // Reset inputs immediately
        setInputText('');
        setSelectedImage(null);
        setSending(true);

        try {
            let imageUrl = undefined;

            // Upload image if selected
            if (imageToSend) {
                setUploadingImage(true);
                try {
                    // Reuse existing cloudinary upload
                    imageUrl = await uploadImageToCloudinary(imageToSend, token);
                } catch (error) {
                    console.error('Error uploading image:', error);
                    Alert.alert('Error', 'Failed to upload image');
                    setUploadingImage(false);
                    setSending(false);
                    setSelectedImage(imageToSend); // Restore image on failure
                    return;
                }
                setUploadingImage(false);
            }

            // Send message to backend
            const sentMessage = await sendMessage(id as string, textToSend, token, imageUrl);

            // Add message to local state immediately for better UX
            if (sentMessage) {
                setMessages(prev => {
                    const exists = prev.some(msg => msg._id === sentMessage._id);
                    if (exists) return prev;
                    return [...prev, sentMessage];
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message');
            // Restore text if failed (optional, but good UX)
            if (textToSend) setInputText(textToSend);
            if (imageToSend && !selectedImage) setSelectedImage(imageToSend);
        } finally {
            setSending(false);
            setUploadingImage(false);
        }
    };

    const handleImagePick = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please allow access to your photo library');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                // Set selected image for preview instead of sending immediately
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const removeSelectedImage = () => {
        setSelectedImage(null);
    };

    const handleDeleteMessage = async (messageId: string) => {
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
                            await deleteMessage(messageId, token!);
                            const msgs = await getMessages(id as string, token!);
                            setMessages(msgs);
                        } catch (error) {
                            console.error('Error deleting message:', error);
                            Alert.alert('Error', 'Failed to delete message');
                        }
                    }
                }
            ]
        );
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleAlbumAccessResponse = async (requestId: string, status: 'approve' | 'reject') => {
        if (processingRequests.has(requestId)) {
            return;
        }

        try {
            setProcessingRequests(prev => new Set(prev).add(requestId));
            await respondToAlbumRequest(requestId, status, token!);
            setRespondedRequests(prev => new Set(prev).add(requestId));
            Alert.alert('Success', `Request ${status === 'approve' ? 'approved' : 'rejected'}`);
        } catch (error) {
            console.error('Error responding to album access request:', error);
            Alert.alert('Error', 'Failed to respond to request');
        } finally {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    const reportReasons = [
        'Inappropriate content',
        'Harassment or bullying',
        'Spam or scam',
        'Fake profile',
        'Underage user',
        'Other'
    ];

    const handleSubmitReport = async () => {
        if (!selectedReason) {
            Alert.alert('Error', 'Please select a reason for reporting');
            return;
        }

        setSubmittingReport(true);
        try {
            await createReport({
                reportedId: id as string,
                reportedType: 'user',
                reason: selectedReason,
                description: additionalInfo.trim()
            }, token!);

            Alert.alert('Success', 'Report submitted successfully');
            setShowReportModal(false);
            setSelectedReason('');
            setAdditionalInfo('');
        } catch (error) {
            console.error('Error submitting report:', error);
            Alert.alert('Error', 'Failed to submit report');
        } finally {
            setSubmittingReport(false);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender._id === user?._id || item.sender === user?._id;

        if (item.type === 'request_album_access') {
            const isOwner = item.recipient._id === user?._id || item.recipient === user?._id;
            const requestId = typeof item.relatedId === 'object' ? item.relatedId._id : item.relatedId;
            const hasResponded = respondedRequests.has(requestId);
            const isProcessing = processingRequests.has(requestId);
            const isDisabled = hasResponded || isProcessing;

            return (
                <View style={styles.systemMessageContainer}>
                    <View style={styles.albumRequestCard}>
                        <View style={styles.albumRequestHeader}>
                            <MaterialIcons name="photo-library" size={24} color={Colors.dark.tint} />
                            <Text style={styles.albumRequestTitle}>Private Album Request</Text>
                        </View>
                        <Text style={styles.albumRequestText}>{item.text}</Text>
                        {isOwner && (
                            <View style={styles.albumRequestButtons}>
                                <TouchableOpacity
                                    style={[styles.albumRequestBtn, styles.albumAllowBtn, isDisabled && styles.albumBtnDisabled]}
                                    onPress={() => !isDisabled && handleAlbumAccessResponse(requestId, 'approve')}
                                    disabled={isDisabled}
                                >
                                    {isProcessing ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialIcons name="check" size={20} color="#fff" />
                                            <Text style={styles.albumRequestBtnText}>Allow</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.albumRequestBtn, styles.albumDenyBtn, isDisabled && styles.albumBtnDisabled]}
                                    onPress={() => !isDisabled && handleAlbumAccessResponse(requestId, 'reject')}
                                    disabled={isDisabled}
                                >
                                    {isProcessing ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialIcons name="close" size={20} color="#fff" />
                                            <Text style={styles.albumRequestBtnText}>Deny</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                        <Text style={styles.albumRequestTime}>{formatTime(item.createdAt)}</Text>
                    </View>
                </View>
            );
        }

        if (item.type === 'album_access_response') {
            const isApproved = item.text?.includes('approved');

            return (
                <View style={styles.systemMessageContainer}>
                    <View style={[styles.albumResponseCard, isApproved ? styles.albumApprovedCard : styles.albumRejectedCard]}>
                        <MaterialIcons
                            name={isApproved ? "check-circle" : "cancel"}
                            size={24}
                            color={isApproved ? "#2ecc71" : "#e74c3c"}
                        />
                        <Text style={styles.albumResponseText}>{item.text}</Text>
                        <Text style={styles.albumRequestTime}>{formatTime(item.createdAt)}</Text>
                    </View>
                </View>
            );
        }

        return (
            <TouchableOpacity
                onLongPress={() => isMe && handleDeleteMessage(item._id)}
                style={[
                    styles.messageContainer,
                    isMe ? styles.myMessageContainer : styles.theirMessageContainer
                ]}
            >
                {!isMe && (
                    <TouchableOpacity onPress={() => router.push(`/user/${id}` as any)}>
                        <Image
                            source={{ uri: otherUser?.img }}
                            style={styles.messageAvatar}
                            contentFit="cover"
                        />
                    </TouchableOpacity>
                )}
                <View style={[
                    styles.messageBubble,
                    isMe ? styles.myMessageBubble : styles.theirMessageBubble
                ]}>
                    {item.image && (
                        <View>
                            <Image
                                source={{ uri: item.image }}
                                style={styles.messageImage}
                                contentFit="cover"
                            />
                            {isMe && (
                                <TouchableOpacity
                                    style={styles.deleteImageButton}
                                    onPress={() => handleDeleteMessage(item._id)}
                                >
                                    <MaterialIcons name="delete-outline" size={20} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
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
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                {otherUser ? (
                    <TouchableOpacity
                        style={styles.headerUserInfo}
                        onPress={() => router.push(`/user/${id}` as any)}
                    >
                        <Image
                            source={{ uri: otherUser.img }}
                            style={styles.headerAvatar}
                            contentFit="cover"
                        />
                        <View>
                            <Text style={styles.headerName}>{otherUser.name}</Text>
                            {getOnlineStatus(otherUser._id, otherUser.isOnline) && (
                                <Text style={styles.headerStatus}>Online</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.headerName}>Chat</Text>
                )}

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerAction} onPress={() => setShowReportModal(true)}>
                        <MaterialIcons name="flag" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.tint} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={[...messages].reverse()}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item._id}
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.messagesList}
                    inverted
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputWrapper}>
                    {selectedImage && (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                            <TouchableOpacity style={styles.removePreviewButton} onPress={removeSelectedImage}>
                                <MaterialIcons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.inputContainer}>
                        <TouchableOpacity
                            style={styles.attachButton}
                            onPress={handleImagePick}
                            disabled={uploadingImage || sending}
                        >
                            {uploadingImage ? (
                                <ActivityIndicator size="small" color={Colors.dark.tint} />
                            ) : (
                                <MaterialIcons name="add-photo-alternate" size={24} color="#888" />
                            )}
                        </TouchableOpacity>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            placeholderTextColor="#666"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            editable={!uploadingImage && !sending}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, ((!inputText.trim() && !selectedImage) || uploadingImage) && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={(!inputText.trim() && !selectedImage) || sending || uploadingImage}
                        >
                            <MaterialIcons name="send" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.bannerContainer}>
                    <View style={styles.bannerAd}>
                        <Text style={styles.bannerText}>Advertisement</Text>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Report Modal */}
            <Modal
                visible={showReportModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowReportModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Report User</Text>
                            <TouchableOpacity onPress={() => setShowReportModal(false)}>
                                <MaterialIcons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalLabel}>Reason for reporting:</Text>
                            {reportReasons.map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    style={[
                                        styles.reasonOption,
                                        selectedReason === reason && styles.reasonOptionSelected
                                    ]}
                                    onPress={() => setSelectedReason(reason)}
                                >
                                    <View style={[
                                        styles.radio,
                                        selectedReason === reason && styles.radioSelected
                                    ]}>
                                        {selectedReason === reason && (
                                            <View style={styles.radioDot} />
                                        )}
                                    </View>
                                    <Text style={styles.reasonText}>{reason}</Text>
                                </TouchableOpacity>
                            ))}

                            <Text style={[styles.modalLabel, { marginTop: 20 }]}>
                                Additional information (optional):
                            </Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Provide more details..."
                                placeholderTextColor="#666"
                                value={additionalInfo}
                                onChangeText={setAdditionalInfo}
                                multiline
                                numberOfLines={4}
                            />
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowReportModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.submitButton]}
                                onPress={handleSubmitReport}
                                disabled={submittingReport}
                            >
                                {submittingReport ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Report</Text>
                                )}
                            </TouchableOpacity>
                        </View>
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
    headerActions: {
        flexDirection: 'row',
        gap: 8,
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
    bannerContainer: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 24,
        backgroundColor: Colors.dark.background,
    },
    bannerAd: {
        height: 60,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    bannerText: {
        color: '#666',
        fontSize: 12,
    },
    systemMessageContainer: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    albumRequestCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        maxWidth: '85%',
        borderWidth: 1,
        borderColor: Colors.dark.tint,
    },
    albumRequestHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    albumRequestTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    albumRequestText: {
        color: '#ccc',
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
    },
    albumRequestButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    albumRequestBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    albumAllowBtn: {
        backgroundColor: '#2ecc71',
    },
    albumDenyBtn: {
        backgroundColor: '#e74c3c',
    },
    albumRequestBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    albumRequestTime: {
        color: '#666',
        fontSize: 10,
        marginTop: 8,
        textAlign: 'right',
    },
    albumResponseCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        maxWidth: '85%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
    },
    albumApprovedCard: {
        borderColor: '#2ecc71',
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
    },
    albumRejectedCard: {
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
    },
    albumResponseText: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
    },
    albumBtnDisabled: {
        opacity: 0.5,
    },
    // Report Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        width: '100%',
        maxHeight: '80%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalBody: {
        padding: 16,
        maxHeight: 400,
    },
    modalLabel: {
        fontSize: 14,
        color: '#ccc',
        marginBottom: 12,
        fontWeight: '600',
    },
    reasonOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#2a2a2a',
    },
    reasonOptionSelected: {
        backgroundColor: 'rgba(166, 7, 214, 0.2)',
        borderWidth: 1,
        borderColor: Colors.dark.tint,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#666',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        borderColor: Colors.dark.tint,
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.dark.tint,
    },
    reasonText: {
        color: '#fff',
        fontSize: 14,
        flex: 1,
    },
    textArea: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 14,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#333',
    },
    submitButton: {
        backgroundColor: Colors.dark.tint,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    inputWrapper: {
        backgroundColor: '#1E1E1E',
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 10,
    },
    previewContainer: {
        padding: 10,
        paddingBottom: 0,
        flexDirection: 'row',
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
        backgroundColor: '#333',
    },
    removePreviewButton: {
        position: 'absolute',
        top: 5,
        left: 85, // width - 15
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        width: 25,
        height: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteImageButton: {
        position: 'absolute',
        bottom: 5,
        left: 5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
