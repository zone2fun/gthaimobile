import { Link } from 'react-router-dom';

const ProfileCard = ({ user }) => {
    return (
        <Link to={`/user/${user.id}`} className="profile-card">
            <img src={user.img} alt={user.name} />
            {user.starred && <span className="material-icons star-icon">star</span>}
            <div className="profile-info">
                <div className="status-dot"></div>
                <span className="profile-name">{user.name}</span>
            </div>
        </Link>
    );
};

export default ProfileCard;
