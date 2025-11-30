import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AlertModal, ConfirmModal } from '../components/CustomModals';

const Settings = () => {
    const [settings, setSettings] = useState({
        adsenseEnabled: true,
        maintenanceMode: false,
        maintenanceConfig: {
            enabled: false,
            reason: 'ปิดปรับปรุงปกติ',
            expectedEndTime: null
        }
    });
    const [loading, setLoading] = useState(true);
    const [backupLoading, setBackupLoading] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [maintenanceForm, setMaintenanceForm] = useState({
        reason: 'ปิดปรับปรุงปกติ',
        expectedEndTime: ''
    });
    const fileInputRef = useRef(null);

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
        onConfirm: null
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const maintenanceReasons = [
        'ปิดปรับปรุงปกติ',
        'มีเหตุขัดข้อง',
        'ทำการ Backup ระบบ'
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const { data } = await axios.get(`${API_URL}/api/admin/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSettings(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching settings:', error);
            showAlert('Error', 'Failed to fetch settings', 'error');
            setLoading(false);
        }
    };

    const handleToggleAdSense = async () => {
        const newValue = !settings.adsenseEnabled;
        setSettings(prev => ({ ...prev, adsenseEnabled: newValue }));

        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`${API_URL}/api/admin/settings`,
                { key: 'adsenseEnabled', value: newValue },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error('Error updating settings:', error);
            setSettings(prev => ({ ...prev, adsenseEnabled: !newValue }));
            showAlert('Error', 'Failed to update setting', 'error');
        }
    };

    const handleToggleMaintenanceClick = () => {
        if (settings.maintenanceConfig.enabled) {
            // Disable maintenance mode
            setConfirmModal({
                isOpen: true,
                title: 'Disable Maintenance Mode?',
                message: 'Users will be able to access the application again. Continue?',
                onConfirm: () => updateMaintenanceMode(false, settings.maintenanceConfig.reason, null)
            });
        } else {
            // Show modal to configure maintenance mode
            setMaintenanceForm({
                reason: settings.maintenanceConfig.reason || 'ปิดปรับปรุงปกติ',
                expectedEndTime: settings.maintenanceConfig.expectedEndTime || ''
            });
            setShowMaintenanceModal(true);
        }
    };

    const handleMaintenanceSubmit = () => {
        if (!maintenanceForm.expectedEndTime) {
            showAlert('Error', 'Please select expected end time', 'error');
            return;
        }

        setShowMaintenanceModal(false);
        updateMaintenanceMode(true, maintenanceForm.reason, maintenanceForm.expectedEndTime);
    };

    const updateMaintenanceMode = async (enabled, reason, expectedEndTime) => {
        const newConfig = {
            enabled,
            reason,
            expectedEndTime
        };

        // Optimistic update
        setSettings(prev => ({
            ...prev,
            maintenanceMode: enabled,
            maintenanceConfig: newConfig
        }));

        try {
            const token = localStorage.getItem('adminToken');

            // Update both maintenanceMode and maintenanceConfig
            await axios.put(`${API_URL}/api/admin/settings`,
                { key: 'maintenanceMode', value: enabled },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            await axios.put(`${API_URL}/api/admin/settings`,
                { key: 'maintenanceConfig', value: newConfig },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showAlert('Success', `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`, 'success');
        } catch (error) {
            console.error('Error updating maintenance mode:', error);
            // Revert on error
            setSettings(prev => ({
                ...prev,
                maintenanceMode: !enabled,
                maintenanceConfig: { ...prev.maintenanceConfig, enabled: !enabled }
            }));
            showAlert('Error', 'Failed to update maintenance mode', 'error');
        }
    };

    const handleBackup = async () => {
        setBackupLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/admin/backup`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers['content-disposition'];
            let fileName = `backup-${new Date().toISOString().slice(0, 10)}.json`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch && fileNameMatch.length === 2)
                    fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            showAlert('Success', 'Database backup downloaded successfully', 'success');
        } catch (error) {
            console.error('Error creating backup:', error);
            showAlert('Error', 'Failed to create backup', 'error');
        } finally {
            setBackupLoading(false);
        }
    };

    const handleRestoreClick = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Restore Database?',
            message: 'WARNING: This will DELETE all current data and replace it with the backup file. This action CANNOT be undone. Are you absolutely sure?',
            onConfirm: () => fileInputRef.current?.click()
        });
    };

    const handleRestoreFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setRestoreLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const formData = new FormData();
            formData.append('backup', file);

            await axios.post(`${API_URL}/api/admin/restore`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            showAlert('Success', 'Database restored successfully! Please refresh the page.', 'success');
        } catch (error) {
            console.error('Error restoring database:', error);
            showAlert('Error', error.response?.data?.message || 'Failed to restore database', 'error');
        } finally {
            setRestoreLoading(false);
            e.target.value = '';
        }
    };

    const showAlert = (title, message, type = 'success') => {
        setAlertModal({ isOpen: true, title, message, type });
    };

    const closeAlert = () => {
        setAlertModal(prev => ({ ...prev, isOpen: false }));
    };

    const closeConfirm = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleConfirm = () => {
        if (confirmModal.onConfirm) {
            confirmModal.onConfirm();
        }
        closeConfirm();
    };

    if (loading) {
        return <div style={{ padding: '20px', color: 'white' }}>Loading settings...</div>;
    }

    return (
        <div className="settings-page">
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={closeAlert}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={handleConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleRestoreFile}
            />

            {/* Maintenance Configuration Modal */}
            {showMaintenanceModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }} onClick={() => setShowMaintenanceModal(false)}>
                    <div style={{
                        backgroundColor: '#1a1a1a', borderRadius: '15px',
                        padding: '30px', maxWidth: '500px', width: '90%'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: 'white' }}>
                            Configure Maintenance Mode
                        </h3>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '14px' }}>
                                Reason
                            </label>
                            {maintenanceReasons.map(reason => (
                                <div key={reason} onClick={() => setMaintenanceForm(prev => ({ ...prev, reason }))}
                                    style={{
                                        padding: '12px', marginBottom: '8px', borderRadius: '8px',
                                        border: `2px solid ${maintenanceForm.reason === reason ? '#a607d6' : '#333'}`,
                                        backgroundColor: maintenanceForm.reason === reason ? 'rgba(166, 7, 214, 0.1)' : 'transparent',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}>
                                    <span style={{ color: 'white' }}>{reason}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#aaa', fontSize: '14px' }}>
                                Expected End Time
                            </label>
                            <input
                                type="datetime-local"
                                value={maintenanceForm.expectedEndTime}
                                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, expectedEndTime: e.target.value }))}
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    border: '1px solid #333', backgroundColor: '#2a2a2a',
                                    color: 'white', fontSize: '14px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowMaintenanceModal(false)}
                                style={{
                                    padding: '12px 24px', borderRadius: '8px',
                                    border: '1px solid #333', backgroundColor: 'transparent',
                                    color: 'white', cursor: 'pointer', fontWeight: '500'
                                }}>
                                Cancel
                            </button>
                            <button onClick={handleMaintenanceSubmit}
                                style={{
                                    padding: '12px 24px', borderRadius: '8px',
                                    border: 'none', backgroundColor: '#ff4444',
                                    color: 'white', cursor: 'pointer', fontWeight: '500'
                                }}>
                                Enable Maintenance
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px', color: 'white' }}>System Settings</h1>

            <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                {/* AdSense Card */}
                <div style={{
                    backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '16px',
                    border: '1px solid #333', display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                backgroundColor: 'rgba(247, 185, 40, 0.1)', color: '#f7b928',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span className="material-icons">monetization_on</span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>Google AdSense</h3>
                        </div>
                        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                            Enable or disable Google AdSense advertisements across the entire platform.
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #333' }}>
                        <span style={{ color: settings.adsenseEnabled ? '#2ecc71' : '#ff4444', fontWeight: '500', fontSize: '14px' }}>
                            {settings.adsenseEnabled ? 'Active' : 'Inactive'}
                        </span>
                        <ToggleSwitch
                            checked={settings.adsenseEnabled}
                            onChange={handleToggleAdSense}
                        />
                    </div>
                </div>

                {/* Maintenance Mode Card */}
                <div style={{
                    backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '16px',
                    border: '1px solid #333', display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#ff4444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span className="material-icons">construction</span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>Maintenance Mode</h3>
                        </div>
                        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '10px', lineHeight: '1.5' }}>
                            Block all users from accessing the application.
                        </p>
                        {settings.maintenanceConfig.enabled && (
                            <div style={{
                                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                                padding: '10px', borderRadius: '8px', marginTop: '10px'
                            }}>
                                <div style={{ fontSize: '12px', color: '#ff4444', marginBottom: '5px' }}>
                                    <strong>Reason:</strong> {settings.maintenanceConfig.reason}
                                </div>
                                {settings.maintenanceConfig.expectedEndTime && (
                                    <div style={{ fontSize: '12px', color: '#ff4444' }}>
                                        <strong>Expected End:</strong> {new Date(settings.maintenanceConfig.expectedEndTime).toLocaleString('th-TH')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #333' }}>
                        <span style={{ color: settings.maintenanceConfig.enabled ? '#ff4444' : '#2ecc71', fontWeight: '500', fontSize: '14px' }}>
                            {settings.maintenanceConfig.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <ToggleSwitch
                            checked={settings.maintenanceConfig.enabled}
                            onChange={handleToggleMaintenanceClick}
                        />
                    </div>
                </div>

                {/* Backup Card */}
                <div style={{
                    backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '16px',
                    border: '1px solid #333', display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span className="material-icons">backup</span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>Database Backup</h3>
                        </div>
                        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                            Create a full backup of the database in JSON format.
                        </p>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #333' }}>
                        <button
                            onClick={handleBackup}
                            disabled={backupLoading}
                            style={{
                                width: '100%', padding: '12px', backgroundColor: '#2ecc71',
                                color: 'white', border: 'none', borderRadius: '8px',
                                cursor: backupLoading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '10px', fontWeight: '600', transition: 'background-color 0.2s',
                                opacity: backupLoading ? 0.7 : 1
                            }}
                            onMouseOver={(e) => !backupLoading && (e.target.style.backgroundColor = '#27ae60')}
                            onMouseOut={(e) => !backupLoading && (e.target.style.backgroundColor = '#2ecc71')}
                        >
                            {backupLoading ? (
                                <>
                                    <span className="material-icons" style={{ animation: 'spin 1s linear infinite' }}>refresh</span>
                                    Creating Backup...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons">download</span>
                                    Download Backup
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Restore Card */}
                <div style={{
                    backgroundColor: '#1e1e1e', padding: '25px', borderRadius: '16px',
                    border: '1px solid #333', display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                backgroundColor: 'rgba(255, 152, 0, 0.1)', color: '#ff9800',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span className="material-icons">restore</span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>Restore Database</h3>
                        </div>
                        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                            Restore database from a backup file.
                            <strong style={{ color: '#ff4444' }}> WARNING: This will delete all current data!</strong>
                        </p>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #333' }}>
                        <button
                            onClick={handleRestoreClick}
                            disabled={restoreLoading}
                            style={{
                                width: '100%', padding: '12px', backgroundColor: '#ff9800',
                                color: 'white', border: 'none', borderRadius: '8px',
                                cursor: restoreLoading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '10px', fontWeight: '600', transition: 'background-color 0.2s',
                                opacity: restoreLoading ? 0.7 : 1
                            }}
                            onMouseOver={(e) => !restoreLoading && (e.target.style.backgroundColor = '#f57c00')}
                            onMouseOut={(e) => !restoreLoading && (e.target.style.backgroundColor = '#ff9800')}
                        >
                            {restoreLoading ? (
                                <>
                                    <span className="material-icons" style={{ animation: 'spin 1s linear infinite' }}>refresh</span>
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <span className="material-icons">upload</span>
                                    Restore from Backup
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Toggle Switch Component
const ToggleSwitch = ({ checked, onChange }) => (
    <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer' }}>
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            style={{ opacity: 0, width: 0, height: 0 }}
        />
        <span style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: checked ? '#a607d6' : '#444',
            transition: '.4s', borderRadius: '34px'
        }}>
            <span style={{
                position: 'absolute', content: '""', height: '20px', width: '20px',
                left: checked ? '26px' : '4px', bottom: '3px',
                backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
            }}></span>
        </span>
    </label>
);

export default Settings;
