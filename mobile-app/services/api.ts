// For Expo Go on physical device - use your computer's local IP
const API_URL = 'https://gthai-backend.onrender.com/api';
export const BASE_URL = 'https://gthai-backend.onrender.com';
// const API_URL = 'http://10.0.2.2:5000/api'; // For Android Emulator
// const API_URL = 'http://localhost:5000/api'; // For iOS Simulator

// Network error detection
export const isNetworkError = (error: any): boolean => {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorString = error.toString().toLowerCase();

    return (
        errorMessage.includes('network request failed') ||
        errorMessage.includes('failed to fetch') ||
        errorMessage.includes('network error') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        errorString.includes('typeerror: network request failed') ||
        errorString.includes('typeerror: failed to fetch') ||
        error.name === 'TypeError' ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ENETUNREACH'
    );
};

// Helper function to convert relative paths to absolute URLs
const getImageUrl = (imgPath: string | null | undefined): string | null => {
    if (!imgPath) return null;

    // If already a full URL (starts with http), return as is
    if (imgPath.startsWith('http')) return imgPath;

    // If relative path (starts with /), prepend BASE_URL
    if (imgPath.startsWith('/')) return `${BASE_URL}${imgPath}`;

    // Otherwise prepend BASE_URL with /
    return `${BASE_URL}/${imgPath}`;
};

// Authentication APIs
export const login = async (email: string, password: string) => {
    try {
        console.log(`Logging in to ${API_URL}/auth/login`);
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Backend expects 'username' field which can be username or email
            body: JSON.stringify({ username: email, password }),
        });

        console.log(`Login response status: ${res.status}`);

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Login failed');
        }

        const data = await res.json();
        console.log('Login response data:', JSON.stringify(data, null, 2));
        console.log('Login successful');

        // Handle different response formats from backend
        const userData = data.user || data;
        const authToken = data.token;

        if (!authToken) {
            throw new Error('No token received from server');
        }

        // Transform image URLs
        if (userData) {
            userData.img = getImageUrl(userData.img);
            userData.cover = getImageUrl(userData.cover);
            userData.gallery = userData.gallery?.map((img: string) => getImageUrl(img)).filter(Boolean);
        }

        return { user: userData, token: authToken };
    } catch (error: any) {
        console.error('Login error:', error);
        throw error;
    }
};

export const register = async (userData: {
    email: string;
    password: string;
    username: string;
    name: string;
    age: number;
}) => {
    try {
        console.log(`Registering at ${API_URL}/auth/register`);
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        console.log(`Register response status: ${res.status}`);

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Registration failed');
        }

        const data = await res.json();
        console.log('Registration successful');

        // Transform image URLs
        if (data.user) {
            data.user.img = getImageUrl(data.user.img);
            data.user.cover = getImageUrl(data.user.cover);
        }

        return data; // { token, user }
    } catch (error: any) {
        console.error('Registration error:', error);
        throw error;
    }
};

export const forgotPassword = async (email: string) => {
    try {
        console.log(`Requesting password reset for ${email} at ${API_URL}/auth/forgot-password`);
        const res = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to request password reset');
        }

        const data = await res.json();
        console.log('Password reset request successful');
        return data;
    } catch (error: any) {
        console.error('Forgot password error:', error);
        throw error;
    }
};

export const getFreshFaces = async (token?: string) => {
    try {
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        console.log(`Fetching fresh faces from ${API_URL}/users/fresh-faces`);
        const res = await fetch(`${API_URL}/users/fresh-faces`, { headers });
        if (!res.ok) throw new Error('Failed to fetch fresh faces');

        const data = await res.json();
        console.log('Fresh faces received:', data?.length || 0, 'users');
        if (data?.[0]) console.log('Sample user ID:', data[0]._id);

        // Transform image URLs
        const transformedData = data.map((user: any) => ({
            ...user,
            img: getImageUrl(user.img),
            cover: getImageUrl(user.cover),
            gallery: user.gallery?.map((img: string) => getImageUrl(img)).filter(Boolean),
        }));

        return transformedData;
    } catch (error) {
        console.error('Error fetching fresh faces:', error);
        return [];
    }
};

