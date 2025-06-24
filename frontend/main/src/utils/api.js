const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const fetchWithAuth = async (endpoint, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(errorData.detail || 'API request failed');
    }
    
    return response;
};

export { API_BASE_URL };