import { Tabs } from 'expo-router';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import * as Location from 'expo-location';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { updateLocation as updateLocationAPI } from '@/services/api';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { unreadCount } = useSocket();
  const { user, token } = useAuth();

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
      console.log('Location updated via Tab Press');
    } catch (error) {
      console.log('Error updating location:', error);
    }
  };

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="favourites"
        listeners={{
          tabPress: () => updateLocation(),
        }}
        options={{
          title: 'Favourites',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="star-border" color={color} />,
        }}
      />
      <Tabs.Screen
        name="special"
        listeners={{
          tabPress: () => updateLocation(),
        }}
        options={{
          title: 'Special',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="layers" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        listeners={{
          tabPress: () => updateLocation(),
        }}
        options={{
          title: 'GTHAILOVER',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="groups" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        listeners={{
          tabPress: () => updateLocation(),
        }}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <View>
              <MaterialIcons size={28} name="chat-bubble-outline" color={color} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  right: -6,
                  top: -3,
                  backgroundColor: 'red',
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 2,
                  borderWidth: 1.5,
                  borderColor: Colors[colorScheme ?? 'light'].background,
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {unreadCount > 99 ? '+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{
          tabPress: () => updateLocation(),
        }}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
