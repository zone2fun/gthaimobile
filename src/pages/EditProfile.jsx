import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthContext from '../context/AuthContext';
import { updateProfile, changePassword, deleteAccount } from '../services/api';
import VerificationModal from '../components/VerificationModal';

const EditProfile = () => {
    const { t } = useTranslation();
    const { user, token, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        height: '',
        weight: '',
        country: '',
        bio: '',
    });
    const [lookingForOptions, setLookingForOptions] = useState([]);
    const [imgFile, setImgFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [imgPreview, setImgPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);
    const [newGalleryFiles, setNewGalleryFiles] = useState([]);
    const [privateAlbum, setPrivateAlbum] = useState([]);
    const [newPrivateFiles, setNewPrivateFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationStream, setVerificationStream] = useState(null);
    const [verificationPhoto, setVerificationPhoto] = useState(null);
    const [submittingVerification, setSubmittingVerification] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [passwordError, setPasswordError] = useState('');

    // Alert modal state
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });


    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user && token) {
                try {
                    // Fetch full user profile from API
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user._id}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    const fullUserData = await response.json();
                    console.log('EditProfile - full user data:', fullUserData);

                    setFormData({
                        name: fullUserData.name || '',
                        age: fullUserData.age || '',
                        height: fullUserData.height || '',
                        weight: fullUserData.weight || '',
                        country: fullUserData.country || '',
                        bio: fullUserData.bio || '',
                    });
                    setLookingForOptions(fullUserData.lookingFor || []);
                    setImgPreview(fullUserData.img);
                    setCoverPreview(fullUserData.cover);
                    setGalleryImages(fullUserData.gallery || []);
                    setPrivateAlbum(fullUserData.privateAlbum || []);
                    setIsPublic(fullUserData.isPublic !== undefined ? fullUserData.isPublic : true);
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            }
        };

        fetchUserProfile();
    }, [user?._id, token]);

    // Refresh user data to get latest verification status
    const refreshUserData = async () => {
        if (user && token) {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user._id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const fullUserData = await response.json();

                // Update user context with latest data
                const updatedUser = {
                    ...user,
                    isVerified: fullUserData.isVerified,
                    verificationStatus: fullUserData.verificationStatus
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            } catch (error) {
                console.error('Error refreshing user data:', error);
            }
        }
    };

    // Cleanup camera stream when modal closes
    useEffect(() => {
        return () => {
            if (verificationStream) {
                verificationStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [verificationStream]);

    // Periodically refresh user data to check verification status
    useEffect(() => {
        const interval = setInterval(() => {
            refreshUserData();
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [user, token]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validate age in real-time
        if (name === 'age' && value && parseInt(value) < 18) {
            setError(t('editProfile.errors.age'));
        } else if (name === 'age' && error.includes('18 years old')) {
            setError(''); // Clear age error if valid
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleLookingForChange = (option) => {
        setLookingForOptions(prev =>
            prev.includes(option)
                ? prev.filter(item => item !== option)
                : [...prev, option]
        );
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (e.target.name === 'img') {
                setImgFile(file);
                setImgPreview(URL.createObjectURL(file));
            } else if (e.target.name === 'cover') {
                setCoverFile(file);
                setCoverPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleGalleryUpload = (e) => {
        const files = Array.from(e.target.files);
        const totalImages = galleryImages.length + newGalleryFiles.length + files.length;

        if (totalImages > 5) {
            setError(t('editProfile.errors.galleryMax'));
            return;
        }

        setError('');
        setNewGalleryFiles([...newGalleryFiles, ...files]);
    };

    const handleDeleteGalleryImage = (index, isExisting) => {
        if (isExisting) {
            setGalleryImages(galleryImages.filter((_, i) => i !== index));
        } else {
            setNewGalleryFiles(newGalleryFiles.filter((_, i) => i !== index));
        }
    };

    const handlePrivateAlbumUpload = (e) => {
        const files = Array.from(e.target.files);
        const totalImages = privateAlbum.length + newPrivateFiles.length + files.length;

        if (totalImages > 3) {
            setError(t('editProfile.errors.privateMax'));
            return;
        }

        setError('');
        setNewPrivateFiles([...newPrivateFiles, ...files]);
    };

    const removeGalleryImage = (index) => {
        setGalleryImages(galleryImages.filter((_, i) => i !== index));
    };

    const removeNewGalleryFile = (index) => {
        setNewGalleryFiles(newGalleryFiles.filter((_, i) => i !== index));
    };

    const removePrivateAlbumImage = (index) => {
        setPrivateAlbum(privateAlbum.filter((_, i) => i !== index));
    };

    const removeNewPrivateFile = (index) => {
        setNewPrivateFiles(newPrivateFiles.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate age
        if (formData.age && parseInt(formData.age) < 18) {
            setError(t('editProfile.errors.age'));
            setLoading(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        data.append('lookingFor', lookingForOptions.join(','));
        data.append('isPublic', isPublic);
        if (imgFile) data.append('img', imgFile);
        if (coverFile) data.append('cover', coverFile);

        // Add existing gallery URLs
        if (galleryImages.length > 0) {
            data.append('existingGallery', galleryImages.join(','));
        }

        // Add new gallery files
        newGalleryFiles.forEach(file => {
            data.append('gallery', file);
        });

        // Add existing private album URLs
        if (privateAlbum.length > 0) {
            data.append('existingPrivateAlbum', privateAlbum.join(','));
        }

        // Add new private album files
        newPrivateFiles.forEach(file => {
            data.append('privateAlbum', file);
        });

        console.log('Submitting profile update...');
        console.log('Gallery images:', galleryImages);
        console.log('New gallery files:', newGalleryFiles);
        console.log('Private album:', privateAlbum);
        console.log('New private files:', newPrivateFiles);

        try {
            const updatedUser = await updateProfile(data, token);
            console.log('Profile updated successfully:', updatedUser);
            // Update context user
            setUser(updatedUser);
            // Update local storage
            localStorage.setItem('user', JSON.stringify(updatedUser));
            navigate(`/user/${updatedUser._id}`);
        } catch (err) {
            console.error('Profile update error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        if (passwordData.new !== passwordData.confirm) {
            setPasswordError(t('editProfile.errors.passwordMismatch'));
            return;
        }
        if (passwordData.new.length < 8) {
            setPasswordError(t('editProfile.errors.passwordLength'));
            return;
        }
        try {
            const res = await changePassword(passwordData.current, passwordData.new, token);
            if (res.message === 'Password updated successfully') {
                setShowPasswordModal(false);
                setPasswordData({ current: '', new: '', confirm: '' });
                setAlertModal({
                    isOpen: true,
                    type: 'success',
                    title: t('editProfile.errors.success'),
                    message: t('editProfile.errors.passwordSuccess')
                });
            } else {
                setPasswordError(res.message || t('editProfile.errors.passwordFail'));
            }
        } catch (err) {
            setPasswordError(t('editProfile.errors.errorOccurred'));
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await deleteAccount(token);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setUser(null);
            navigate('/login');
        } catch (err) {
            console.error(err);
            setAlertModal({
                isOpen: true,
                type: 'error',
                title: t('editProfile.errors.error'),
                message: t('editProfile.errors.deleteFail')
            });
        }
    };

    const openVerificationCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            });
            setVerificationStream(stream);
            setShowVerificationModal(true);
        } catch (err) {
            console.error('Camera access error:', err);
            setAlertModal({
                isOpen: true,
                type: 'error',
                title: t('editProfile.errors.cameraDenied'),
                message: t('editProfile.errors.cameraPermission')
            });
        }
    };

    const captureVerificationPhoto = () => {
        const video = document.getElementById('verification-video');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            setVerificationPhoto(blob);
        }, 'image/jpeg', 0.9);
    };

    const submitVerificationRequest = async () => {
        if (!verificationPhoto) {
            setAlertModal({
                isOpen: true,
                type: 'warning',
                title: t('editProfile.errors.noPhoto'),
                message: t('editProfile.errors.takePhotoFirst')
            });
            return;
        }

        setSubmittingVerification(true);
        try {
            const formData = new FormData();
            formData.append('verificationImage', verificationPhoto, 'verification.jpg');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/verification-request`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                setAlertModal({
                    isOpen: true,
                    type: 'success',
                    title: t('editProfile.errors.requestSubmitted'),
                    message: t('editProfile.errors.verificationSuccess')
                });
                closeVerificationModal();
                // Update user context
                const updatedUser = { ...user, verificationStatus: 'pending' };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
                setAlertModal({
                    isOpen: true,
                    type: 'error',
                    title: t('editProfile.errors.submissionFailed'),
                    message: data.message || t('editProfile.errors.verificationFail')
                });
            }
        } catch (err) {
            console.error('Verification submit error:', err);
            setAlertModal({
                isOpen: true,
                type: 'error',
                title: t('editProfile.errors.error'),
                message: t('editProfile.errors.verificationFail')
            });
        } finally {
            setSubmittingVerification(false);
        }
    };

    const closeVerificationModal = () => {
        if (verificationStream) {
            verificationStream.getTracks().forEach(track => track.stop());
            setVerificationStream(null);
        }
        setVerificationPhoto(null);
        setShowVerificationModal(false);
    };

    const getVerificationButtonText = () => {
        if (user?.isVerified) return t('editProfile.verified');
        if (user?.verificationStatus === 'pending') return t('editProfile.pendingVerification');
        if (user?.verificationStatus === 'rejected') return t('editProfile.verificationRejected');
        return t('editProfile.verifyAccount');
    };

    const getVerificationButtonStyle = () => {
        if (user?.isVerified) {
            return { backgroundColor: '#2ecc71', cursor: 'default' };
        }
        if (user?.verificationStatus === 'pending') {
            return { backgroundColor: '#f39c12', cursor: 'default' };
        }
        if (user?.verificationStatus === 'rejected') {
            return { backgroundColor: '#e74c3c', cursor: 'pointer' };
        }
        return { backgroundColor: '#a607d6', cursor: 'pointer' };
    };

    return (
        <div className="app-content" style={{ padding: '20px', paddingBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', marginRight: '10px', cursor: 'pointer' }}>
                    <span className="material-icons">arrow_back</span>
                </button>
                <h2 style={{ margin: 0 }}>{t('editProfile.title')}</h2>
            </div>

            {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                {/* Cover Image */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#a0a0a0' }}>{t('editProfile.coverImage')}</label>
                    <div style={{ position: 'relative', height: '150px', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                        {coverPreview && <img src={coverPreview} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        <input
                            type="file"
                            name="cover"
                            onChange={handleFileChange}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', padding: '5px', borderRadius: '50%', pointerEvents: 'none' }}>
                            <span className="material-icons" style={{ color: 'white', fontSize: '20px' }}>edit</span>
                        </div>
                    </div>
                </div>

                {/* Avatar Image */}
                <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '10px' }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid #333' }}>
                            {imgPreview && <img src={imgPreview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <input
                            type="file"
                            name="img"
                            onChange={handleFileChange}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', borderRadius: '50%' }}
                        />
                        <div style={{ position: 'absolute', bottom: '0', right: '0', background: '#a607d6', padding: '5px', borderRadius: '50%', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-icons" style={{ color: 'white', fontSize: '16px' }}>edit</span>
                        </div>
                    </div>

                    {/* Verification Button */}
                    <button
                        type="button"
                        onClick={user?.isVerified || user?.verificationStatus === 'pending' ? null : openVerificationCamera}
                        disabled={user?.isVerified || user?.verificationStatus === 'pending'}
                        style={{
                            ...getVerificationButtonStyle(),
                            border: 'none',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            opacity: (user?.isVerified || user?.verificationStatus === 'pending') ? 0.7 : 1
                        }}
                    >
                        <span className="material-icons" style={{ fontSize: '16px' }}>
                            {user?.isVerified ? 'verified' : 'camera_alt'}
                        </span>
                        {getVerificationButtonText()}
                    </button>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={labelStyle}>{t('editProfile.displayName')}</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} required />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>{t('editProfile.age')}</label>
                        <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            style={{
                                ...inputStyle,
                                border: formData.age && parseInt(formData.age) < 18 ? '2px solid #ff4444' : 'none',
                                boxShadow: formData.age && parseInt(formData.age) < 18 ? '0 0 10px rgba(255, 68, 68, 0.3)' : 'none'
                            }}
                            min="18"
                            max="120"
                            placeholder="18+"
                        />
                        {formData.age && parseInt(formData.age) < 18 && (
                            <div style={{
                                color: '#ff4444',
                                fontSize: '12px',
                                marginTop: '5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <span className="material-icons" style={{ fontSize: '14px' }}>warning</span>
                                {t('editProfile.errors.mustBe18')}
                            </div>
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>{t('editProfile.country')}</label>
                        <select name="country" value={formData.country} onChange={handleChange} style={inputStyle}>
                            <option value="">{t('editProfile.selectCountry')}</option>
                            <option value="Thailand">Thailand</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Japan">Japan</option>
                            <option value="China">China</option>
                            <option value="Korea">Korea</option>
                            <option value="Australia">Australia</option>
                            <option value="Singapore">Singapore</option>
                            <option value="Malaysia">Malaysia</option>
                            <option value="Vietnam">Vietnam</option>
                            <option value="Laos">Laos</option>
                            <option value="Myanmar">Myanmar</option>
                            <option value="Cambodia">Cambodia</option>
                            <option value="Philippines">Philippines</option>
                            <option value="Indonesia">Indonesia</option>
                            <option value="India">India</option>
                            <option value="Russia">Russia</option>
                            <option value="Germany">Germany</option>
                            <option value="France">France</option>
                            <option value="Italy">Italy</option>
                            <option value="Spain">Spain</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>{t('editProfile.height')}</label>
                        <input type="number" name="height" value={formData.height} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>{t('editProfile.weight')}</label>
                        <input type="number" name="weight" value={formData.weight} onChange={handleChange} style={inputStyle} />
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>{t('editProfile.lookingFor')}</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                        {['Friend', 'Chat', 'Dating', 'Lover'].map(option => (
                            <label key={option} style={{ display: 'flex', alignItems: 'center', color: '#ccc', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={lookingForOptions.includes(option)}
                                    onChange={() => handleLookingForChange(option)}
                                    style={{ marginRight: '8px', cursor: 'pointer' }}
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>{t('editProfile.aboutMe')}</label>
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder={t('editProfile.aboutMePlaceholder')}
                        maxLength={200}
                        rows={3}
                        style={{
                            ...inputStyle,
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            padding: '10px 15px'
                        }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#888', marginTop: '5px' }}>
                        {(formData.bio || '').length}/200
                    </div>
                </div>

                {/* Gallery Section */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>{t('editProfile.gallery')}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
                        {/* Existing gallery images */}
                        {galleryImages.map((img, index) => (
                            <div key={`existing-${index}`} style={{ position: 'relative', paddingTop: '100%', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden' }}>
                                <img src={img} alt={`Gallery ${index + 1}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                    type="button"
                                    onClick={() => handleDeleteGalleryImage(index, true)}
                                    style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,0,0,0.8)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '16px', color: 'white' }}>close</span>
                                </button>
                            </div>
                        ))}

                        {/* New gallery files preview */}
                        {newGalleryFiles.map((file, index) => (
                            <div key={`new-${index}`} style={{ position: 'relative', paddingTop: '100%', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden' }}>
                                <img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                    type="button"
                                    onClick={() => handleDeleteGalleryImage(index, false)}
                                    style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,0,0,0.8)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '16px', color: 'white' }}>close</span>
                                </button>
                            </div>
                        ))}

                        {/* Upload button */}
                        {(galleryImages.length + newGalleryFiles.length) < 5 && (
                            <div style={{ position: 'relative', paddingTop: '100%' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #666' }}>
                                    <span className="material-icons" style={{ fontSize: '40px', color: '#666', pointerEvents: 'none' }}>add_photo_alternate</span>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleGalleryUpload}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Private Album Section */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>{t('editProfile.privateAlbum')}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
                        {/* Existing private album images */}
                        {privateAlbum.map((img, index) => (
                            <div key={`existing-private-${index}`} style={{ position: 'relative', paddingTop: '100%', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden' }}>
                                <img src={img} alt={`Private ${index + 1}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                    type="button"
                                    onClick={() => removePrivateAlbumImage(index)}
                                    style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,0,0,0.8)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '16px', color: 'white' }}>close</span>
                                </button>
                            </div>
                        ))}

                        {/* New private album files preview */}
                        {newPrivateFiles.map((file, index) => (
                            <div key={`new-private-${index}`} style={{ position: 'relative', paddingTop: '100%', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden' }}>
                                <img src={URL.createObjectURL(file)} alt={`New Private ${index + 1}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                    type="button"
                                    onClick={() => removeNewPrivateFile(index)}
                                    style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,0,0,0.8)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <span className="material-icons" style={{ fontSize: '16px', color: 'white' }}>close</span>
                                </button>
                            </div>
                        ))}

                        {/* Upload button */}
                        {(privateAlbum.length + newPrivateFiles.length) < 3 && (
                            <div style={{ position: 'relative', paddingTop: '100%' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #666' }}>
                                    <span className="material-icons" style={{ fontSize: '40px', color: '#666', pointerEvents: 'none' }}>lock</span>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePrivateAlbumUpload}
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                                />
                            </div>
                        )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                        {t('editProfile.privateAlbumHint')}
                    </p>
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#a607d6', color: 'white', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? t('editProfile.saving') : t('editProfile.saveChanges')}
                </button>
            </form>

            {/* Privacy Section */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #444', paddingTop: '20px' }}>
                <h3 style={{ color: 'white', marginBottom: '15px' }}>{t('editProfile.privacySecurity')}</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>{t('editProfile.publicProfile')}</div>
                        <div style={{ color: '#888', fontSize: '12px' }}>{t('editProfile.publicProfileDesc')}</div>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                </div>

                <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #a607d6', backgroundColor: 'transparent', color: '#a607d6', fontWeight: 'bold', marginBottom: '10px', cursor: 'pointer' }}
                >
                    {t('editProfile.changePassword')}
                </button>

                <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ff4444', backgroundColor: 'transparent', color: '#ff4444', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    {t('editProfile.deleteAccount')}
                </button>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ color: 'white', marginBottom: '20px', textAlign: 'center' }}>{t('editProfile.changePassword')}</h3>
                        {passwordError && <p style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>{passwordError}</p>}
                        <form onSubmit={handlePasswordSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={labelStyle}>{t('editProfile.currentPassword')}</label>
                                <input
                                    type="password"
                                    value={passwordData.current}
                                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={labelStyle}>{t('editProfile.newPassword')}</label>
                                <input
                                    type="password"
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={labelStyle}>{t('editProfile.confirmNewPassword')}</label>
                                <input
                                    type="password"
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #666', backgroundColor: 'transparent', color: '#ccc', cursor: 'pointer' }}
                                >
                                    {t('editProfile.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#a607d6', color: 'white', cursor: 'pointer' }}
                                >
                                    {t('editProfile.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ color: '#ff4444', marginBottom: '15px', textAlign: 'center' }}>{t('editProfile.deleteAccount')}</h3>
                        <p style={{ color: '#ccc', marginBottom: '20px', textAlign: 'center', lineHeight: '1.5' }}>
                            {t('editProfile.deleteAccountConfirm')}
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #666', backgroundColor: 'transparent', color: '#ccc', cursor: 'pointer' }}
                            >
                                {t('editProfile.cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#ff4444', color: 'white', cursor: 'pointer' }}
                            >
                                {t('editProfile.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Verification Camera Modal */}
            {showVerificationModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, flexDirection: 'column'
                }}>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ color: 'white', margin: 0 }}>{t('editProfile.verificationPhoto')}</h3>
                            <button onClick={closeVerificationModal} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <p style={{ color: '#a0a0a0', fontSize: '14px', marginBottom: '15px' }}>
                            {t('editProfile.verificationDesc')}
                        </p>

                        {!verificationPhoto ? (
                            <>
                                <video
                                    id="verification-video"
                                    autoPlay
                                    playsInline
                                    ref={(video) => {
                                        if (video && verificationStream) {
                                            video.srcObject = verificationStream;
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        borderRadius: '8px',
                                        marginBottom: '15px',
                                        backgroundColor: '#000'
                                    }}
                                />
                                <button
                                    onClick={captureVerificationPhoto}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: '#a607d6',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <span className="material-icons">camera</span>
                                    {t('editProfile.capturePhoto')}
                                </button>
                            </>
                        ) : (
                            <>
                                <img
                                    src={URL.createObjectURL(verificationPhoto)}
                                    alt="Verification preview"
                                    style={{
                                        width: '100%',
                                        borderRadius: '8px',
                                        marginBottom: '15px'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => setVerificationPhoto(null)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid #666',
                                            backgroundColor: 'transparent',
                                            color: '#ccc',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {t('editProfile.retake')}
                                    </button>
                                    <button
                                        onClick={submitVerificationRequest}
                                        disabled={submittingVerification}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: '#2ecc71',
                                            color: 'white',
                                            cursor: submittingVerification ? 'not-allowed' : 'pointer',
                                            opacity: submittingVerification ? 0.7 : 1
                                        }}
                                    >
                                        {submittingVerification ? t('editProfile.submitting') : t('editProfile.submit')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            <VerificationModal
                isOpen={alertModal.isOpen}
                type={alertModal.type}
                title={alertModal.title}
                message={alertModal.message}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
            />
        </div>
    );
};

const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    color: '#a0a0a0',
    fontSize: '14px'
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#333',
    color: 'white',
    fontSize: '16px'
};

export default EditProfile;
