import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        name: ''
    });
    const [ageVerified, setAgeVerified] = useState(false);

    const handleRegister = () => {
        if (!ageVerified) {
            Alert.alert('Age Verification', 'You must confirm you are over 18.');
            return;
        }
        // Mock register
        Alert.alert('Success', 'Account created!', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Create Account</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Username (min 8 chars)"
                        placeholderTextColor="#888"
                        value={formData.username}
                        onChangeText={(t) => setFormData({ ...formData, username: t })}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password (min 8 chars)"
                        placeholderTextColor="#888"
                        value={formData.password}
                        onChangeText={(t) => setFormData({ ...formData, password: t })}
                        secureTextEntry
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#888"
                        value={formData.email}
                        onChangeText={(t) => setFormData({ ...formData, email: t })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Name (min 3 chars)"
                        placeholderTextColor="#888"
                        value={formData.name}
                        onChangeText={(t) => setFormData({ ...formData, name: t })}
                    />

                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setAgeVerified(!ageVerified)}
                    >
                        <MaterialIcons
                            name={ageVerified ? "check-box" : "check-box-outline-blank"}
                            size={24}
                            color={Colors.dark.tint}
                        />
                        <Text style={styles.checkboxText}>I confirm I am over 18 years old</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.registerButton, !ageVerified && styles.disabledButton]}
                        onPress={handleRegister}
                        disabled={!ageVerified}
                    >
                        <LinearGradient
                            colors={ageVerified ? ['#a607d6', '#d607a6'] : ['#555', '#555']}
                            style={styles.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.registerButtonText}>Register</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <Link href="/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.loginLink}>Login</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    content: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    backButton: {
        marginRight: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    form: {
        width: '100%',
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#fff',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 10,
    },
    checkboxText: {
        color: '#ccc',
        fontSize: 14,
    },
    registerButton: {
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 24,
    },
    disabledButton: {
        opacity: 0.7,
    },
    gradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        color: '#888',
        fontSize: 14,
    },
    loginLink: {
        color: Colors.dark.tint,
        fontSize: 14,
        fontWeight: '600',
    },
});
