const API_URL = 'http://localhost:5000/api';

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
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
    });
    return response.json();
};
