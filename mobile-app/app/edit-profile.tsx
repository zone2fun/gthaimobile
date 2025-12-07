import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/theme';
import { getUser, updateUserProfile } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const COUNTRIES = [
    "Thailand", "United States", "United Kingdom", "Japan", "China", "Korea",
    "Australia", "Singapore", "Malaysia", "Vietnam", "Laos", "Myanmar",
    "Cambodia", "Philippines", "Indonesia", "India", "Russia", "Germany",
    "France", "Italy", "Spain", "Other"
];

const LOOKING_FOR_OPTIONS = ["Friends", "Chat", "Dating", "Lover"];

const UploadingIndicator = () => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 1000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <MaterialIcons name="cloud-upload" size={60} color={Colors.dark.tint} />
        </Animated.View>
    );
};



export default function EditProfileScreen() {
    const { user, token, updateUser } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        height: '',
        weight: '',
        country: '',
        lookingFor: '',
        bio: '',
    });

    const [coverPreview, setCoverPreview] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [privateAlbum, setPrivateAlbum] = useState<string[]>([]);
    const [verificationStatus, setVerificationStatus] = useState('unverified');
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            if (!user?._id) return;

            const userData = await getUser(user._id);
            setFormData({
                name: userData.name || '',
                age: userData.age?.toString() || '',
                height: userData.height?.toString() || '',
                weight: userData.weight?.toString() || '',
                country: userData.country || '',
                lookingFor: Array.isArray(userData.lookingFor) ? userData.lookingFor.join(',') : (userData.lookingFor || ''),
                bio: userData.bio || '',
            });
            setCoverPreview(userData.cover || '');
            setAvatarPreview(userData.img || '');
            setGalleryImages(userData.gallery || []);
            setPrivateAlbum(userData.privateAlbum || []);
            setVerificationStatus(userData.verificationStatus || 'unverified');
            setIsVerified(userData.isVerified || false);
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePickImage = async (type: 'avatar' | 'cover' | 'gallery' | 'private') => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: type === 'avatar' || type === 'cover',
                aspect: type === 'avatar' ? [1, 1] : type === 'cover' ? [16, 9] : undefined,
                quality: 0.8,
            });

            if (!result.canceled) {
                const uri = result.assets[0].uri;

                if (type === 'avatar') {
                    setAvatarPreview(uri);
                } else if (type === 'cover') {
                    setCoverPreview(uri);
                } else if (type === 'gallery') {
                    setGalleryImages([...galleryImages, uri]);
                } else if (type === 'private') {
                    setPrivateAlbum([...privateAlbum, uri]);
                }
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleSave = async () => {
        if (!token) return;

        // Show uploading modal whenever saving
        setIsUploadingImage(true);
        setSaving(true);

        // Check if there are any images to upload
        const hasNewImages =
            (avatarPreview && !avatarPreview.startsWith('http')) ||
            (coverPreview && !coverPreview.startsWith('http')) ||
            galleryImages.some(img => img && !img.startsWith('http')) ||
            privateAlbum.some(img => img && !img.startsWith('http'));


        try {
            const data = new FormData();

            // Append text fields
            data.append('name', formData.name);
            data.append('age', formData.age);
            data.append('height', formData.height);
            data.append('weight', formData.weight);
            data.append('country', formData.country);
            data.append('lookingFor', formData.lookingFor);
            data.append('bio', formData.bio);

            // Handle Avatar
            if (avatarPreview && !avatarPreview.startsWith('http')) {
                const filename = avatarPreview.split('/').pop() || 'avatar.jpg';
                const match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : 'image/jpeg';
                if (type === 'image/jpg') type = 'image/jpeg';

                data.append('img', {
                    uri: avatarPreview,
                    name: filename,
                    type,
                } as any);
            } else if (avatarPreview) {
                data.append('img', avatarPreview);
            }

            // Handle Cover
            if (coverPreview && !coverPreview.startsWith('http')) {
                const filename = coverPreview.split('/').pop() || 'cover.jpg';
                const match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : 'image/jpeg';
                if (type === 'image/jpg') type = 'image/jpeg';

                data.append('cover', {
                    uri: coverPreview,
                    name: filename,
                    type,
                } as any);
            } else if (coverPreview) {
                data.append('cover', coverPreview);
            }

            // Handle Gallery
            const existingGallery = galleryImages.filter(img => img.startsWith('http'));
            const newGallery = galleryImages.filter(img => !img.startsWith('http'));

            if (existingGallery.length > 0) {
                data.append('existingGallery', existingGallery.join(','));
            }

            newGallery.forEach((uri, index) => {
                const filename = uri.split('/').pop() || `gallery_${index}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : 'image/jpeg';
                if (type === 'image/jpg') type = 'image/jpeg';

                data.append('gallery', {
                    uri,
                    name: filename,
                    type,
                } as any);
            });

            // Handle Private Album
            const existingPrivate = privateAlbum.filter(img => img.startsWith('http'));
            const newPrivate = privateAlbum.filter(img => !img.startsWith('http'));

            if (existingPrivate.length > 0) {
                data.append('existingPrivateAlbum', existingPrivate.join(','));
            }

            newPrivate.forEach((uri, index) => {
                const filename = uri.split('/').pop() || `private_${index}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : 'image/jpeg';
                if (type === 'image/jpg') type = 'image/jpeg';

                data.append('privateAlbum', {
                    uri,
                    name: filename,
                    type,
                } as any);
            });

            const updatedUser = await updateUserProfile(data, token);

            if (updateUser) {
                await updateUser(updatedUser);
            }

            Alert.alert('Success', 'Profile updated successfully!\nNote: Profile photos and public gallery images require admin approval before they appear.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
            setIsUploadingImage(false);
        }
    };

    const handleRemoveGalleryImage = (index: number) => {
        setGalleryImages(galleryImages.filter((_, i) => i !== index));
    };

    const handleRemovePrivateImage = (index: number) => {
        setPrivateAlbum(privateAlbum.filter((_, i) => i !== index));
    };

    const toggleLookingFor = (option: string) => {
        const current = formData.lookingFor ? formData.lookingFor.split(',').map(s => s.trim()).filter(Boolean) : [];
        let newOptions;
        if (current.includes(option)) {
            newOptions = current.filter(item => item !== option);
        } else {
            newOptions = [...current, option];
        }
        setFormData({ ...formData, lookingFor: newOptions.join(',') });
    };

    const isLookingForSelected = (option: string) => {
        const current = formData.lookingFor ? formData.lookingFor.split(',').map(s => s.trim()) : [];
        return current.includes(option);
    };

    const handleVerify = () => {
        if (isVerified || verificationStatus === 'pending') return;
        Alert.alert('Verification', 'Camera feature for verification will be implemented soon.');
    };

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView style={styles.container} edges={['top']}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.dark.tint} />
                    </View>
                </SafeAreaView>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.container} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        style={styles.saveButton}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color={Colors.dark.tint} />
                        ) : (
                            <Text style={styles.saveButtonText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Cover Image */}
                    <View style={styles.coverSection}>
                        <View style={styles.coverImageContainer}>
                            <Image
                                source={{ uri: coverPreview }}
                                style={styles.coverImage}
                                contentFit="cover"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.5)']}
                                style={styles.coverGradient}
                            />
                            <TouchableOpacity
                                style={styles.editCoverButton}
                                onPress={() => handlePickImage('cover')}
                            >
                                <MaterialIcons name="camera-alt" size={20} color="#fff" />
                                <Text style={styles.editCoverText}>Edit Cover</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Profile Photo */}
                    <View style={styles.photoSection}>
                        <View style={styles.photoContainer}>
                            <Image
                                source={{ uri: avatarPreview }}
                                style={styles.profilePhoto}
                                contentFit="cover"
                            />
                            <TouchableOpacity
                                style={styles.changePhotoButton}
                                onPress={() => handlePickImage('avatar')}
                            >
                                <MaterialIcons name="camera-alt" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Verification Button */}
                        <TouchableOpacity
                            style={[
                                styles.verificationButton,
                                isVerified ? styles.verifiedButton :
                                    verificationStatus === 'pending' ? styles.pendingButton :
                                        verificationStatus === 'rejected' ? styles.rejectedButton :
                                            styles.unverifiedButton
                            ]}
                            onPress={handleVerify}
                            disabled={isVerified || verificationStatus === 'pending'}
                        >
                            <MaterialIcons
                                name={isVerified ? "verified" : "camera-alt"}
                                size={16}
                                color="#fff"
                            />
                            <Text style={styles.verificationText}>
                                {isVerified ? 'Verified Account' :
                                    verificationStatus === 'pending' ? 'Verification Pending' :
                                        verificationStatus === 'rejected' ? 'Verification Rejected' :
                                            'Verify Account'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formSection}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                                placeholder="Enter your name"
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Age</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.age}
                                    onChangeText={(text) => setFormData({ ...formData, age: text })}
                                    placeholder="Age"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Height (cm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.height}
                                    onChangeText={(text) => setFormData({ ...formData, height: text })}
                                    placeholder="Height"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Weight (kg)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.weight}
                                    onChangeText={(text) => setFormData({ ...formData, weight: text })}
                                    placeholder="Weight"
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Country</Text>
                            <TouchableOpacity
                                style={styles.selectButton}
                                onPress={() => setShowCountryPicker(true)}
                            >
                                <Text style={[styles.selectButtonText, !formData.country && { color: '#666' }]}>
                                    {formData.country || "Select Country"}
                                </Text>
                                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Looking For</Text>
                            <View style={styles.lookingForContainer}>
                                {LOOKING_FOR_OPTIONS.map((option) => {
                                    const isSelected = isLookingForSelected(option);
                                    return (
                                        <TouchableOpacity
                                            key={option}
                                            style={[
                                                styles.lookingForChip,
                                                isSelected && styles.lookingForChipSelected
                                            ]}
                                            onPress={() => toggleLookingFor(option)}
                                        >
                                            <Text style={[
                                                styles.lookingForText,
                                                isSelected && styles.lookingForTextSelected
                                            ]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.bio}
                                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor="#666"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                maxLength={200}
                            />
                            <Text style={styles.charCount}>{formData.bio.length}/200</Text>
                        </View>
                    </View>

                    {/* Gallery Section */}
                    <View style={styles.gallerySection}>
                        <Text style={styles.sectionTitle}>Public Gallery (Max 5)</Text>
                        <View style={styles.galleryGrid}>
                            {galleryImages.map((img, index) => (
                                <View key={index} style={styles.galleryItem}>
                                    <Image source={{ uri: img }} style={styles.galleryImage} contentFit="cover" />
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => handleRemoveGalleryImage(index)}
                                    >
                                        <MaterialIcons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {galleryImages.length < 5 && (
                                <TouchableOpacity
                                    style={styles.addPhotoButton}
                                    onPress={() => handlePickImage('gallery')}
                                >
                                    <MaterialIcons name="add-photo-alternate" size={40} color="#666" />
                                    <Text style={styles.addPhotoText}>Add Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Private Album Section */}
                    <View style={styles.gallerySection}>
                        <View style={styles.privateTitleRow}>
                            <Text style={styles.sectionTitle}>Private Album (Max 3)</Text>
                            <MaterialIcons name="lock" size={20} color={Colors.dark.tint} />
                        </View>
                        <Text style={styles.privateHint}>Only visible to users you grant access</Text>
                        <View style={styles.galleryGrid}>
                            {privateAlbum.map((img, index) => (
                                <View key={index} style={styles.galleryItem}>
                                    <Image source={{ uri: img }} style={styles.galleryImage} contentFit="cover" />
                                    <View style={styles.lockOverlay}>
                                        <MaterialIcons name="lock" size={24} color="rgba(255,255,255,0.8)" />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => handleRemovePrivateImage(index)}
                                    >
                                        <MaterialIcons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {privateAlbum.length < 3 && (
                                <TouchableOpacity
                                    style={styles.addPhotoButton}
                                    onPress={() => handlePickImage('private')}
                                >
                                    <MaterialIcons name="lock" size={40} color="#666" />
                                    <Text style={styles.addPhotoText}>Add Private</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Account Section - Hidden for now */}
                    {/* <View style={styles.accountSection}>
                        <Text style={styles.sectionTitle}>Account</Text>

                        <TouchableOpacity style={styles.accountItem}>
                            <View style={styles.accountLeft}>
                                <MaterialIcons name="vpn-key" size={24} color="#888" />
                                <Text style={styles.accountText}>Change Password</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#888" />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.accountItem, { borderBottomWidth: 0 }]}>
                            <View style={styles.accountLeft}>
                                <MaterialIcons name="delete" size={24} color="#ff4444" />
                                <Text style={[styles.accountText, { color: '#ff4444' }]}>Delete Account</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#ff4444" />
                        </TouchableOpacity>
                    </View> */}

                    <View style={{ height: 40 }} />
                </ScrollView>

                {/* Country Picker Modal */}
                <Modal
                    visible={showCountryPicker}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowCountryPicker(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Select Country</Text>
                                        <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                                            <MaterialIcons name="close" size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                    <FlatList
                                        data={COUNTRIES}
                                        keyExtractor={(item) => item}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={styles.countryItem}
                                                onPress={() => {
                                                    setFormData({ ...formData, country: item });
                                                    setShowCountryPicker(false);
                                                }}
                                            >
                                                <Text style={[
                                                    styles.countryText,
                                                    formData.country === item && styles.countryTextSelected
                                                ]}>
                                                    {item}
                                                </Text>
                                                {formData.country === item && (
                                                    <MaterialIcons name="check" size={20} color={Colors.dark.tint} />
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    />
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>

                {/* Uploading Image Modal */}
                <Modal
                    visible={isUploadingImage && saving}
                    transparent={true}
                    animationType="fade"
                >
                    <View style={styles.uploadingModalOverlay}>
                        <View style={styles.uploadingContent}>
                            <UploadingIndicator />
                            <Text style={styles.uploadingText}>Uploading Image...</Text>
                            <Text style={styles.uploadingSubText}>Please wait</Text>
                        </View>
                    </View>
                </Modal>


            </SafeAreaView>
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    saveButton: {
        padding: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark.tint,
    },
    content: {
        flex: 1,
    },
    coverSection: {
        marginBottom: -40,
    },
    coverImageContainer: {
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
    editCoverButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    editCoverText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    photoSection: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#1a1a1a',
    },
    photoContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profilePhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: Colors.dark.background,
    },
    changePhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.dark.tint,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.dark.background,
    },
    verificationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    unverifiedButton: {
        backgroundColor: Colors.dark.tint,
    },
    verifiedButton: {
        backgroundColor: '#2ecc71',
    },
    pendingButton: {
        backgroundColor: '#f1c40f',
    },
    rejectedButton: {
        backgroundColor: '#e74c3c',
    },
    verificationText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    formSection: {
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#1a1a1a',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#333',
    },
    selectButton: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#333',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectButtonText: {
        fontSize: 16,
        color: '#fff',
    },
    lookingForContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    lookingForChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
    },
    lookingForChipSelected: {
        backgroundColor: 'rgba(166, 7, 214, 0.2)',
        borderColor: Colors.dark.tint,
    },
    lookingForText: {
        color: '#888',
        fontSize: 14,
    },
    lookingForTextSelected: {
        color: Colors.dark.tint,
        fontWeight: '600',
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    charCount: {
        fontSize: 12,
        color: '#888',
        textAlign: 'right',
        marginTop: 4,
    },
    gallerySection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#1a1a1a',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    privateTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    privateHint: {
        fontSize: 12,
        color: '#888',
        marginBottom: 12,
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    galleryItem: {
        width: '31%',
        aspectRatio: 1,
        position: 'relative',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    lockOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(255,0,0,0.8)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhotoButton: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#333',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhotoText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    accountSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 20,
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    accountLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    accountText: {
        fontSize: 16,
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    countryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    countryText: {
        fontSize: 16,
        color: '#ccc',
    },
    countryTextSelected: {
        color: Colors.dark.tint,
        fontWeight: '600',
    },
    uploadingModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadingContent: {
        backgroundColor: '#1a1a1a',
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        gap: 20,
        borderWidth: 1,
        borderColor: '#333',
        minWidth: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    uploadingText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    uploadingSubText: {
        color: '#888',
        fontSize: 14,
    },
});