export const getUsers = async (token?: string) => {
    try {
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        console.log(`Fetching users from ${API_URL}/users`);
        const res = await fetch(`${API_URL}/users`, { headers });
        if (!res.ok) throw new Error('Failed to fetch users');

        const data = await res.json();
        console.log('Users received:', data?.length || 0, 'users');
        if (data?.[0]) console.log('Sample user ID:', data[0]._id);

        // Transform image URLs
        const transformedData = data.map((user: any) => ({
            ...user,
            img: getImageUrl(user.img),
            cover: getImageUrl(user.cover),
            gallery: user.gallery?.map((img: string) => getImageUrl(img)).filter(Boolean),
        }));

        return transformedData;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

export const getUser = async (id: string, token?: string) => {
    try {
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        console.log(`Fetching user ${id} from ${API_URL}/users/${id}`);
        const res = await fetch(`${API_URL}/users/${id}`, { headers });

        console.log(`Response status: ${res.status}`);

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Failed to fetch user: ${res.status} - ${errorText}`);
            throw new Error(`Failed to fetch user: ${res.status}`);
        }

        const data = await res.json();
        console.log('User data received:', data);

        // Transform image URLs
        const transformedData = {
            ...data,
            img: getImageUrl(data.img),
            cover: getImageUrl(data.cover),
            gallery: data.gallery?.map((img: string) => getImageUrl(img)).filter(Boolean),
            privateAlbum: data.privateAlbum?.map((img: string) => getImageUrl(img)).filter(Boolean),
        };

        return transformedData;
    } catch (error) {
        console.error('Error fetching user:', error);
        // Return a minimal user object instead of null to prevent crashes
        return {
            _id: id,
            name: 'Unknown User',
            img: null,
            isOnline: false,
            isVerified: false,
        };
    }
};

export const getConversations = async (token: string) => {
    try {
        const res = await fetch(`${API_URL}/chat`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch conversations');
        }

        const data = await res.json();

        // Transform user images in conversations
        return data.map((conv: any) => {
            if (conv.members) {
                conv.members = conv.members.map((member: any) => ({
                    ...member,
                    img: getImageUrl(member.img)
                }));
            }

            // Handle direct user object if present (common in some chat APIs)
            if (conv.user) {
                conv.user = {
                    ...conv.user,
                    img: getImageUrl(conv.user.img)
                };
            }

            // Also handle sender/receiver in lastMessage if populated
            if (conv.lastMessage && conv.lastMessage.sender) {
                // Check if sender is an object (populated) or just ID
                if (typeof conv.lastMessage.sender === 'object') {
                    conv.lastMessage.sender.img = getImageUrl(conv.lastMessage.sender.img);
                }
            }

            return conv;
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }
};

export const getMessages = async (userId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/chat/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch messages');
        }

        const data = await res.json();

        // Transform images in messages if needed
        // Assuming data is an array of messages
        return data.map((msg: any) => {
            // Transform sender image if populated
            if (msg.sender && typeof msg.sender === 'object') {
                msg.sender.img = getImageUrl(msg.sender.img);
            }
            // Transform message image if present
            if (msg.image) {
                msg.image = getImageUrl(msg.image);
            }
            return msg;
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
};

export const sendMessage = async (userId: string, text: string, token: string, imageUri?: string) => {
    try {
        console.log('Sending message:', { userId, text: text?.substring(0, 50), hasImage: !!imageUri });

        const formData = new FormData();
        formData.append('recipientId', userId);  // Backend expects 'recipientId'
        formData.append('text', text || '');

        if (imageUri) {
            const filename = imageUri.split('/').pop() || 'image.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('image', {
                uri: imageUri,
                name: filename,
                type: type,
            } as any);
        }

        const res = await fetch(`${API_URL}/chat`, {  // Changed from /chat/:userId to /chat
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type for FormData
            },
            body: formData
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Send message failed:', res.status, errorData);
            throw new Error(errorData.message || 'Failed to send message');
        }

        const data = await res.json();
        console.log('Message sent successfully');
        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

export const markMessagesAsRead = async (senderId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/chat/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ senderId })
        });

        if (!res.ok) {
            throw new Error('Failed to mark messages as read');
        }

        return await res.json();
    } catch (error) {
        console.error('Error marking messages as read:', error);
        throw error;
    }
};

export const deleteMessage = async (messageId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/chat/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error('Failed to delete message');
        }

        return await res.json();
    } catch (error) {
        console.error('Error deleting message:', error);
        throw error;
    }
};

export const markAsRead = async (senderId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/chat/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ senderId })
        });

        if (!res.ok) {
            throw new Error('Failed to mark messages as read');
        }

        return await res.json();
    } catch (error) {
        console.error('Error marking messages as read:', error);
        throw error;
    }
};

// Notifications APIs
export const getNotifications = async (token: string) => {
    try {
        const res = await fetch(`${API_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to fetch notifications');
        }

        const data = await res.json();

        // Transform image URLs
        return data.map((notification: any) => ({
            ...notification,
            sender: notification.sender ? {
                ...notification.sender,
                img: getImageUrl(notification.sender.img)
            } : null,
            post: notification.post ? {
                ...notification.post,
                image: getImageUrl(notification.post.image)
            } : null
        }));
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

export const markNotificationAsRead = async (notificationId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to mark notification as read');
        }

        return await res.json();
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

export const markAllNotificationsAsRead = async (token: string) => {
    try {
        const res = await fetch(`${API_URL}/notifications/read-all`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to mark all notifications as read');
        }

        return await res.json();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

// Album Access APIs
export const checkAlbumAccess = async (userId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/album-access/check/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to check album access');
        }

        return await res.json();
    } catch (error) {
        console.error('Error checking album access:', error);
        throw error;
    }
};

export const requestAlbumAccess = async (userId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/album-access/request/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to request album access');
        }

        return await res.json();
    } catch (error) {
        console.error('Error requesting album access:', error);
        throw error;
    }
};

export const respondToAlbumRequest = async (requestId: string, status: 'approve' | 'reject', token: string) => {
    try {
        console.log('Responding to album request:', { requestId, status });

        const res = await fetch(`${API_URL}/album-access/requests/${requestId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: status === 'approve' ? 'approved' : 'rejected' }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Respond to album request failed:', res.status, errorData);
            throw new Error(errorData.message || 'Failed to respond to album request');
        }

        const data = await res.json();
        console.log('Album request response successful:', data);
        return data;
    } catch (error) {
        console.error('Error responding to album request:', error);
        throw error;
    }
};

// Block/Unblock APIs
export const getBlockedUsers = async (token: string) => {
    try {
        const res = await fetch(`${API_URL}/users/blocked`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to fetch blocked users');
        }

        const data = await res.json();

        // Transform image URLs
        return data.map((user: any) => ({
            ...user,
            img: getImageUrl(user.img),
            cover: getImageUrl(user.cover),
        }));
    } catch (error) {
        console.error('Error fetching blocked users:', error);
        throw error;
    }
};


export const blockUser = async (userId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/users/${userId}/block`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Block user failed:', res.status, errorData);
            throw new Error(errorData.message || 'Failed to block user');
        }

        return await res.json();
    } catch (error) {
        console.error('Error blocking user:', error);
        throw error;
    }
};

export const unblockUser = async (userId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/users/${userId}/unblock`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Unblock user failed:', res.status, errorData);
            throw new Error(errorData.message || 'Failed to unblock user');
        }

        return await res.json();
    } catch (error) {
        console.error('Error unblocking user:', error);
        throw error;
    }
};

// Favorites API
export const toggleFavorite = async (userId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/users/${userId}/favorite`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to toggle favorite');
        }

        return await res.json();
    } catch (error) {
        console.error('Error toggling favorite:', error);
        throw error;
    }
};

