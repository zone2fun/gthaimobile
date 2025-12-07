import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { getUsers, getUser } from '@/services/api';
import ProfileCard from '@/components/ProfileCard';
import { AdBanner } from '@/components/AdBanner';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';

export default function FavouritesScreen() {
    const { isAuthenticated } = useProtectedRoute();
    const { user, token, blockedUsers } = useAuth();
    const { socket } = useSocket();
    const [favourites, setFavourites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchFavourites = async () => {
        try {
            if (isAuthenticated && user && token) {
                const allUsers = await getUsers(token);
                const currentUserProfile: any = await getUser(user._id, token);

                if (currentUserProfile && currentUserProfile.favorites) {
                    const favs = (allUsers as any[]).filter(u =>
                        currentUserProfile.favorites.includes(u._id || u.id) &&
                        !blockedUsers.includes(u._id || u.id)
                    );
                    setFavourites(favs);
                } else {
                    setFavourites([]);
                }
            } else {
                setFavourites([]);
            }
        } catch (error) {
            console.error("Error fetching favourites:", error);
            setFavourites([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavourites();
    }, [blockedUsers]);

    // Listen for socket events to refresh favourites (e.g. if someone blocks us)
    useEffect(() => {
        if (!socket) return;
        socket.on('blocked', fetchFavourites);
        socket.on('unblocked', fetchFavourites);
        return () => {
            socket.off('blocked', fetchFavourites);
            socket.off('unblocked', fetchFavourites);
        };
    }, [socket]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchFavourites();
        setRefreshing(false);
    };

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Favourites</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.dark.tint} />
                </View>

                {/* Ad Banner */}
                <AdBanner />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Favourites</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.tint} />
                }
            >
                {favourites.length > 0 ? (
                    <View style={styles.gridContainer}>
                        {favourites.map((user) => (
                            <ProfileCard key={user._id || user.id} user={user} isGrid={true} />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>⭐</Text>
                        <Text style={styles.emptyText}>No favourites yet</Text>
                        <Text style={styles.emptySubText}>
                            Add people to your favourites to see them here
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Ad Banner */}
            <AdBanner />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
        paddingTop: 10,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.dark.text,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
