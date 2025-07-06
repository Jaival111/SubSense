import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser, faHome, faSignOutAlt, faCalendarAlt } from '@fortawesome/free-solid-svg-icons'
import { useState, useEffect } from 'react';

function NavComponent() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        const updateDate = () => {
            const now = new Date();
            const options = { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            };
            setCurrentDate(now.toLocaleDateString('en-US', options));
        };

        updateDate();
        const interval = setInterval(updateDate, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <Navbar 
            expand="lg" 
            className="navbar-modern shadow-sm" 
            style={{
                backgroundColor: 'var(--bg-primary)',
                borderBottom: '1px solid var(--gray-200)',
                padding: 'var(--spacing-md) 0'
            }}
        >
            <Container>
                <Navbar.Brand 
                    href="/" 
                    className="brand-logo"
                    style={{
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        color: 'var(--primary-color)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)'
                    }}
                >
                    <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: 'var(--primary-color)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                    }}>
                        S
                    </div>
                    SubSense
                </Navbar.Brand>
                
                <Navbar.Toggle 
                    aria-controls="basic-navbar-nav" 
                    style={{
                        border: 'none',
                        padding: 'var(--spacing-sm)',
                        borderRadius: 'var(--radius-md)'
                    }}
                />
                
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {!user && (
                            <Nav.Link 
                                href="/" 
                                className="nav-link-modern"
                                style={{
                                    color: 'var(--text-secondary)',
                                    fontWeight: '500',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    borderRadius: 'var(--radius-md)',
                                    transition: 'all var(--transition-fast)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)'
                                }}
                            >
                                <FontAwesomeIcon icon={faHome} />
                                Home
                            </Nav.Link>
                        )}
                    </Nav>
                    
                    <Nav className="nav-right">
                        {user ? (
                            <div className="d-flex align-items-center gap-3">
                                <div 
                                    className="date-display"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-sm)',
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        backgroundColor: 'var(--gray-100)',
                                        borderRadius: 'var(--radius-lg)',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.875rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                    {currentDate}
                                </div>
                                
                                <NavDropdown 
                                    title={
                                        <div className="user-profile"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-sm)',
                                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                                backgroundColor: 'var(--primary-color)',
                                                color: 'white',
                                                borderRadius: 'var(--radius-lg)',
                                                cursor: 'pointer',
                                                transition: 'all var(--transition-fast)',
                                                fontWeight: '500'
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faCircleUser} />
                                            <span>{user.name}</span>
                                        </div>
                                    } 
                                    id="basic-nav-dropdown"
                                    className="dropdown-modern"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <NavDropdown.Item 
                                        onClick={handleLogout}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-sm)',
                                            padding: 'var(--spacing-md)',
                                            color: 'var(--danger-color)',
                                            transition: 'all var(--transition-fast)'
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faSignOutAlt} />
                                        Logout
                                    </NavDropdown.Item>
                                </NavDropdown>
                            </div>
                        ) : (
                            <div className="d-flex align-items-center gap-3">
                                <div 
                                    className="date-display"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-sm)',
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        backgroundColor: 'var(--gray-100)',
                                        borderRadius: 'var(--radius-lg)',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.875rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                    {currentDate}
                                </div>
                                
                                <Nav.Link 
                                    href="/login"
                                    className="btn btn-primary"
                                    style={{
                                        backgroundColor: 'var(--primary-color)',
                                        color: 'white',
                                        padding: 'var(--spacing-sm) var(--spacing-lg)',
                                        borderRadius: 'var(--radius-lg)',
                                        fontWeight: '500',
                                        textDecoration: 'none',
                                        transition: 'all var(--transition-fast)'
                                    }}
                                >
                                    Login
                                </Nav.Link>
                            </div>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavComponent;