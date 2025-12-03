import React from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 110;

interface User {
    _id: string;
    id?: string;
    name: string;
    img: string;
    isOnline: boolean;
    isVerified: boolean;
    starred?: boolean;
    distance?: number;
}

interface ProfileCardProps {
    user: User;
    isGrid?: boolean;
}

export default function ProfileCard({ user, isGrid }: ProfileCardProps) {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    // For grid: divide screen width by 3 exactly
    const cardWidth = isGrid ? (width / 3) : CARD_WIDTH;
    // Maintain aspect ratio based on width
    const cardHeight = isGrid ? (width / 3) * (4 / 3) : CARD_WIDTH * (4 / 3);

    const handlePress = () => {
        // Check if user is authenticated
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        const userId = user._id || user.id;
        console.log('ProfileCard clicked - User:', { _id: user._id, id: user.id, name: user.name, userId });
        router.push(`/user/${userId}`);
    };

    const displayName = user.name.length > 8
        ? user.name.substring(0, 8) + '...'
        : user.name;

    return (
        <Pressable
            onPress={handlePress}
            style={[
                isGrid ? { padding: 2 } : styles.container, // Use padding wrapper for grid
                {
                    width: cardWidth,
                    height: cardHeight,
                    // Remove margin, use padding for spacing
                }
            ]}
        >
            <View style={[styles.container, { width: '100%', height: '100%' }]}>
                {user.img ? (
                    <Image
                        source={{ uri: user.img }}
                        style={styles.image}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View style={styles.placeholderContainer}>
                        <MaterialIcons name="person" size={60} color="#666" />
                    </View>
                )}

                {user.starred && (
                    <MaterialIcons name="star" size={16} color={Colors.light.tint} style={styles.starIcon} />
                )}

                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                >
                    <View style={styles.infoContainer}>
                        <View style={[styles.statusDot, { backgroundColor: user.isOnline ? '#2ecc71' : '#95a5a6' }]} />
                        <View style={styles.textContainer}>
                            <View style={styles.nameRow}>
                                <Text style={styles.name}>{displayName}</Text>
                                {user.isVerified && (
                                    <MaterialIcons name="verified" size={12} color="#1DA1F2" style={styles.verifiedIcon} />
                                )}
                            </View>
                            {user.distance !== undefined && user.distance !== null && (
                                <Text style={styles.distance}>{(user.distance / 1000).toFixed(1)} km</Text>
                            )}
                        </View>
                    </View>
                </LinearGradient>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#333',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: '#2a2a2a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    starIcon: {
        position: 'absolute',
        top: 5,
        right: 5,
        zIndex: 10,
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        justifyContent: 'flex-end',
        padding: 5,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#fff',
        marginRight: 5,
    },
    textContainer: {
        flexDirection: 'column',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    verifiedIcon: {
        marginLeft: 4,
    },
    distance: {
        fontSize: 10,
        color: '#ccc',
    },
});
