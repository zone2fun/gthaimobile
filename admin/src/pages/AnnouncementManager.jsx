import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertModal, ConfirmModal } from '../components/CustomModals';
import '../styles/AnnouncementManager.css';

const AnnouncementManager = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        link: '',
        startTime: '',
        isActive: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const showAlert = (title, message, type = 'success') => {
        setAlertModal({ isOpen: true, title, message, type });
    };

    const closeAlert = () => {
        setAlertModal(prev => ({ ...prev, isOpen: false }));
    };

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.get(`${API_URL}/api/announcements`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            showAlert('Error', 'Failed to fetch announcements', 'error');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('adminToken');
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('content', '');
            formDataToSend.append('link', formData.link);
            formDataToSend.append('startTime', formData.startTime);
            formDataToSend.append('isActive', formData.isActive);

            if (imageFile) {
                formDataToSend.append('image', imageFile);
            }

            if (editingId) {
                await axios.put(`${API_URL}/api/announcements/${editingId}`, formDataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                showAlert('Success', 'Announcement updated successfully', 'success');
            } else {
                await axios.post(`${API_URL}/api/announcements`, formDataToSend, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                showAlert('Success', 'Announcement created successfully', 'success');
            }

            resetForm();
            fetchAnnouncements();
        } catch (error) {
            console.error('Error saving announcement:', error);
            showAlert('Error', error.response?.data?.message || 'Failed to save announcement', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (announcement) => {
        setEditingId(announcement._id);
        setFormData({
            title: announcement.title,
            link: announcement.link || '',
            startTime: new Date(announcement.startTime).toISOString().slice(0, 16),
            isActive: announcement.isActive
        });
        setImagePreview(announcement.image);
        setShowForm(true);
    };

    const handleDeleteClick = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Announcement',
            message: 'Are you sure you want to delete this announcement? This action cannot be undone.',
            onConfirm: () => handleDelete(id)
        });
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`${API_URL}/api/announcements/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showAlert('Success', 'Announcement deleted successfully', 'success');
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            showAlert('Error', 'Failed to delete announcement', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            link: '',
            startTime: '',
            isActive: true
        });
        setImageFile(null);
        setImagePreview(null);
        setEditingId(null);
        setShowForm(false);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="announcement-manager">
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={closeAlert}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type="danger"
                confirmText="Delete"
            />

            <div className="manager-header">
                <h1>Announcement Manager</h1>
                <button
                    className="btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Cancel' : '+ New Announcement'}
                </button>
            </div>

            {showForm && (
                <div className="announcement-form-container">
                    <h2>{editingId ? 'Edit Announcement' : 'Create New Announcement'}</h2>
                    <form onSubmit={handleSubmit} className="announcement-form">
                        <div className="form-group">
                            <label>Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter announcement title"
                            />
                        </div>

                        <div className="form-group">
                            <label>Background Image *</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                required={!editingId}
                            />
                            {imagePreview && (
                                <div className="image-preview">
                                    <img src={imagePreview} alt="Preview" />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>External Link (Optional)</label>
                            <input
                                type="url"
                                name="link"
                                value={formData.link}
                                onChange={handleInputChange}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>Start Time *</label>
                            <input
                                type="datetime-local"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                                Active
                            </label>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                            </button>
                            <button type="button" className="btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="announcements-list">
                <h2>All Announcements</h2>
                {announcements.length === 0 ? (
                    <p className="no-data">No announcements yet</p>
                ) : (
                    <div className="announcements-grid">
                        {announcements.map(announcement => (
                            <div key={announcement._id} className="announcement-card">
                                <div
                                    className="announcement-image"
                                    style={{ backgroundImage: `url(${announcement.image})` }}
                                >
                                    <div className="announcement-overlay">
                                        <h3>{announcement.title}</h3>
                                    </div>
                                </div>
                                <div className="announcement-details">
                                    {announcement.link && (
                                        <p className="announcement-link">
                                            <span className="material-icons">link</span>
                                            <a href={announcement.link} target="_blank" rel="noopener noreferrer">
                                                {announcement.link}
                                            </a>
                                        </p>
                                    )}
                                    <div className="announcement-meta">
                                        <span className="meta-item">
                                            <span className="material-icons">schedule</span>
                                            {formatDate(announcement.startTime)}
                                        </span>
                                        <span className="meta-item">
                                            <span className="material-icons">touch_app</span>
                                            {announcement.clickCount} clicks
                                        </span>
                                        <span className={`status-badge ${announcement.isActive ? 'active' : 'inactive'}`}>
                                            {announcement.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="announcement-actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEdit(announcement)}
                                        >
                                            <span className="material-icons">edit</span>
                                            Edit
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDeleteClick(announcement._id)}
                                        >
                                            <span className="material-icons">delete</span>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnouncementManager;
