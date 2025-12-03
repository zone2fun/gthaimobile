import React from 'react';
import { StyleSheet, View, Text, FlatList, Dimensions } from 'react-native';
import ProfileCard from './ProfileCard';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

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

interface SectionProps {
    title: string;
    items: User[] | null;
    isGrid?: boolean;
}

export default function Section({ title, items, isGrid }: SectionProps) {
    if (!items || items.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {isGrid ? (
                <View style={styles.gridContainer}>
                    {items.map((item) => (
                        <View key={item._id || item.id} style={styles.gridItem}>
                            <ProfileCard user={item} isGrid={true} />
                        </View>
                    ))}
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={({ item }) => <ProfileCard user={item} />}
                    keyExtractor={(item) => item._id || item.id || Math.random().toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        marginLeft: 15,
        marginBottom: 10,
        color: Colors.dark.text, // Defaulting to dark mode text for now as per theme
    },
    scrollContent: {
        paddingHorizontal: 15,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
    },
    gridItem: {
        width: (width / 3) - 1.5, // Adjust for gap
        marginBottom: 2,
    },
});
