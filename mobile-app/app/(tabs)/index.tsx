import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, TouchableOpacity, RefreshControl, Modal, TouchableWithoutFeedback, Animated, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Section from '@/components/Section';
import { AdBanner } from '@/components/AdBanner';
import { getFreshFaces, getUsers, getUser, getNotifications, markNotificationAsRead, markAllNotificationsAsRead, BASE_URL, updateLocation as updateLocationAPI } from '@/services/api';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import * as Location from 'expo-location';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout, token, blockedUsers } = useAuth();
  const { socket } = useSocket();
  const handleApiCall = useApiErrorHandler();

  const updateLocation = async () => {
    if (!user || !token) return;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      await updateLocationAPI(
        location.coords.latitude,
        location.coords.longitude,
        token
      );
      console.log('Location updated via Notification Bell');
    } catch (error) {
      console.log('Error updating location:', error);
    }
  };
  const [freshFaces, setFreshFaces] = useState<any[] | null>(null);
  const [favourites, setFavourites] = useState<any[] | null>(null);
  const [nearby, setNearby] = useState<any[] | null>(null);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notification State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);

  // Menu State
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  const fetchData = async () => {
    try {
      // Use token from auth context, fallback to mock-token for guest users
      const authToken = token || 'mock-token';

      const freshUsers = await handleApiCall(
        async () => await getFreshFaces(authToken),
        fetchData
      );
      if (freshUsers) {
        setFreshFaces((freshUsers as any[]).filter(u => !blockedUsers.includes(u._id)));
      }

      const allUsers = await handleApiCall(
        async () => await getUsers(authToken),
        fetchData
      );
      if (allUsers) {
        setNearby((allUsers as any[]).filter(u => !blockedUsers.includes(u._id)));

        // Fetch favorites if user is authenticated
        if (isAuthenticated && user && token) {
          const currentUserProfile: any = await handleApiCall(
            async () => await getUser(user._id, token),
            fetchData
          );
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
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated || !token) return;

    const notifs = await handleApiCall(
      async () => await getNotifications(token),
      fetchNotifications
    );

    if (notifs) {
      setNotifications(notifs);
      const unread = notifs.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    }
  };

  useEffect(() => {
    fetchData();
    if (isAuthenticated && token) {
      fetchNotifications();
    }
  }, [isAuthenticated, token, blockedUsers]);

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNewNotification = (notification: any) => {
      // Transform image URLs
      const transformedNotif = {
        ...notification,
        sender: notification.sender ? {
          ...notification.sender,
          img: notification.sender.img?.startsWith('http')
            ? notification.sender.img
            : notification.sender.img?.startsWith('/')
              ? `${BASE_URL}${notification.sender.img}`
              : `${BASE_URL}/${notification.sender.img}`
        } : null
      };
      setNotifications(prev => [transformedNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('new notification', handleNewNotification);

    // Listen for block events to refresh user lists
    socket.on('blocked', fetchData);
    socket.on('unblocked', fetchData);

    return () => {
      socket.off('new notification', handleNewNotification);
      socket.off('blocked', fetchData);
      socket.off('unblocked', fetchData);
    };
  }, [socket, isAuthenticated]);

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
          onPress={() => router.push('/search')}
        >
          <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
          <Text style={styles.placeholderText}>Search...</Text>
        </TouchableOpacity>
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => {
              updateLocation();
              setIsNotificationModalVisible(true);
            }}
          >
            <View>
              <MaterialIcons name="notifications-none" size={28} color={Colors.dark.text} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.menuBtn} onPress={() => toggleMenu(true)}>
          {isAuthenticated && user?.img ? (
            <View>
              <Image source={{ uri: user.img }} style={styles.headerAvatar} />
              {user.isVerified && (
                <View style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  backgroundColor: 'white',
                  borderRadius: 10,
                  padding: 1,
                }}>
                  <MaterialIcons name="verified" size={12} color="#1DA1F2" />
                </View>
              )}
            </View>
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
                      <View>
                        <Image source={{ uri: user.img }} style={styles.menuAvatar} />
                        {user.isVerified && (
                          <View style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            backgroundColor: 'white',
                            borderRadius: 12,
                            padding: 2,
                          }}>
                            <MaterialIcons name="verified" size={20} color="#1DA1F2" />
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: '#333',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <MaterialIcons name="person" size={40} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuHeaderText}>
                    {isAuthenticated ? `Signed in as: ${user?.name || user?.username}` : 'Signed in as: Guest'}
                  </Text>
                </View>

                <View style={styles.menuItems}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      toggleMenu(false);
                      router.push('/safety-policy' as any);
                    }}
                  >
                    <MaterialIcons name="security" size={24} color="#ccc" />
                    <Text style={styles.menuItemText}>Safety Policy</Text>
                  </TouchableOpacity>

                  {isAuthenticated && (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        toggleMenu(false);
                        router.push('/blocked-users' as any);
                      }}
                    >
                      <MaterialIcons name="block" size={24} color="#ccc" />
                      <Text style={styles.menuItemText}>Blocked Users</Text>
                    </TouchableOpacity>
                  )}

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

      {/* Notification Modal */}
      <Modal
        visible={isNotificationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNotificationModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsNotificationModalVisible(false)}>
          <View style={styles.notificationModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.notificationModalContent}>
                <View style={styles.notificationModalHeader}>
                  <Text style={styles.notificationModalTitle}>Notifications</Text>
                  <View style={styles.notificationHeaderActions}>
                    {unreadCount > 0 && (
                      <TouchableOpacity
                        style={styles.markAllReadBtn}
                        onPress={async () => {
                          try {
                            await markAllNotificationsAsRead(token!);
                            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            setUnreadCount(0);
                          } catch (error) {
                            console.error('Error marking all as read:', error);
                          }
                        }}
                      >
                        <MaterialIcons name="done-all" size={20} color={Colors.dark.tint} />
                        <Text style={styles.markAllReadText}>Mark All</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => setIsNotificationModalVisible(false)}>
                      <MaterialIcons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView style={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <View style={styles.emptyNotifications}>
                      <MaterialIcons name="notifications-off" size={48} color="#666" />
                      <Text style={styles.emptyNotificationsText}>No notifications yet</Text>
                    </View>
                  ) : (
                    notifications.map((notif) => (
                      <TouchableOpacity
                        key={notif._id}
                        style={[
                          styles.notificationItem,
                          !notif.read && styles.unreadNotification
                        ]}
                        onPress={async () => {
                          // Mark as read
                          if (!notif.read && token) {
                            try {
                              await markNotificationAsRead(notif._id, token);
                              setNotifications(prev =>
                                prev.map(n => n._id === notif._id ? { ...n, read: true } : n)
                              );
                              setUnreadCount(prev => Math.max(0, prev - 1));
                            } catch (error) {
                              console.error('Error marking as read:', error);
                            }
                          }

                          // Navigate based on notification type
                          setIsNotificationModalVisible(false);
                          if (notif.type === 'like_post' || notif.type === 'comment_post') {
                            // Navigate to special feed with postId parameter
                            if (notif.post?._id) {
                              router.push({
                                pathname: '/(tabs)/special',
                                params: { highlightPostId: notif.post._id }
                              });
                            } else {
                              router.push('/(tabs)/special');
                            }
                          } else if (notif.type === 'message') {
                            // Navigate to chat
                            router.push('/(tabs)/chat');
                          } else if (notif.type === 'photo_approved' || notif.type === 'photo_denied') {
                            // Navigate to profile page for photo approval/denial
                            router.push('/(tabs)/profile');
                          } else if (notif.type === 'post_approved' || notif.type === 'post_rejected') {
                            // Navigate to special feed for post approval/rejection
                            router.push('/(tabs)/special');
                          } else if (notif.type === 'verification_approved' || notif.type === 'verification_denied') {
                            // Navigate to profile page for verification status
                            router.push('/(tabs)/profile');
                          } else if (notif.type !== 'report' && notif.type !== 'admin_notification' && notif.sender) {
                            // Navigate to sender's profile for other types (except report and admin notifications)
                            router.push(`/user/${notif.sender._id}`);
                          }
                          // For report and admin_notification types, just close the modal without navigation
                        }}
                      >
                        {notif.type === 'report' || !notif.sender?.img ? (
                          <View style={[styles.notificationAvatar, styles.defaultAvatar]}>
                            <MaterialIcons
                              name={notif.type === 'report' ? 'shield' : 'notifications'}
                              size={24}
                              color="#666"
                            />
                          </View>
                        ) : (
                          <Image
                            source={{
                              uri: notif.sender.img
                            }}
                            style={styles.notificationAvatar}
                            contentFit="cover"
                            onError={(error) => {
                              console.log('Failed to load notification avatar:', notif.sender?.img);
                              console.log('Error:', error);
                            }}
                            onLoad={() => {
                              console.log('Successfully loaded avatar:', notif.sender?.img);
                            }}
                          />
                        )}
                        <View style={styles.notificationContent}>
                          <Text style={styles.notificationText}>
                            {notif.message ? (
                              notif.message
                            ) : (
                              <>
                                <Text style={styles.notificationSender}>{notif.sender?.name || 'Someone'}</Text>
                                {' '}
                                {notif.type === 'like_post' && 'liked your post'}
                                {notif.type === 'comment_post' && 'commented on your post'}
                                {notif.type === 'message' && 'sent you a message'}
                                {notif.type === 'photo_approved' && 'Your photo has been approved'}
                                {notif.type === 'photo_denied' && 'Your photo was not approved'}
                                {notif.type === 'post_approved' && 'Your post has been approved'}
                                {notif.type === 'post_rejected' && 'Your post was not approved'}
                                {notif.type === 'verification_approved' && 'Your verification has been approved'}
                                {notif.type === 'verification_denied' && 'Your verification was not approved'}
                                {notif.type === 'admin_notification' && 'sent you a notification'}
                              </>
                            )}
                          </Text>
                          <Text style={styles.notificationTime}>
                            {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <View style={styles.notificationIcon}>
                          {notif.type === 'like_post' && <MaterialIcons name="favorite" size={20} color="#e74c3c" />}
                          {notif.type === 'comment_post' && <MaterialIcons name="comment" size={20} color="#3498db" />}
                          {notif.type === 'message' && <MaterialIcons name="message" size={20} color="#2ecc71" />}
                          {notif.type === 'photo_approved' && <MaterialIcons name="check-circle" size={20} color="#2ecc71" />}
                          {notif.type === 'photo_denied' && <MaterialIcons name="cancel" size={20} color="#e74c3c" />}
                          {notif.type === 'post_approved' && <MaterialIcons name="check-circle" size={20} color="#2ecc71" />}
                          {notif.type === 'post_rejected' && <MaterialIcons name="cancel" size={20} color="#e74c3c" />}
                          {notif.type === 'verification_approved' && <MaterialIcons name="verified" size={20} color="#1DA1F2" />}
                          {notif.type === 'verification_denied' && <MaterialIcons name="cancel" size={20} color="#e74c3c" />}
                          {notif.type === 'admin_notification' && <MaterialIcons name="notifications" size={20} color="#f39c12" />}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
  notificationBtn: {
    padding: 5,
    marginRight: 5,
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
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 15,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
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
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  // Notification Styles
  notificationBadge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  notificationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  notificationModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(166, 7, 214, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.tint,
  },
  markAllReadText: {
    color: Colors.dark.tint,
    fontSize: 12,
    fontWeight: '600',
  },
  notificationList: {
    maxHeight: 500,
  },
  emptyNotifications: {
    padding: 40,
    alignItems: 'center',
  },
  emptyNotificationsText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: '#252525',
  },
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  notificationSender: {
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationTime: {
    color: '#666',
    fontSize: 12,
  },
  notificationIcon: {
    marginLeft: 8,
  },
});
