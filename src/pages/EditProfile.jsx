import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { updateProfile } from '../services/api';

const EditProfile = () => {
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user && token) {
                try {
                    // Fetch full user profile from API
                    const response = await fetch(`http://localhost:5000/api/users/${user._id}`, {
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
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            }
        };

        fetchUserProfile();
    }, [user, token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            setError('Maximum 5 gallery images allowed');
            return;
        }

        setNewGalleryFiles([...newGalleryFiles, ...files]);
        setError('');
    };

    const handleDeleteGalleryImage = (index, isExisting) => {
        if (isExisting) {
            setGalleryImages(galleryImages.filter((_, i) => i !== index));
        } else {
            setNewGalleryFiles(newGalleryFiles.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });
        data.append('lookingFor', lookingForOptions.join(','));
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

        try {
            const updatedUser = await updateProfile(data, token);
            // Update context user
            setUser(updatedUser);
            // Update local storage
            localStorage.setItem('user', JSON.stringify(updatedUser));
            navigate(`/user/${updatedUser._id}`);
        } catch (err) {
            console.error(err);
            setError('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-content" style={{ padding: '20px', paddingBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', marginRight: '10px', cursor: 'pointer' }}>
                    <span className="material-icons">arrow_back</span>
                </button>
                <h2 style={{ margin: 0 }}>Edit Profile</h2>
            </div>

            {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                {/* Cover Image */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', color: '#a0a0a0' }}>Cover Image</label>
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
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
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
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={labelStyle}>Display Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} required />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Age</label>
                        <input type="number" name="age" value={formData.age} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Country</label>
                        <select name="country" value={formData.country} onChange={handleChange} style={inputStyle}>
                            <option value="">Select Country</option>
                            <option value="Thailand">Thailand</option>
                            <option value="USA">USA</option>
                            <option value="UK">UK</option>
                            <option value="Japan">Japan</option>
                            <option value="Korea">Korea</option>
                            <option value="China">China</option>
                            <option value="Vietnam">Vietnam</option>
                            <option value="Singapore">Singapore</option>
                            <option value="Malaysia">Malaysia</option>
                            <option value="Philippines">Philippines</option>
                            <option value="Indonesia">Indonesia</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Height (cm)</label>
                        <input type="number" name="height" value={formData.height} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Weight (kg)</label>
                        <input type="number" name="weight" value={formData.weight} onChange={handleChange} style={inputStyle} />
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Looking For</label>
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
                    <label style={labelStyle}>About Me (แนะนำตัว)</label>
                    <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="เขียนประโยคสั้นๆ แนะนำตัวเอง (สูงสุด 200 ตัวอักษร)"
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
                    <label style={labelStyle}>Gallery (Max 5 images)</label>
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

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#a607d6', color: 'white', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
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
