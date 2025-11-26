import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const ProfileCard = ({ user, isGrid }) => {
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const handleClick = () => {
        if (token) {
            navigate(`/user/${user._id || user.id}`);
        } else {
            navigate('/login');
        }
    };

    const displayName = user.name.length > 8
        ? user.name.substring(0, 8) + '...'
        : user.name;

    return (
        <div onClick={handleClick} className="profile-card" style={{ cursor: 'pointer' }}>
            <img src={user.img} alt={user.name} />
            {user.starred && <span className="material-icons star-icon">star</span>}
            <div className="profile-info">
                <div className={`status-dot ${user.isOnline ? 'online' : 'offline'}`}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="profile-name">{displayName}</span>
                    {user.distance !== undefined && user.distance !== null && (
                        <span style={{ fontSize: '10px', color: '#ccc' }}>
                            {(user.distance / 1000).toFixed(1)} km
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
