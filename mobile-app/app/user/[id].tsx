import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Modal, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { getUser, toggleFavorite, blockUser, unblockUser, requestAlbumAccess, checkAlbumAccess } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const { width } = Dimensions.get('window');

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user: currentUser, token, addBlockedUser, removeBlockedUser, updateUser, blockedUsers } = useAuth();
    const { socket } = useSocket();
    const { getOnlineStatus } = useOnlineStatus();

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [lightboxVisible, setLightboxVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);

    // Album Access State
    const [albumAccessStatus, setAlbumAccessStatus] = useState<{
        hasAccess: boolean;
        hasPendingRequest: boolean;
        isOwner: boolean;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !token) return;

            try {
                const userData = await getUser(id as string, token);
                setUser(userData);

                // Check if favorite
                if (currentUser && (currentUser as any).favorites?.includes(id)) {
                    setIsFavorite(true);
                }

                // Check if blocked
                if (blockedUsers.includes(id as string)) {
                    setIsBlocked(true);
                }

                // Check album access status
                const accessStatus = await checkAlbumAccess(id as string, token);
                setAlbumAccessStatus(accessStatus);
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, token, currentUser]);



    // Socket listener for blocked event
    useEffect(() => {
        if (!socket) return;

        const handleBlocked = (data: any) => {
            if (data.byUser === id) {
                Alert.alert('Access Denied', 'You have been blocked by this user.', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        };

        socket.on('blocked', handleBlocked);

        return () => {
            socket.off('blocked', handleBlocked);
        };
    }, [socket, id]);

    const openLightbox = (images: string[], index: number) => {
        setLightboxImages(images);
        setCurrentImageIndex(index);
        setLightboxVisible(true);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % lightboxImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
    };

    const closeLightbox = () => {
        setLightboxVisible(false);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${user?.name}'s profile on GTHAILOVER!`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleFavorite = async () => {
        if (!token || !user) return;
        try {
            await toggleFavorite(user._id, token);
            const newIsFavorite = !isFavorite;
            setIsFavorite(newIsFavorite);

            // Update currentUser favorites in AuthContext to persist the change
            if (currentUser) {
                const updatedFavorites = newIsFavorite
                    ? [...(currentUser.favorites || []), user._id]
                    : (currentUser.favorites || []).filter((favId: string) => favId !== user._id);

                const updatedUser = {
                    ...currentUser,
                    favorites: updatedFavorites
                };

                // Update in AuthContext
                await updateUser(updatedUser);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            Alert.alert('Error', 'Failed to update favorite status');
        }
    };

    const handleBlock = () => {
        Alert.alert(
            'Block User',
            'Are you sure you want to block this user?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Block',
                    style: 'destructive',
                    onPress: async () => {
                        if (!token || !user) return;
                        try {
                            await blockUser(user._id, token);
                            addBlockedUser(user._id);
                            setIsBlocked(true);
                            Alert.alert('Success', 'User blocked');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to block user');
                        }
                    }
                }
            ]
        );
    };

    const handleUnblock = () => {
        Alert.alert(
            'Unblock User',
            'Are you sure you want to unblock this user?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unblock',
                    onPress: async () => {
                        if (!token || !user) return;
                        try {
                            await unblockUser(user._id, token);
                            removeBlockedUser(user._id);
                            setIsBlocked(false);
                            Alert.alert('Success', 'User unblocked');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to unblock user');
                        }
                    }
                }
            ]
        );
    };

    const handleRequestPrivateAlbum = async () => {
        if (!token || !user) return;

        try {
            await requestAlbumAccess(user._id, token);
            // Update local state
            setAlbumAccessStatus({
                ...albumAccessStatus!,
                hasPendingRequest: true
            });
            Alert.alert('Success', 'Request sent successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send request');
        }
    };


    if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <ScrollView style={styles.container} bounces={false}>
                    {/* Skeleton Cover */}
                    <View style={[styles.coverContainer, { backgroundColor: '#2a2a2a' }]}>
                        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
                            <MaterialIcons name="arrow-back" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.contentContainer}>
                        {/* Skeleton Header */}
                        <View style={styles.headerInfo}>
                            <View style={styles.avatarContainer}>
                                <View style={[styles.avatar, { backgroundColor: '#2a2a2a' }]} />
                            </View>
                            <View style={styles.nameContainer}>
                                <View style={{ width: 120, height: 24, backgroundColor: '#2a2a2a', borderRadius: 4, marginBottom: 8 }} />
                                <View style={{ width: 80, height: 14, backgroundColor: '#2a2a2a', borderRadius: 4 }} />
                            </View>
                        </View>

                        {/* Skeleton Stats */}
                        <View style={styles.statsContainer}>
                            {[1, 2, 3].map((i) => (
                                <View key={i} style={styles.statItem}>
                                    <View style={{ width: 40, height: 12, backgroundColor: '#333', borderRadius: 4, marginBottom: 4 }} />
                                    <View style={{ width: 50, height: 16, backgroundColor: '#333', borderRadius: 4 }} />
                                </View>
                            ))}
                        </View>

                        {/* Skeleton Actions */}
                        <View style={styles.actionsContainer}>
                            <View style={styles.actionButtonsGrid}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <View key={i} style={[styles.actionBtn, { backgroundColor: '#2a2a2a', flexBasis: '48%' }]}>
                                        <View style={{ width: 60, height: 16, backgroundColor: '#333', borderRadius: 4 }} />
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Loading indicator */}
                        <View style={{ alignItems: 'center', marginTop: 20 }}>
                            <ActivityIndicator size="large" color={Colors.dark.tint} />
                        </View>
                    </View>
                </ScrollView>
            </>
        );
    }

    if (!user) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>User not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isOwnProfile = currentUser._id === user._id;

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView style={styles.container} bounces={false}>
                {/* Cover Image */}
                <View style={styles.coverContainer}>
                    <Image
                        source={{ uri: user.cover || 'https://via.placeholder.com/600x200' }}
                        style={styles.coverImage}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.coverGradient}
                    />
                    <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.contentContainer}>
                    {/* Header Info */}
                    <View style={styles.headerInfo}>
                        <View style={styles.avatarContainer}>
                            <TouchableOpacity onPress={() => openLightbox([user.img], 0)}>
                                <Image
                                    source={{ uri: user.img }}
                                    style={styles.avatar}
                                    contentFit="cover"
                                />
                            </TouchableOpacity>
                            <View style={[styles.statusDot, { backgroundColor: getOnlineStatus(user._id, user.isOnline) ? '#2ecc71' : '#95a5a6' }]} />
                        </View>

                        <View style={styles.nameContainer}>
                            <Text style={styles.name}>{user.name}</Text>
                            <View style={styles.statusContainer}>
                                <View style={[styles.statusDotSmall, { backgroundColor: getOnlineStatus(user._id, user.isOnline) ? '#2ecc71' : '#95a5a6' }]} />
                                <Text style={[styles.statusText, { color: getOnlineStatus(user._id, user.isOnline) ? '#2ecc71' : '#95a5a6' }]}>
                                    {getOnlineStatus(user._id, user.isOnline) ? 'Online' : 'Offline'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Age</Text>
                            <Text style={styles.statValue}>{user.age || '-'}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Height</Text>
                            <Text style={styles.statValue}>{user.height ? `${user.height} cm` : '-'}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Weight</Text>
                            <Text style={styles.statValue}>{user.weight ? `${user.weight} kg` : '-'}</Text>
                        </View>
                    </View>

                    {/* Details */}
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailRow}>
                            <MaterialIcons name="location-on" size={20} color={Colors.dark.icon} />
                            <Text style={styles.detailText}>{user.country || 'Unknown Location'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <MaterialIcons name="search" size={20} color={Colors.dark.icon} />
                            <Text style={styles.detailText}>
                                Looking for {user.lookingFor ? user.lookingFor.join(', ') : '-'}
                            </Text>
                        </View>
                    </View>

                    {/* Bio */}
                    {user.bio && (
                        <View style={styles.bioContainer}>
                            <Text style={styles.sectionTitle}>About Me</Text>
                            <Text style={styles.bioText}>{user.bio}</Text>
                        </View>
                    )}

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        {isOwnProfile ? (
                            <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => router.push('/edit-profile')}>
                                <MaterialIcons name="edit" size={20} color="#fff" />
                                <Text style={styles.actionBtnText}>Edit Profile</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.actionButtonsGrid}>
                                <TouchableOpacity style={[styles.actionBtn, styles.chatBtn]} onPress={() => router.push(`/chat/${user._id}`)}>
                                    <MaterialIcons name="chat-bubble" size={20} color="#fff" />
                                    <Text style={styles.actionBtnText}>Chat</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.favBtn, isFavorite && styles.favBtnActive]}
                                    onPress={handleToggleFavorite}
                                >
                                    <MaterialIcons name={isFavorite ? "star" : "star-border"} size={20} color="#fff" />
                                    <Text style={styles.actionBtnText}>{isFavorite ? 'Favorited' : 'Favorite'}</Text>
                                </TouchableOpacity>

                                {isBlocked ? (
                                    <TouchableOpacity style={[styles.actionBtn, styles.unblockBtn]} onPress={handleUnblock}>
                                        <MaterialIcons name="block" size={20} color="#fff" />
                                        <Text style={styles.actionBtnText}>Unblock</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity style={[styles.actionBtn, styles.blockBtn]} onPress={handleBlock}>
                                        <MaterialIcons name="block" size={20} color="#fff" />
                                        <Text style={styles.actionBtnText}>Block</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity style={[styles.actionBtn, styles.reportBtn]} onPress={() => router.push(`/report/user/${user._id}`)}>
                                    <MaterialIcons name="flag" size={20} color="#fff" />
                                    <Text style={styles.actionBtnText}>Report</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Public Gallery */}
                    {user.gallery && user.gallery.length > 0 && (
                        <View style={styles.gallerySection}>
                            <Text style={styles.sectionTitle}>Photos</Text>
                            <View style={styles.galleryGrid}>
                                {user.gallery.map((img: string, index: number) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.galleryItem}
                                        onPress={() => openLightbox(user.gallery, index)}
                                    >
                                        <Image source={{ uri: img }} style={styles.galleryImage} contentFit="cover" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Private Album */}
                    <View style={styles.gallerySection}>
                        <View style={styles.privateHeader}>
                            <Text style={styles.sectionTitle}>Private Album</Text>
                            {!isOwnProfile && !albumAccessStatus?.hasAccess && <MaterialIcons name="lock" size={16} color="#888" />}
                        </View>

                        {albumAccessStatus?.isOwner || albumAccessStatus?.hasAccess ? (
                            // Show private album if owner or has access
                            user.privateAlbum && user.privateAlbum.length > 0 ? (
                                <View style={styles.galleryGrid}>
                                    {user.privateAlbum.map((img: string, index: number) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.galleryItem}
                                            onPress={() => openLightbox(user.privateAlbum, index)}
                                        >
                                            <Image source={{ uri: img }} style={styles.galleryImage} contentFit="cover" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.privatePlaceholder}>
                                    <MaterialIcons name="photo-library" size={30} color="#666" />
                                    <Text style={styles.privateSubText}>No photos in private album</Text>
                                </View>
                            )
                        ) : (
                            // Show request button or pending status
                            <View style={styles.privatePlaceholder}>
                                <View style={styles.lockIconContainer}>
                                    <MaterialIcons
                                        name={albumAccessStatus?.hasPendingRequest ? "schedule" : "lock"}
                                        size={30}
                                        color={albumAccessStatus?.hasPendingRequest ? "#FFA500" : Colors.dark.tint}
                                    />
                                </View>
                                <Text style={styles.privateText}>Private Album</Text>
                                <Text style={styles.privateSubText}>
                                    {albumAccessStatus?.hasPendingRequest
                                        ? 'Request pending...'
                                        : 'Request access to view photos'}
                                </Text>
                                {!albumAccessStatus?.hasPendingRequest && (
                                    <TouchableOpacity style={styles.requestBtn} onPress={handleRequestPrivateAlbum}>
                                        <Text style={styles.requestBtnText}>Request Access</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>

                </View>
            </ScrollView>

            {/* Image Lightbox Modal */}
            <Modal
                visible={lightboxVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeLightbox}
            >
                <View style={styles.lightboxContainer}>
                    <TouchableOpacity style={styles.lightboxClose} onPress={closeLightbox}>
                        <MaterialIcons name="close" size={32} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.lightboxContent}>
                        {lightboxImages.length > 0 && (
                            <Image
                                source={{ uri: lightboxImages[currentImageIndex] }}
                                style={styles.lightboxImage}
                                contentFit="contain"
                            />
                        )}
                    </View>

                    {lightboxImages.length > 1 && (
                        <>
                            <TouchableOpacity style={styles.lightboxNavLeft} onPress={prevImage}>
                                <MaterialIcons name="chevron-left" size={40} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.lightboxNavRight} onPress={nextImage}>
                                <MaterialIcons name="chevron-right" size={40} color="#fff" />
                            </TouchableOpacity>
                        </>
                    )}

                    <View style={styles.lightboxCounter}>
                        <Text style={styles.lightboxCounterText}>
                            {currentImageIndex + 1} / {lightboxImages.length}
                        </Text>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.dark.background,
    },
    errorText: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 20,
    },
    backButton: {
        padding: 10,
        backgroundColor: Colors.dark.tint,
        borderRadius: 5,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    coverContainer: {
        height: 200,
        width: '100%',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    backIcon: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        padding: 4,
    },
    contentContainer: {
        marginTop: -50,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: Colors.dark.background,
    },
    statusDot: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 3,
        borderColor: Colors.dark.background,
    },
    nameContainer: {
        marginBottom: 10,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDotSmall: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#333',
    },
    detailsContainer: {
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailText: {
        color: '#ccc',
        marginLeft: 10,
        fontSize: 16,
    },
    bioContainer: {
        marginBottom: 25,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    bioText: {
        color: '#a0a0a0',
        fontSize: 14,
        lineHeight: 22,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 30,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 25,
        gap: 8,
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    editBtn: {
        backgroundColor: '#333',
    },
    chatBtn: {
        backgroundColor: '#FF6B35', // Bright orange
        flexBasis: '48%',
    },
    favBtn: {
        backgroundColor: '#28A745', // Green
        flexBasis: '48%',
    },
    favBtnActive: {
        backgroundColor: '#20C997', // Lighter green when active
    },
    blockBtn: {
        backgroundColor: '#E63946', // Red
        flexBasis: '48%',
    },
    unblockBtn: {
        backgroundColor: '#555', // Grey
        flexBasis: '48%',
    },
    reportBtn: {
        backgroundColor: '#D62828', // Darker red
        flexBasis: '48%',
    },
    actionButtonsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        width: '100%',
    },
    gallerySection: {
        marginBottom: 25,
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
    },
    galleryItem: {
        width: (width - 40 - 10) / 3, // 3 columns, minus padding and gap
        height: (width - 40 - 10) / 3,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 5,
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    privateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    privatePlaceholder: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(166, 7, 214, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    privateText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
    },
    privateSubText: {
        color: '#888',
        fontSize: 14,
        marginBottom: 20,
    },
    requestBtn: {
        backgroundColor: Colors.dark.tint,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    requestBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    lightboxContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lightboxClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    lightboxContent: {
        width: '100%',
        height: '80%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lightboxImage: {
        width: '100%',
        height: '100%',
    },
    lightboxNavLeft: {
        position: 'absolute',
        left: 20,
        top: '50%',
        marginTop: -20,
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
    },
    lightboxNavRight: {
        position: 'absolute',
        right: 20,
        top: '50%',
        marginTop: -20,
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
    },
    lightboxCounter: {
        position: 'absolute',
        bottom: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    lightboxCounterText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
