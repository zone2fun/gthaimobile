import { useState, useEffect } from 'react';
import '../styles/AnnouncementModal.css';

const AnnouncementModal = ({ announcement, onClose, onTrackClick }) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // Track click when modal is opened
    useEffect(() => {
        onTrackClick(announcement._id);
    }, [announcement._id, onTrackClick]);

    const handleClose = () => {
        if (dontShowAgain) {
            // Save to localStorage
            const hiddenAnnouncements = JSON.parse(localStorage.getItem('hiddenAnnouncements') || '[]');
            if (!hiddenAnnouncements.includes(announcement._id)) {
                hiddenAnnouncements.push(announcement._id);
                localStorage.setItem('hiddenAnnouncements', JSON.stringify(hiddenAnnouncements));
            }
        }
        onClose();
    };

    const handleImageClick = () => {
        if (announcement.link) {
            window.open(announcement.link, '_blank');
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target.className === 'announcement-modal-backdrop') {
            handleClose();
        }
    };

    const handleCheckboxClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div className="announcement-modal-backdrop" onClick={handleBackdropClick}>
            <div className="announcement-modal-poster">
                <button className="announcement-close-btn" onClick={handleClose}>
                    <span className="material-icons">close</span>
                </button>

                <div
                    className="announcement-poster-image"
                    style={{ backgroundImage: `url(${announcement.image})` }}
                    onClick={handleImageClick}
                >
                    {/* Checkbox overlay at bottom */}
                    <div className="announcement-checkbox-overlay" onClick={handleCheckboxClick}>
                        <label className="dont-show-checkbox">
                            <input
                                type="checkbox"
                                checked={dontShowAgain}
                                onChange={(e) => setDontShowAgain(e.target.checked)}
                            />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-label">ไม่แสดงประกาศนี้อีก</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementModal;
