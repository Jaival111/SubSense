import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSignInAlt, faUser, faArrowLeft, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

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
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter new password
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');
    const [resetPassword, setResetPassword] = useState('');
    const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    // Add state for validation errors
    const [forgotEmailError, setForgotEmailError] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState('');
    const [forgotPasswordConfirmError, setForgotPasswordConfirmError] = useState('');

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

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotError('');
        setForgotSuccess('');
        if (!validateEmail(forgotEmail)) {
            setForgotEmailError('Please enter a valid email address.');
            return;
        }
        setResetLoading(true);
        try {
            // Call backend to check if user exists
            const response = await fetchWithAuth('/validate-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'User not found.');
            }
            setForgotStep(2);
        } catch (err) {
            setForgotError(err.message);
        } finally {
            setResetLoading(false);
        }
    };

    const validatePassword = (password) => {
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setForgotError('');
        setForgotSuccess('');
        if (!resetPassword || !validatePassword(resetPassword)) {
            setForgotPasswordError('Password must be at least 8 characters long and contain at least one letter and one number.');
            return;
        }
        if (resetPassword !== resetPasswordConfirm) {
            setForgotPasswordConfirmError('Passwords do not match.');
            return;
        }
        setResetLoading(true);
        try {
            // Call backend to reset password
            const response = await fetchWithAuth('/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, new_password: resetPassword })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to reset password.');
            }
            setForgotSuccess('Password reset successful! You can now log in.');
            setTimeout(() => {
                setShowForgotPassword(false);
                setForgotStep(1);
                setForgotEmail('');
                setResetPassword('');
                setResetPasswordConfirm('');
                setForgotError('');
                setForgotSuccess('');
            }, 2000);
        } catch (err) {
            setForgotError(err.message);
        } finally {
            setResetLoading(false);
        }
    };

    const handleForgotEmailChange = (e) => {
        setForgotEmail(e.target.value);
        if (!validateEmail(e.target.value)) {
            setForgotEmailError('Please enter a valid email address.');
        } else {
            setForgotEmailError('');
        }
    };

    const handleResetPasswordChange = (e) => {
        setResetPassword(e.target.value);
        if (!validatePassword(e.target.value)) {
            setForgotPasswordError('Password must be at least 8 characters long and contain at least one letter and one number.');
        } else {
            setForgotPasswordError('');
        }
        // Also check confirm password
        if (resetPasswordConfirm && e.target.value !== resetPasswordConfirm) {
            setForgotPasswordConfirmError('Passwords do not match.');
        } else {
            setForgotPasswordConfirmError('');
        }
    };

    const handleResetPasswordConfirmChange = (e) => {
        setResetPasswordConfirm(e.target.value);
        if (resetPassword !== e.target.value) {
            setForgotPasswordConfirmError('Passwords do not match.');
        } else {
            setForgotPasswordConfirmError('');
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center fade-in mt-3 mb-3" style={{ position: 'relative', minHeight: '80vh', zIndex: 1 }}>
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
                        {showForgotPassword ? 'Forgot Password' : 'Welcome Back!'}
                    </h1>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '1.1rem',
                        marginBottom: 0
                    }}>
                        {showForgotPassword ? 'Enter your email to reset your password.' : 'Sign in to your account to continue'}
                    </p>
                </div>

                {/* Error/Success Alert for Forgot Password */}
                {showForgotPassword && (forgotError || forgotSuccess) && (
                    <div className={`alert ${forgotError ? 'alert-danger' : 'alert-success'} mb-4`} style={{
                        borderRadius: 'var(--radius-lg)',
                        border: 'none',
                        backgroundColor: forgotError ? 'var(--danger-color)' : 'var(--success-color)',
                        color: 'white',
                        padding: 'var(--spacing-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)'
                    }}>
                        <FontAwesomeIcon icon={forgotError ? faLock : faEnvelope} />
                        {forgotError || forgotSuccess}
                    </div>
                )}

                {/* Forgot Password Flow */}
                {showForgotPassword ? (
                    <Form onSubmit={forgotStep === 1 ? handleForgotPassword : handleResetPassword}>
                        {forgotStep === 1 && (
                            <Form.Group className="mb-4">
                                <Form.Label style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
                                    Email Address
                                </Form.Label>
                                <div className="input-icon-wrapper">
                                    <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                                    <Form.Control
                                        type="email"
                                        name="forgotEmail"
                                        value={forgotEmail}
                                        onChange={handleForgotEmailChange}
                                        required
                                        placeholder="Enter your email"
                                        disabled={resetLoading}
                                        isInvalid={!!forgotEmailError}
                                    />
                                </div>
                                {forgotEmailError && (
                                    <div style={{ color: 'var(--danger-color)', fontSize: '0.95rem', marginTop: 4 }}>
                                        {forgotEmailError}
                                    </div>
                                )}
                            </Form.Group>
                        )}
                        {forgotStep === 2 && (
                            <>
                                <Form.Group className="mb-4">
                                    <Form.Label style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
                                        New Password
                                    </Form.Label>
                                    <div className="input-icon-wrapper">
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
                                            type="password"
                                            name="resetPassword"
                                            value={resetPassword}
                                            onChange={handleResetPasswordChange}
                                            required
                                            placeholder="Enter new password"
                                            disabled={resetLoading}
                                            isInvalid={!!forgotPasswordError}
                                        />
                                    </div>
                                    {forgotPasswordError && (
                                        <div style={{ color: 'var(--danger-color)', fontSize: '0.95rem', marginTop: 4 }}>
                                            {forgotPasswordError}
                                        </div>
                                    )}
                                </Form.Group>
                                <Form.Group className="mb-4">
                                    <Form.Label style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
                                        Confirm New Password
                                    </Form.Label>
                                    <div className="input-icon-wrapper">
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
                                            type="password"
                                            name="resetPasswordConfirm"
                                            value={resetPasswordConfirm}
                                            onChange={handleResetPasswordConfirmChange}
                                            required
                                            placeholder="Confirm new password"
                                            disabled={resetLoading}
                                            isInvalid={!!forgotPasswordConfirmError}
                                        />
                                    </div>
                                    {forgotPasswordConfirmError && (
                                        <div style={{ color: 'var(--danger-color)', fontSize: '0.95rem', marginTop: 4 }}>
                                            {forgotPasswordConfirmError}
                                        </div>
                                    )}
                                </Form.Group>
                            </>
                        )}
                        <Button
                            variant="primary"
                            type="submit"
                            className="w-100 mb-4"
                            disabled={resetLoading || (forgotStep === 1 && !forgotEmail) || (forgotStep === 2 && (!resetPassword || !resetPasswordConfirm))}
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
                            {resetLoading ? (
                                <>
                                    <div className="loading-spinner"></div>
                                    {forgotStep === 1 ? 'Checking...' : 'Resetting...'}
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faEnvelope} />
                                    {forgotStep === 1 ? 'Check Email' : 'Reset Password'}
                                </>
                            )}
                        </Button>
                        <div className="text-center">
                            <a
                                href='/login'
                                style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none', padding: 0 }}
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setForgotStep(1);
                                    setForgotEmail('');
                                    setResetPassword('');
                                    setResetPasswordConfirm('');
                                    setForgotError('');
                                    setForgotSuccess('');
                                }}
                                onMouseEnter={(e) => e.target.style.color = 'var(--primary-dark)'}
                                onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}
                            >
                                <FontAwesomeIcon icon={faArrowLeft} /> Back to Login
                            </a>
                        </div>
                    </Form>
                ) : (
                    <>
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

                            <Form.Group className="mb-2">
                                <Form.Label style={{
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    marginBottom: 'var(--spacing-sm)'
                                }}>
                                    Password
                                </Form.Label>
                                <div className="input-icon-wrapper">
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
                                        placeholder="Enter your password"
                                    />
                                </div>
                            </Form.Group>
                            <div className="mb-4 text-end">
                                <a
                                    href="#"
                                    style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none', padding: 0, cursor: 'pointer' }}
                                    onClick={e => {
                                        e.preventDefault();
                                        setShowForgotPassword(true);
                                        setForgotStep(1);
                                        setForgotEmail('');
                                        setResetPassword('');
                                        setResetPasswordConfirm('');
                                        setForgotError('');
                                        setForgotSuccess('');
                                    }}
                                    onMouseEnter={(e) => e.target.style.color = 'var(--primary-dark)'}
                                    onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}
                                >
                                    Forgot Password?
                                </a>
                            </div>
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
                    </>
                )}
            </div>
        </Container>
    );
}

export default LoginPage;