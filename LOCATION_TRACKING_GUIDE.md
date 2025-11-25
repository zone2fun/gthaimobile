# 📍 Location Tracking Implementation Guide

## Frontend Implementation ✅ DONE

### Files Created/Modified:
1. ✅ `src/components/LocationTracker.jsx` - Component to track and update location
2. ✅ `src/App.jsx` - Added LocationTracker to app

### How It Works:
- Automatically requests user's location when logged in
- Updates location every 10 minutes (600,000 ms)
- Uses browser's Geolocation API
- Sends latitude & longitude to backend

## Backend Implementation ⚠️ REQUIRED

You need to add the following to your backend:

### 1. Update User Model

Add location fields to your User schema:

```javascript
// backend/models/User.js
const userSchema = new mongoose.Schema({
    // ... existing fields
    
    location: {
        latitude: {
            type: Number,
            default: null
        },
        longitude: {
            type: Number,
            default: null
        },
        lastUpdated: {
            type: Date,
            default: null
        }
    }
});
```

### 2. Create Location Update Route

Add this route to handle location updates:

```javascript
// backend/routes/users.js (or wherever your user routes are)

// Update user location
router.put('/location', auth, async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        
        // Validate coordinates
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({ message: 'Invalid coordinates' });
        }
        
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ message: 'Coordinates out of range' });
        }
        
        // Update user location
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                location: {
                    latitude,
                    longitude,
                    lastUpdated: new Date()
                }
            },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            message: 'Location updated successfully',
            location: user.location
        });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
```

### 3. Optional: Add Distance Calculation

You can add a helper function to calculate distance between users:

```javascript
// backend/utils/distance.js

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

module.exports = { calculateDistance };
```

### 4. Optional: Find Nearby Users

Add endpoint to find users within a certain radius:

```javascript
// backend/routes/users.js

router.get('/nearby', auth, async (req, res) => {
    try {
        const { radius = 10 } = req.query; // Default 10km radius
        const currentUser = await User.findById(req.user._id);
        
        if (!currentUser.location || !currentUser.location.latitude) {
            return res.status(400).json({ message: 'Location not set' });
        }
        
        const users = await User.find({
            _id: { $ne: req.user._id },
            'location.latitude': { $exists: true, $ne: null }
        });
        
        const nearbyUsers = users.filter(user => {
            const distance = calculateDistance(
                currentUser.location.latitude,
                currentUser.location.longitude,
                user.location.latitude,
                user.location.longitude
            );
            return distance <= radius;
        }).map(user => ({
            ...user.toObject(),
            distance: calculateDistance(
                currentUser.location.latitude,
                currentUser.location.longitude,
                user.location.latitude,
                user.location.longitude
            ).toFixed(2)
        }));
        
        res.json(nearbyUsers);
    } catch (error) {
        console.error('Error finding nearby users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
```

## Testing

### Frontend Testing:
1. Open browser console
2. Look for "Location updated: { latitude: ..., longitude: ... }"
3. Check Network tab for PUT request to `/api/users/location`

### Backend Testing:
```bash
# Test location update
curl -X PUT http://localhost:5000/api/users/location \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 13.7563, "longitude": 100.5018}'

# Test nearby users
curl http://localhost:5000/api/users/nearby?radius=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Privacy Considerations

⚠️ **Important Privacy Notes:**
1. Always get user consent before tracking location
2. Consider adding a toggle in user settings to enable/disable tracking
3. Don't share exact coordinates publicly
4. Use approximate locations (e.g., "within 5km") when displaying to other users
5. Comply with GDPR/privacy regulations

## Browser Permissions

Users will see a browser prompt asking for location permission:
- **Allow**: Location tracking will work
- **Block**: Location tracking will fail silently (check console)

To test, you may need to:
1. Clear site permissions in browser
2. Refresh page
3. Allow location access when prompted

## Deployment Notes

### HTTPS Required
- Geolocation API requires HTTPS in production
- Works on localhost without HTTPS
- Vercel provides HTTPS by default ✅

### Mobile Considerations
- Location accuracy varies by device
- GPS may drain battery
- Consider using `enableHighAccuracy: false` to save battery (already set)

## Next Steps

1. ✅ Frontend implementation complete
2. ⚠️ Add backend route `/api/users/location`
3. ⚠️ Update User model with location fields
4. 🔄 Test locally
5. 🚀 Deploy to production
