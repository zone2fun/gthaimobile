const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
// Helper to calculate distance in meters
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return Math.floor(d * 1000); // Return in meters
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

const getAllUsers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);
        const allUsers = await User.find({}).select('-password');

        if (!currentUser) {
            return res.json(allUsers);
        }

        // Calculate distance for each user
        const usersWithDistance = allUsers.map(user => {
            const userObj = user.toObject();
            if (user._id.equals(currentUser._id)) {
                userObj.distance = 0;
            } else {
                userObj.distance = getDistanceFromLatLonInM(
                    currentUser.lat, currentUser.lng,
                    user.lat, user.lng
                );
            }
            return userObj;
        });

        // Sort: Current user first, then by distance
        usersWithDistance.sort((a, b) => {
            if (a._id.toString() === currentUser._id.toString()) return -1;
            if (b._id.toString() === currentUser._id.toString()) return 1;
            return a.distance - b.distance;
        });

        res.json(usersWithDistance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get fresh faces (newest users)
// @route   GET /api/users/fresh-faces
// @access  Private
const getFreshFaces = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
    try {
        if (!req.params.id || req.params.id === 'undefined') {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const user = await User.findById(req.params.id).select('-password');

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    getFreshFaces
};