// Posts API
export const getPosts = async (token: string) => {
    try {
        const res = await fetch(`${API_URL}/posts`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to fetch posts');
        }

        const data = await res.json();

        // Transform image URLs
        return data.map((post: any) => ({
            ...post,
            image: getImageUrl(post.image),
            user: post.user ? {
                ...post.user,
                img: getImageUrl(post.user.img)
            } : null,
        }));
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }
};

// User Location Update API
export const updateLocation = async (latitude: number, longitude: number, token: string) => {
    try {
        console.log('Updating location:', { latitude, longitude });

        const res = await fetch(`${API_URL}/users/location`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ latitude, longitude }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Location update failed:', res.status, errorData);
            throw new Error(errorData.message || 'Failed to update location');
        }

        const data = await res.json();
        console.log('Location updated successfully:', data);
        return data;
    } catch (error) {
        console.error('Error updating location:', error);
        throw error;
    }
};

// User Profile Update API
export const updateUserProfile = async (formData: FormData, token: string) => {
    try {
        const res = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type for FormData, browser will set it with boundary
            },
            body: formData,
        });

        if (!res.ok) {
            throw new Error('Failed to update profile');
        }

        const data = await res.json();

        // Transform image URLs
        return {
            ...data,
            img: getImageUrl(data.img),
            cover: getImageUrl(data.cover),
        };
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

