import { Link } from 'react-router-dom';

const ProfileCard = ({ user }) => {
    return (
        <Link to={`/user/${user._id || user.id}`} className="profile-card">
            <img src={user.img} alt={user.name} />
            {user.starred && <span className="material-icons star-icon">star</span>}
            <div className="profile-info">
                <div className="status-dot"></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="profile-name">{user.name}</span>
                    {user.distance !== undefined && (
                        <span style={{ fontSize: '10px', color: '#ccc' }}>{user.distance} m</span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProfileCard;
