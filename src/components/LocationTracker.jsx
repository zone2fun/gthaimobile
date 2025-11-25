import React, { useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';

const LocationTracker = () => {
    const { user, token } = useContext(AuthContext);

    useEffect(() => {
        if (!user || !token) return;

        const updateLocation = async () => {
            if (!navigator.geolocation) {
                console.log('Geolocation is not supported by this browser.');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    try {
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/location`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                latitude,
                                longitude
                            })
                        });

                        if (response.ok) {
                            console.log('Location updated:', { latitude, longitude });
                        } else {
                            console.error('Failed to update location');
                        }
                    } catch (error) {
                        console.error('Error updating location:', error);
                    }
                },
                (error) => {
                    console.error('Error getting location:', error.message);
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        };

        // Update location immediately on mount
        updateLocation();

        // Update location every 10 minutes (600000 milliseconds)
        const intervalId = setInterval(updateLocation, 10 * 60 * 1000);

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, [user, token]);

    // This component doesn't render anything
    return null;
};

export default LocationTracker;
