import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import { getUser } from '@/services/api';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
    const { isAuthenticated } = useProtectedRoute();
    const { user: authUser, token, logout } = useAuth();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && authUser && token) {
            fetchProfile();
        }
    }, [isAuthenticated, authUser, token]);

    const fetchProfile = async () => {
        try {
            const userData = await getUser(authUser._id, token!);
            setUser(userData);
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        // Router redirection is handled by useProtectedRoute or AuthContext
                    }
                }
            ]
        );
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.tint} />
                </View>
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Profile not found</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <ScrollView style={styles.container} bounces={false}>
            {/* Cover Image */}
            <View style={styles.coverContainer}>
                <Image
                    source={{ uri: user.cover || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800' }}
                    style={styles.coverImage}
                    contentFit="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.coverGradient}
                />
            </View>

            <View style={styles.contentContainer}>
                {/* Header Info */}
                <View style={styles.headerInfo}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: user.img }}
                            style={styles.avatar}
                            contentFit="cover"
                        />
                        <View style={[styles.statusDot, { backgroundColor: user.isOnline ? '#2ecc71' : '#95a5a6' }]} />
                    </View>

                    <View style={styles.nameContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.name}>{user.name}</Text>
                            {user.isVerified && (
                                <MaterialIcons name="verified" size={20} color="#1DA1F2" style={{ marginLeft: 6 }} />
                            )}
                        </View>
                        <View style={styles.statusContainer}>
                            <View style={[styles.statusDotSmall, { backgroundColor: user.isOnline ? '#2ecc71' : '#95a5a6' }]} />
                            <Text style={[styles.statusText, { color: user.isOnline ? '#2ecc71' : '#95a5a6' }]}>
                                {user.isOnline ? 'Online' : 'Offline'}
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

                {/* Edit Profile Button */}
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => Alert.alert('Coming Soon', 'Edit Profile feature will be available soon!')}
                >
                    <MaterialIcons name="edit" size={20} color="#fff" />
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>

                {/* Details */}
                {user.country && (
                    <View style={styles.detailRow}>
                        <MaterialIcons name="location-on" size={20} color={Colors.dark.tint} />
                        <Text style={styles.detailText}>{user.country}</Text>
                    </View>
                )}

                {user.lookingFor && (
                    <View style={styles.detailRow}>
                        <MaterialIcons name="favorite" size={20} color={Colors.dark.tint} />
                        <Text style={styles.detailText}>{user.lookingFor}</Text>
                    </View>
                )}

                {/* Bio */}
                {user.bio && (
                    <View style={styles.bioContainer}>
                        <Text style={styles.sectionTitle}>About Me</Text>
                        <Text style={styles.bioText}>{user.bio}</Text>
                    </View>
                )}

                {/* Public Gallery */}
                {user.gallery && user.gallery.length > 0 && (
                    <View style={styles.gallerySection}>
                        <Text style={styles.sectionTitle}>Photos</Text>
                        <View style={styles.galleryGrid}>
                            {user.gallery.map((img: string, index: number) => (
                                <TouchableOpacity key={index} style={styles.galleryItem}>
                                    <Image source={{ uri: img }} style={styles.galleryImage} contentFit="cover" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Settings Options */}
                <View style={styles.settingsSection}>
                    <Text style={styles.sectionTitle}>Settings</Text>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <MaterialIcons name="notifications" size={24} color="#888" />
                            <Text style={styles.settingText}>Notifications</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#888" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <MaterialIcons name="lock" size={24} color="#888" />
                            <Text style={styles.settingText}>Privacy</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#888" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <MaterialIcons name="language" size={24} color="#888" />
                            <Text style={styles.settingText}>Language</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#888" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <MaterialIcons name="help" size={24} color="#888" />
                            <Text style={styles.settingText}>Help & Support</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#888" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.settingItem, { borderBottomWidth: 0 }]}
                        onPress={handleLogout}
                    >
                        <View style={styles.settingLeft}>
                            <MaterialIcons name="logout" size={24} color="#ff4444" />
                            <Text style={[styles.settingText, { color: '#ff4444' }]}>Logout</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#ff4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
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
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 16,
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.dark.tint,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    coverContainer: {
        height: 200,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 100,
    },
    contentContainer: {
        padding: 20,
        marginTop: -40,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
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
        borderWidth: 4,
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
        flex: 1,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusDotSmall: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#333',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
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
        fontWeight: 'bold',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#444',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.dark.tint,
        paddingVertical: 12,
        borderRadius: 25,
        marginBottom: 24,
    },
    editButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailText: {
        color: '#ccc',
        fontSize: 16,
        marginLeft: 10,
    },
    bioContainer: {
        marginTop: 12,
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    bioText: {
        color: '#ccc',
        fontSize: 15,
        lineHeight: 22,
    },
    settingsSection: {
        marginBottom: 24,
        backgroundColor: '#333',
        borderRadius: 12,
        padding: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 12,
    },
    gallerySection: {
        marginBottom: 20,
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    galleryItem: {
        width: '31%',
        aspectRatio: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
});
