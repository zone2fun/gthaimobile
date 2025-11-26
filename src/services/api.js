const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export const login = async (username, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });
    return response.json();
};

export const googleLogin = async (token, lat = null, lng = null) => {
    const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, lat, lng }),
    });
    return response.json();
};

export const register = async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });
    return response.json();
};

export const getUsers = async (token) => {
    const response = await fetch(`${API_URL}/users`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const getFreshFaces = async (token) => {
    const response = await fetch(`${API_URL}/users/fresh-faces`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const getUser = async (id, token) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const getConversations = async (token) => {
    const response = await fetch(`${API_URL}/chat`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const getMessages = async (userId, token) => {
    const response = await fetch(`${API_URL}/chat/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const sendMessage = async (messageData, token) => {
    const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: messageData, // Can be FormData or JSON
    });
    return response.json();
};

export const deleteMessage = async (messageId, token) => {
    const response = await fetch(`${API_URL}/chat/${messageId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const markAsRead = async (senderId, token) => {
    const response = await fetch(`${API_URL}/chat/read`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderId }),
    });
    return response.json();
};

export const toggleFavorite = async (userId, token) => {
    const response = await fetch(`${API_URL}/users/${userId}/favorite`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const blockUser = async (userId, token) => {
    const response = await fetch(`${API_URL}/users/${userId}/block`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const unblockUser = async (userId, token) => {
    const response = await fetch(`${API_URL}/users/${userId}/unblock`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const getBlockedUsers = async (token) => {
    const response = await fetch(`${API_URL}/users/blocked`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};
export const updateProfile = async (formData, token) => {
    const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            // Content-Type is not set here because FormData sets it automatically with boundary
        },
        body: formData,
    });
    return response.json();
};

export const changePassword = async (currentPassword, newPassword, token) => {
    const response = await fetch(`${API_URL}/users/password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response.json();
};

export const deleteAccount = async (token) => {
    const response = await fetch(`${API_URL}/users/profile`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const getMe = async (token) => {
    const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const getPosts = async (token, hashtag = '') => {
    let url = `${API_URL}/posts`;
    if (hashtag) {
        url += `?hashtag=${encodeURIComponent(hashtag)}`;
    }
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const getPost = async (id, token) => {
    const response = await fetch(`${API_URL}/posts/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const createPost = async (postData, token) => {
    const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: postData,
    });
    return response.json();
};

export const likePost = async (postId, token) => {
    const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const addComment = async (postId, text, token) => {
    const response = await fetch(`${API_URL}/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
    });
    return response.json();
};

export const deletePost = async (postId, token) => {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const deleteComment = async (postId, commentId, token) => {
    const response = await fetch(`${API_URL}/posts/${postId}/comment/${commentId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const getNotifications = async (token) => {
    const response = await fetch(`${API_URL}/notifications`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const markNotificationAsRead = async (id, token) => {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const createReport = async (postId, userId, reason, additionalInfo, reportType, token) => {
    const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ postId, userId, reason, additionalInfo, reportType }),
    });
    return response.json();
};

// Album Access APIs
export const requestAlbumAccess = async (userId, token) => {
    const response = await fetch(`${API_URL}/album-access/request/${userId}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const getAlbumAccessRequests = async (token) => {
    const response = await fetch(`${API_URL}/album-access/requests`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};

export const updateAlbumAccessRequest = async (requestId, status, token) => {
    const response = await fetch(`${API_URL}/album-access/requests/${requestId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
    });
    return response.json();
};

export const checkAlbumAccess = async (userId, token) => {
    const response = await fetch(`${API_URL}/album-access/check/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.json();
};
