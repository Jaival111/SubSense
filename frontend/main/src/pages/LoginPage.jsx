import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/api'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSignInAlt, faUser } from '@fortawesome/free-solid-svg-icons';

function LoginPage() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({ email: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));

        if (name === 'email') {
            if (!validateEmail(value)) {
                setFormErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
            } else {
                setFormErrors(prev => ({ ...prev, email: '' }));
            }
        }
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }
        setLoading(true);

        try {
            const response = await fetchWithAuth('/login', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            
            // Fetch user data after successful login
            const userResponse = await fetchWithAuth('/me');
            const userData = await userResponse.json();
            setUser(userData);
            navigate('/');
        } catch (err) {
            setError(err.message);
            localStorage.removeItem('access_token'); // Clear token on error
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center fade-in mt-3 mb-3" style={{ minHeight: '80vh' }}>
            <div style={{
                maxWidth: '450px',
                width: '100%',
                padding: 'var(--spacing-2xl)',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: 'var(--radius-2xl)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--gray-200)'
            }}>
                {/* Header */}
                <div className="text-center mb-4">
                    <div style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: 'var(--primary-color)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-lg)',
                        color: 'white',
                        fontSize: '2rem',
                        fontWeight: 'bold'
                    }}>
                        <FontAwesomeIcon icon={faUser} />
                    </div>
                    <h1 style={{ 
                        color: 'var(--text-primary)', 
                        fontWeight: '700',
                        fontSize: '2rem',
                        marginBottom: 'var(--spacing-sm)'
                    }}>
                        Welcome Back!
                    </h1>
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '1.1rem',
                        marginBottom: 0
                    }}>
                        Sign in to your account to continue
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="alert alert-danger mb-4" style={{
                        borderRadius: 'var(--radius-lg)',
                        border: 'none',
                        backgroundColor: 'var(--danger-color)',
                        color: 'white',
                        padding: 'var(--spacing-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)'
                    }}>
                        <FontAwesomeIcon icon={faLock} />
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-4">
                        <Form.Label style={{
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--spacing-sm)'
                        }}>
                            Email Address
                        </Form.Label>
                        <div className="input-icon-wrapper">
                            <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                            <Form.Control 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="Enter your email"
                                isInvalid={!!formErrors.email}
                            />
                        </div>
                        {formErrors.email && (
                            <div style={{ color: 'var(--danger-color)', fontSize: '0.95rem', marginTop: 4 }}>
                                {formErrors.email}
                            </div>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label style={{
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--spacing-sm)'
                        }}>
                            Password
                        </Form.Label>
                        <div className="input-icon-wrapper">
                            <FontAwesomeIcon icon={faLock} className="input-icon" />
                            <Form.Control 
                                type="password" 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Enter your password"
                            />
                        </div>
                    </Form.Group>

                    <Button 
                        variant="primary" 
                        type="submit" 
                        className="w-100 mb-4"
                        disabled={loading || !!formErrors.email || !formData.email || !formData.password}
                        style={{
                            backgroundColor: 'var(--primary-color)',
                            border: 'none',
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-lg)',
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--spacing-sm)',
                            transition: 'all var(--transition-fast)'
                        }}
                    >
                        {loading ? (
                            <>
                                <div className="loading-spinner"></div>
                                Signing In...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faSignInAlt} />
                                Sign In
                            </>
                        )}
                    </Button>

                    <div className="text-center">
                        <p style={{ 
                            color: 'var(--text-secondary)', 
                            marginBottom: 0,
                            fontSize: '0.95rem'
                        }}>
                            Don't have an account?{' '}
                            <a 
                                href="/signup" 
                                style={{
                                    color: 'var(--primary-color)',
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    transition: 'all var(--transition-fast)'
                                }}
                                onMouseEnter={(e) => e.target.style.color = 'var(--primary-dark)'}
                                onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}
                            >
                                Sign up
                            </a>
                        </p>
                    </div>
                </Form>
            </div>
        </Container>
    );
}

export default LoginPage;