// Keep updateUser for backward compatibility
export const updateUser = async (userId: string, userData: any, token: string) => {
    // Convert JSON data to FormData for updateUserProfile
    const formData = new FormData();

    Object.keys(userData).forEach(key => {
        const value = userData[key];

        if (Array.isArray(value)) {
            // Check if it's an array of objects or strings to verify structure if needed
            // For now, assume strings or simple types as per previous usage
            value.forEach((item: any) => {
                formData.append(key, item);
            });
        } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
        }
    });

    return updateUserProfile(formData, token);
};


// Post Like/Unlike API
export const likePost = async (postId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to like post');
        }

        return await res.json();
    } catch (error) {
        console.error('Error liking post:', error);
        throw error;
    }
};

export const updatePushToken = async (pushToken: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/users/push-token`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pushToken }),
        });

        if (!res.ok) {
            throw new Error('Failed to update push token');
        }

        return await res.json();
    } catch (error) {
        console.error('Error updating push token:', error);
        // Don't throw, just log
    }
};

// Post Comments API
export const getComments = async (postId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/comment`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to fetch comments');
        }

        const data = await res.json();

        // Transform image URLs
        return data.map((comment: any) => ({
            ...comment,
            user: comment.user ? {
                ...comment.user,
                img: getImageUrl(comment.user.img)
            } : null,
        }));
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }
};

export const addComment = async (postId: string, text: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!res.ok) {
            throw new Error('Failed to add comment');
        }

        return await res.json();
    } catch (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
};

export const deleteComment = async (postId: string, commentId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to delete comment');
        }

        return await res.json();
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
};

// Create Post API
export const createPost = async (postData: { content?: string; hashtags?: string[] }, imageUri: string | undefined, token: string) => {
    try {
        console.log('Creating post:', postData);

        const formData = new FormData();

        if (postData.content) {
            formData.append('content', postData.content);
        }

        if (imageUri) {
            // Get filename from URI
            const filename = imageUri.split('/').pop() || 'image.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            // Append image as file
            formData.append('image', {
                uri: imageUri,
                name: filename,
                type: type,
            } as any);
        }

        if (postData.hashtags && postData.hashtags.length > 0) {
            formData.append('hashtags', JSON.stringify(postData.hashtags));
        }

        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type for FormData, browser will set it with boundary
            },
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Create post failed:', res.status, errorData);
            throw new Error(errorData.message || 'Failed to create post');
        }

        const data = await res.json();
        console.log('Post created successfully:', data);
        return data;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
};

export const deletePost = async (postId: string, token: string) => {
    try {
        console.log('Deleting post:', postId);

        const res = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Delete post failed:', res.status, errorData);
            throw new Error(errorData.message || 'Failed to delete post');
        }

        const data = await res.json();
        console.log('Post deleted successfully:', data);
        return data;
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
};

// Post Approval API (Admin)
export const approvePost = async (postId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to approve post');
        }

        return await res.json();
    } catch (error) {
        console.error('Error approving post:', error);
        throw error;
    }
};

export const rejectPost = async (postId: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/posts/${postId}/reject`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error('Failed to reject post');
        }

        return await res.json();
    } catch (error) {
        console.error('Error rejecting post:', error);
        throw error;
    }
};

// Report Post API
export const createReport = async (reportData: { reportedId: string; reportedType: string; reason: string; description?: string }, token: string) => {
    try {
        // Transform data to match backend expectations
        const backendData: any = {
            reportType: reportData.reportedType,  // 'post' or 'user'
            reason: reportData.reason,
            additionalInfo: reportData.description || ''
        };

        // Add postId or userId based on type
        if (reportData.reportedType === 'post') {
            backendData.postId = reportData.reportedId;
        } else if (reportData.reportedType === 'user') {
            backendData.userId = reportData.reportedId;
        }

        const res = await fetch(`${API_URL}/reports`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(backendData),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to create report');
        }

        return await res.json();
    } catch (error) {
        console.error('Error creating report:', error);
        throw error;
    }
};
