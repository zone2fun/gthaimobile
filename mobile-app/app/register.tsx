import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { register } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
    const router = useRouter();
    const { login } = useAuth(); // We'll use login from context to set user after registration if needed, or just redirect
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        name: '',
        age: ''
    });
    const [errors, setErrors] = useState({
        username: '',
        password: '',
        email: '',
        name: '',
        age: ''
    });
    const [ageVerified, setAgeVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    console.log('Permission to access location was denied');
                    return;
                }

                let location = await Location.getCurrentPositionAsync({});
                setLocation({
                    lat: location.coords.latitude,
                    lng: location.coords.longitude
                });
            } catch (error) {
                console.log('Error getting location:', error);
            }
        })();
    }, []);

    const validateForm = () => {
        let isValid = true;
        const newErrors = { ...errors };

        // Username validation
        if (!formData.username) {
            newErrors.username = 'Username is required';
            isValid = false;
        } else if (formData.username.length < 8) {
            newErrors.username = 'Username must be at least 8 characters';
            isValid = false;
        } else {
            newErrors.username = '';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
            isValid = false;
        } else {
            newErrors.password = '';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
            isValid = false;
        } else {
            newErrors.email = '';
        }

        // Name validation
        if (!formData.name) {
            newErrors.name = 'Display name is required';
            isValid = false;
        } else if (formData.name.length < 3) {
            newErrors.name = 'Display name must be at least 3 characters';
            isValid = false;
        } else {
            newErrors.name = '';
        }

        // Age validation
        if (!formData.age) {
            newErrors.age = 'Age is required';
            isValid = false;
        } else {
            const ageNum = parseInt(formData.age);
            if (isNaN(ageNum) || ageNum < 18) {
                newErrors.age = 'You must be at least 18 years old';
                isValid = false;
            } else {
                newErrors.age = '';
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleRegister = async () => {
        if (!ageVerified) {
            Alert.alert('Age Verification', 'You must confirm you are over 18.');
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const userData = {
                ...formData,
                age: parseInt(formData.age),
                lat: location?.lat,
                lng: location?.lng
            };

            const response = await register(userData);

            // Auto login logic could go here, or redirect to login
            Alert.alert('Success', 'Account created successfully!', [
                {
                    text: 'Login Now',
                    onPress: () => router.replace('/login')
                }
            ]);
        } catch (error: any) {
            console.error('Registration error:', error);
            Alert.alert('Registration Failed', error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <MaterialIcons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Create Account</Text>
                    </View>

                    <View style={styles.form}>
                        {/* Username Input */}
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, errors.username ? styles.inputError : null]}
                                placeholder="Username (min 8 chars)"
                                placeholderTextColor="#888"
                                value={formData.username}
                                onChangeText={(t) => {
                                    setFormData({ ...formData, username: t });
                                    if (errors.username) setErrors({ ...errors, username: '' });
                                }}
                                autoCapitalize="none"
                            />
                        </View>
                        {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="lock-outline" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, errors.password ? styles.inputError : null]}
                                placeholder="Password (min 8 chars)"
                                placeholderTextColor="#888"
                                value={formData.password}
                                onChangeText={(t) => {
                                    setFormData({ ...formData, password: t });
                                    if (errors.password) setErrors({ ...errors, password: '' });
                                }}
                                secureTextEntry
                            />
                        </View>
                        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, errors.email ? styles.inputError : null]}
                                placeholder="Email"
                                placeholderTextColor="#888"
                                value={formData.email}
                                onChangeText={(t) => {
                                    setFormData({ ...formData, email: t });
                                    if (errors.email) setErrors({ ...errors, email: '' });
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                        {/* Name Input */}
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="badge" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, errors.name ? styles.inputError : null]}
                                placeholder="Display Name (min 3 chars)"
                                placeholderTextColor="#888"
                                value={formData.name}
                                onChangeText={(t) => {
                                    setFormData({ ...formData, name: t });
                                    if (errors.name) setErrors({ ...errors, name: '' });
                                }}
                            />
                        </View>
                        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

                        {/* Age Input */}
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="calendar-today" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, errors.age ? styles.inputError : null]}
                                placeholder="Age"
                                placeholderTextColor="#888"
                                value={formData.age}
                                onChangeText={(t) => {
                                    setFormData({ ...formData, age: t.replace(/[^0-9]/g, '') });
                                    if (errors.age) setErrors({ ...errors, age: '' });
                                }}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>
                        {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}

                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setAgeVerified(!ageVerified)}
                        >
                            <MaterialIcons
                                name={ageVerified ? "check-box" : "check-box-outline-blank"}
                                size={24}
                                color={ageVerified ? Colors.dark.tint : "#888"}
                            />
                            <Text style={[styles.checkboxText, ageVerified && styles.checkboxTextActive]}>
                                I confirm I am over 18 years old
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.registerButton, (!ageVerified || loading) && styles.disabledButton]}
                            onPress={handleRegister}
                            disabled={!ageVerified || loading}
                        >
                            <LinearGradient
                                colors={ageVerified ? ['#a607d6', '#d607a6'] : ['#333', '#333']}
                                style={styles.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.registerButtonText}>Register</Text>
                                )}
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
            </KeyboardAvoidingView>
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
        padding: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        marginBottom: 8, // Reduced margin to make room for error text
        borderWidth: 1,
        borderColor: '#333',
    },
    inputIcon: {
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 14,
        fontSize: 16,
        color: '#fff',
    },
    inputError: {
        borderColor: '#ff4444',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginLeft: 16,
        marginBottom: 12,
        marginTop: -4,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 8,
        gap: 10,
    },
    checkboxText: {
        color: '#888',
        fontSize: 14,
    },
    checkboxTextActive: {
        color: '#fff',
    },
    registerButton: {
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 24,
        elevation: 3,
        shadowColor: '#a607d6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    disabledButton: {
        opacity: 0.7,
        shadowOpacity: 0,
        elevation: 0,
    },
    gradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
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
