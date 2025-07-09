import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUserPlus, faIdCard, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

function SignupPage() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);

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
        if (name === 'password') {
            if (!validatePassword(value)) {
                setFormErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters long and contain at least one letter and one number.' }));
            } else {
                setFormErrors(prev => ({ ...prev, password: '' }));
            }
        }
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePassword = (password) => {
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(formData.email)) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!validatePassword(formData.password)) {
            setError('Password must be at least 8 characters long and contain at least one letter and one number.');
            return;
        }
        setLoading(true);

        try {
            const response = await fetchWithAuth('/signup', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Signup failed');
            }

            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            
            // Fetch user data after successful signup
            const userResponse = await fetchWithAuth('/me');
            
            if (!userResponse.ok) {
                throw new Error('Failed to fetch user data');
            }
            
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
                maxWidth: '500px',
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
                        backgroundColor: 'var(--secondary-color)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-lg)',
                        color: 'white',
                        fontSize: '2rem',
                        fontWeight: 'bold'
                    }}>
                        <FontAwesomeIcon icon={faUserPlus} />
                    </div>
                    <h1 style={{ 
                        color: 'var(--text-primary)', 
                        fontWeight: '700',
                        fontSize: '2rem',
                        marginBottom: 'var(--spacing-sm)'
                    }}>
                        Join SubSense!
                    </h1>
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '1.1rem',
                        marginBottom: 0
                    }}>
                        Create your account to start managing subscriptions
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

                {/* Signup Form */}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-4">
                        <Form.Label style={{
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--spacing-sm)'
                        }}>
                            Full Name
                        </Form.Label>
                        <div className="input-icon-wrapper">
                            <FontAwesomeIcon icon={faIdCard} className="input-icon" />
                            <Form.Control 
                                type="text" 
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter your full name"
                            />
                        </div>
                    </Form.Group>

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
                            <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                                {formErrors.email}
                            </Form.Control.Feedback>
                        )}
                        <Form.Text style={{ 
                            color: 'var(--text-tertiary)', 
                            fontSize: '0.875rem',
                            marginTop: 'var(--spacing-sm)'
                        }}>
                            We'll never share your email with anyone else.
                        </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label style={{
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--spacing-sm)'
                        }}>
                            Password
                        </Form.Label>
                        <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                            <span
                                onClick={() => setShowPassword((prev) => !prev)}
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    cursor: 'pointer',
                                    color: 'var(--text-tertiary)',
                                    zIndex: 2
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </span>
                            <Form.Control 
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Create a strong password"
                                isInvalid={!!formErrors.password}
                            />
                            
                        </div>
                        {formErrors.password && (
                            <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                                {formErrors.password}
                            </Form.Control.Feedback>
                        )}
                    </Form.Group>

                    <Button 
                        variant="primary" 
                        type="submit" 
                        className="w-100 mb-4"
                        disabled={loading || !!formErrors.email || !!formErrors.password || !formData.email || !formData.password || !formData.name}
                        style={{
                            backgroundColor: 'var(--secondary-color)',
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
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faUserPlus} />
                                Create Account
                            </>
                        )}
                    </Button>

                    <div className="text-center">
                        <p style={{ 
                            color: 'var(--text-secondary)', 
                            marginBottom: 0,
                            fontSize: '0.95rem'
                        }}>
                            Already have an account?{' '}
                            <a 
                                href="/login" 
                                style={{
                                    color: 'var(--secondary-color)',
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    transition: 'all var(--transition-fast)'
                                }}
                                onMouseEnter={(e) => e.target.style.color = 'var(--success-color)'}
                                onMouseLeave={(e) => e.target.style.color = 'var(--secondary-color)'}
                            >
                                Log in
                            </a>
                        </p>
                    </div>
                </Form>
            </div>
        </Container>
    );
}

export default SignupPage;