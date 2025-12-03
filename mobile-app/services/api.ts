// For Expo Go on physical device - use your computer's local IP
const API_URL = 'http://192.168.1.104:5000/api';
const BASE_URL = 'http://192.168.1.104:5000';
// const API_URL = 'http://10.0.2.2:5000/api'; // For Android Emulator
// const API_URL = 'http://localhost:5000/api'; // For iOS Simulator

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

export const sendMessage = async (userId: string, text: string, token: string) => {
    try {
        const res = await fetch(`${API_URL}/chat/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        if (!res.ok) {
            throw new Error('Failed to send message');
        }

        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};
