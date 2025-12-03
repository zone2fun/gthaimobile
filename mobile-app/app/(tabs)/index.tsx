import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, TouchableOpacity, RefreshControl, Modal, TouchableWithoutFeedback, Animated, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Section from '@/components/Section';
import { getFreshFaces, getUsers, getUser } from '@/services/api';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout, token } = useAuth();
  const [freshFaces, setFreshFaces] = useState<any[] | null>(null);
  const [favourites, setFavourites] = useState<any[] | null>(null);
  const [nearby, setNearby] = useState<any[] | null>(null);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Menu State
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  const fetchData = async () => {
    try {
      // Use token from auth context, fallback to mock-token for guest users
      const authToken = token || 'mock-token';

      const freshUsers = await getFreshFaces(authToken);
      setFreshFaces(freshUsers as any[]);

      const allUsers = await getUsers(authToken);
      setNearby(allUsers as any[]);

      // Fetch favorites if user is authenticated
      if (isAuthenticated && user && token) {
        const currentUserProfile: any = await getUser(user._id, token);
        if (currentUserProfile && currentUserProfile.favorites) {
          const favs = (allUsers as any[]).filter(u =>
            currentUserProfile.favorites.includes(u._id || u.id)
          );
          setFavourites(favs);
        } else {
          setFavourites([]);
        }
      } else {
        // Guest user has no favourites
        setFavourites([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const toggleMenu = (show: boolean) => {
    if (show) {
      setIsMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsMenuVisible(false));
    }
  };

  const filterUsers = (users: any[] | null) => {
    if (!users) return users;
    let filtered = users;
    if (showOnlineOnly) {
      filtered = filtered.filter(u => u.isOnline);
    }
    if (showVerifiedOnly) {
      filtered = filtered.filter(u => u.isVerified);
    }
    return filtered;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => {
            if (!isAuthenticated) {
              router.push('/login');
            }
            // TODO: Navigate to search page when authenticated
          }}
        >
          <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
          <Text style={styles.placeholderText}>Search...</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn} onPress={() => toggleMenu(true)}>
          {isAuthenticated && user?.img ? (
            <Image source={{ uri: user.img }} style={styles.headerAvatar} />
          ) : (
            <MaterialIcons name="menu" size={28} color={Colors.dark.text} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.tint} />}
      >
        {/* Filters */}
        <View style={styles.filterContainer}>
          <View style={styles.filterItem}>
            <Text style={[styles.filterLabel, showOnlineOnly && { color: '#2ecc71' }]}>Online</Text>
            <Switch
              value={showOnlineOnly}
              onValueChange={setShowOnlineOnly}
              trackColor={{ false: '#767577', true: '#2ecc71' }}
              thumbColor={showOnlineOnly ? '#fff' : '#f4f3f4'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
          <View style={styles.filterItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.filterLabel, showVerifiedOnly && { color: '#1DA1F2' }]}>Verify</Text>
              {showVerifiedOnly && <MaterialIcons name="verified" size={14} color="#1DA1F2" />}
            </View>
            <Switch
              value={showVerifiedOnly}
              onValueChange={setShowVerifiedOnly}
              trackColor={{ false: '#767577', true: '#1DA1F2' }}
              thumbColor={showVerifiedOnly ? '#fff' : '#f4f3f4'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>

        {loading ? (
          <>
            {/* Skeleton Loading */}
            <View style={styles.skeletonSection}>
              <View style={styles.skeletonTitle} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.skeletonScroll}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeletonCard}>
                    <View style={styles.skeletonImage} />
                    <View style={styles.skeletonText} />
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.skeletonSection}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <View key={i} style={styles.skeletonGridCard}>
                    <View style={styles.skeletonGridImage} />
                    <View style={styles.skeletonGridText} />
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            <Section title="Fresh Faces" items={filterUsers(freshFaces)} />
            {isAuthenticated && favourites && favourites.length > 0 && (
              <Section title="Favourites" items={filterUsers(favourites)} />
            )}
            <Section title="Nearby" items={filterUsers(nearby)} isGrid={true} />
          </>
        )}
      </ScrollView>

      {/* Side Menu Modal */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        onRequestClose={() => toggleMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => toggleMenu(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.menuContainer,
                  { transform: [{ translateX: slideAnim }] }
                ]}
              >
                <View style={styles.menuHeader}>
                  <Image
                    source={require('@/assets/images/logo.png')}
                    style={styles.menuLogo}
                    resizeMode="contain"
                  />
                  <View style={styles.menuAvatarContainer}>
                    {isAuthenticated && user?.img ? (
                      <Image source={{ uri: user.img }} style={styles.menuAvatar} />
                    ) : (
                      <MaterialIcons name="person" size={40} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.menuHeaderText}>
                    {isAuthenticated ? `Signed in as: ${user?.name || user?.username}` : 'Signed in as: Guest'}
                  </Text>
                </View>

                <View style={styles.menuItems}>
                  <TouchableOpacity style={styles.menuItem}>
                    <MaterialIcons name="security" size={24} color="#ccc" />
                    <Text style={styles.menuItemText}>Safety Policy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      toggleMenu(false);
                      if (isAuthenticated) {
                        logout();
                      } else {
                        router.push('/login' as any);
                      }
                    }}
                  >
                    <MaterialIcons name={isAuthenticated ? "logout" : "login"} size={24} color="#ccc" />
                    <Text style={styles.menuItemText}>{isAuthenticated ? "Logout" : "Login"}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.menuFooter}>
                  <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.dark.background,
  },
  logoContainer: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 40,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  placeholderText: {
    color: '#999',
  },
  menuBtn: {
    padding: 5,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 15,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterLabel: {
    fontSize: 14,
    color: '#a0a0a0',
    fontWeight: '500',
  },
  skeletonSection: {
    padding: 15,
  },
  skeletonTitle: {
    width: 120,
    height: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    marginBottom: 15,
  },
  skeletonScroll: {
    marginHorizontal: -15,
    paddingHorizontal: 15,
  },
  skeletonCard: {
    width: 140,
    marginRight: 10,
  },
  skeletonImage: {
    width: 140,
    height: 180,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 8,
  },
  skeletonText: {
    width: 100,
    height: 14,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skeletonGridCard: {
    width: '31%',
  },
  skeletonGridImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 8,
  },
  skeletonGridText: {
    width: '80%',
    height: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
  },
  // Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    width: '75%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    alignItems: 'center',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 20,
  },
  menuLogo: {
    width: 200,
    height: 80,
    marginBottom: 20,
    marginHorizontal: 30,
  },
  menuAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  menuAvatar: {
    width: '100%',
    height: '100%',
  },
  menuHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  menuItemText: {
    color: '#ccc',
    fontSize: 16,
    marginLeft: 16,
  },
  menuFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  versionText: {
    color: '#666',
    fontSize: 12,
  },
});
