import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getUsers } from '../services/api';
import AuthContext from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const searchUsers = async () => {
            if (!query.trim()) {
                setResults([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const allUsers = await getUsers(token);

                // Filter users whose bio contains the search query (case-insensitive)
                const filtered = allUsers.filter(user =>
                    user.bio && user.bio.toLowerCase().includes(query.toLowerCase())
                );

                setResults(filtered);
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setLoading(false);
            }
        };

        searchUsers();
    }, [query, token]);

    return (
        <div className="search-results-page" style={{ padding: '20px 0' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 15px 15px',
                gap: '10px'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <span className="material-icons">arrow_back</span>
                </button>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                    Search Results for "{query}"
                </h2>
            </div>

            {loading ? (
                <div style={{
                    color: 'var(--secondary-text)',
                    textAlign: 'center',
                    marginTop: '50px'
                }}>
                    Searching...
                </div>
            ) : results.length > 0 ? (
                <>
                    <div style={{
                        padding: '0 15px 10px',
                        color: 'var(--secondary-text)',
                        fontSize: '14px'
                    }}>
                        Found {results.length} user{results.length !== 1 ? 's' : ''}
                    </div>
                    <div className="grid-container" style={{ padding: '0 15px' }}>
                        {results.map((user, index) => (
                            <ProfileCard key={user._id || user.id || index} user={user} />
                        ))}
                    </div>
                </>
            ) : (
                <div style={{
                    color: 'var(--secondary-text)',
                    textAlign: 'center',
                    marginTop: '50px'
                }}>
                    No users found with "{query}" in their bio
                </div>
            )}
        </div>
    );
};

export default SearchResults;
