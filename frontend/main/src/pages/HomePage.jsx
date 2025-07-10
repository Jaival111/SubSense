import { useAuth } from '../context/AuthContext';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../utils/api';
import SpotifySubscriptionModal from '../components/SpotifySubscriptionModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faUnlink } from '@fortawesome/free-solid-svg-icons';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';
import { faRocket } from '@fortawesome/free-solid-svg-icons';

const gradientStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  zIndex: -1,
  background: 'linear-gradient(-45deg, #1DB954, #1e3c72, #2a5298, #f5f7fa)',
  backgroundSize: '400% 400%',
  animation: 'gradientBG 15s ease infinite',
};

function HomePage() {
  const { user, setUser } = useAuth();
  const [spotifyProfile, setSpotifyProfile] = useState(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasCheckedPendingSubscription = useRef(false);
  const hasFetchedSpotifyProfile = useRef(false);

  const fetchSpotifyData = async () => {
    setLoading(true);
    try {
      const statusRes = await fetchWithAuth('/api/spotify/status');
      const status = await statusRes.json();

      if (status.connected) {
        const profileRes = await fetchWithAuth('/api/spotify/profile');
        const profileData = await profileRes.json();
        setSpotifyProfile(profileData);
      } else {
        setSpotifyProfile(null);
      }
    } catch (err) {
      setError(err.message);
      setSpotifyProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !hasFetchedSpotifyProfile.current) {
      hasFetchedSpotifyProfile.current = true;
      fetchSpotifyData();
    }
  }, [user]);

  useEffect(() => {
    const handleSpotifyAuth = async (event) => {
      if (event.data.type === 'spotify-auth-success') {
        localStorage.setItem('access_token', event.data.token);

        try {
          const userResponse = await fetchWithAuth('/me');
          const userData = await userResponse.json();
          setUser(userData);
        } catch (err) {
          setError(err.message);
        }
      }
    };

    const checkPendingSubscription = async () => {
      if (
        !hasCheckedPendingSubscription.current &&
        localStorage.getItem('pending_spotify_subscription')
      ) {
        hasCheckedPendingSubscription.current = true;

        try {
          const response = await fetchWithAuth('/api/spotify/connect-with-subscription', {
            method: 'POST',
            body: localStorage.getItem('pending_spotify_subscription'),
          });

          if (response.ok) {
            localStorage.removeItem('pending_spotify_subscription');
          }
        } catch (err) {
          setError(err.message);
          localStorage.removeItem('pending_spotify_subscription');
        }
      }
    };

    checkPendingSubscription();

    window.addEventListener('message', handleSpotifyAuth);

    return () => window.removeEventListener('message', handleSpotifyAuth);
  }, [setUser]);

  const handleLogin = () => {
    setShowModal(true);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await fetchWithAuth('/api/spotify/disconnect', {
        method: 'POST'
      });
      setSpotifyProfile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        {/* Animated Gradient Background */}
        <div style={gradientStyle}></div>
        {/* Main Content */}
        <Container className="d-flex justify-content-center align-items-center fade-in" style={{ minHeight: '80vh' }}>
          <Card className="welcome-card text-center" style={{
            maxWidth: '500px',
            padding: 'var(--spacing-3xl)',
            border: 'none',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-xl)',
            background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--gray-50) 100%)'
          }}>
            <Card.Body>
              <img src="/logo-home.png" alt="SubSense" style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--spacing-xl)',
              }} />
              <h1 className="mb-3" style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
                Welcome to <span style={{ color: 'var(--primary-dark)' }}>SubSense</span>
              </h1>
              <p className="lead mb-4" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                Your intelligent subscription management platform - Where you can save money effortlessly by simply linking your apps. Based on your usage, we’ll suggest whether a subscription is really worth keeping
              </p>
              <Button
                href="/login"
                variant="primary"
                size="lg"
                style={{
                  backgroundColor: 'var(--primary-color)',
                  border: 'none',
                  padding: 'var(--spacing-md) var(--spacing-2xl)',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: '600',
                  fontSize: '1.1rem'
                }}
              >
                Get Started
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      {/* Animated Gradient Background */}
      <div style={gradientStyle}></div>
      {/* Main Content */}
      <Container className="py-5 fade-in">
        {/* Welcome Section */}
        <Row className="mb-5">
          <Col>
            <div style={{
              background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--secondary-color) 100%)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--spacing-3xl)',
              color: 'white',
              textAlign: 'center'
            }}>
              <h1 className="mb-3" style={{ fontWeight: '700', color: 'white' }}>
                Welcome back, {user.name}!👋
              </h1>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: 0, color: 'white' }}>
                Manage your subscriptions and track your spending with ease
              </p>
            </div>
          </Col>
        </Row>

        {/* Spotify Connection Card */}
        <Row className="mb-5">
          <Col>
            <Card className="spotify-card" style={{
              background: 'linear-gradient(135deg, var(--bg-primary) 0%, #1DB954 100%)',
              border: 'none',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden'
            }}>
              <Card.Body style={{ padding: 'var(--spacing-3xl)' }}>

                {error && (
                  <div className="alert alert-danger" style={{
                    borderRadius: 'var(--radius-lg)',
                    border: 'none',
                    backgroundColor: 'var(--danger-color)',
                    color: 'white'
                  }}>
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-5">
                    <div className="loading-spinner" style={{ margin: '0 auto var(--spacing-md)' }}></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
                  </div>
                ) : !spotifyProfile ? (
                  <div className="spotify-flex-col d-flex flex-column flex-md-row align-items-center justify-content-between">
                    <div className='d-flex flex-column flex-md-row align-items-center mb-3 mb-md-0'>
                      <div>
                        <FontAwesomeIcon icon={faSpotify} style={{ color: '#1DB954', fontSize: '4rem', margin: '1rem'
                         }} />
                      </div>
                      <div className='text-center text-md-start'>
                        <Card.Title style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                          Connect Your Spotify Account
                        </Card.Title>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                          Link your Spotify account to manage your subscription and track your listening activity
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="dark"
                      onClick={handleLogin}
                      size="lg"
                      style={{
                        backgroundColor: '#1DB954',
                        border: 'none',
                        padding: 'var(--spacing-md) var(--spacing-2xl)',
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: '600',
                        fontSize: '1.1rem'
                      }}
                      className="mt-3"
                    >
                      <FontAwesomeIcon icon={faLink} className="me-2" />
                      Connect to Spotify
                    </Button>
                  </div>
                ) : (
                  <div className="spotify-flex-col d-flex flex-column flex-md-row align-items-center justify-content-between">
                    <div className='d-flex align-items-center justify-content-center mb-3 mb-md-0'>
                      <div>
                        <FontAwesomeIcon icon={faSpotify} style={{ color: '#1DB954', fontSize: '4rem', margin: '1rem'
                         }} />
                      </div>
                      <h3 style={{ fontWeight: '600', margin: '1rem 0' }}>
                        {spotifyProfile.display_name}
                      </h3>
                    </div>

                    <Button
                      variant="outline-danger"
                      onClick={handleDisconnect}
                      disabled={loading}
                      style={{
                        borderColor: 'var(--danger-color)',
                        color: 'var(--danger-color)',
                        padding: 'var(--spacing-sm) var(--spacing-xl)',
                        borderRadius: 'var(--radius-lg)',
                        fontWeight: '500'
                      }}
                      className="mt-3"
                    >
                      <FontAwesomeIcon icon={faUnlink} className="me-2" />
                      {loading ? 'Disconnecting...' : 'Disconnect Spotify'}
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Coming Soon Section */}
        <Row className="mb-5">
          <Col>
            <div className="d-flex justify-content-center">
              <Card className="text-center shadow-lg border-0" style={{
                borderRadius: 'var(--radius-xl)',
                background: 'rgba(255,255,255,0.85)',
                maxWidth: 420,
                width: '100%',
                padding: '2rem 1.5rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  animation: 'pulseGlow 2s infinite'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1DB954 0%, #2a5298 100%)',
                    boxShadow: '0 0 24px 0 #1DB95444',
                    marginBottom: 16
                  }}>
                    <FontAwesomeIcon icon={faRocket} style={{ color: 'white', fontSize: 32 }} />
                  </span>
                </div>
                <Card.Title style={{ fontWeight: 700, fontSize: '1.7rem', color: 'var(--primary-dark)' }}>
                  🚀 Coming Soon
                </Card.Title>
                <Card.Text style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '1rem 0' }}>
                  We're working hard to bring you new features and improvements.<br />
                  Exciting updates are on the way to help you manage your subscriptions even better!
                </Card.Text>
                <div style={{ marginTop: 16 }}>
                  <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                    Stay tuned!
                  </span>
                </div>
              </Card>
            </div>
          </Col>
        </Row>

        <SpotifySubscriptionModal
          show={showModal}
          onHide={() => setShowModal(false)}
        />
      </Container>
    </>
  );
}

export default HomePage;

// Add the keyframes to a style tag at the top level (for global CSS)
if (typeof document !== 'undefined' && !document.getElementById('gradientBG-keyframes')) {
  const style = document.createElement('style');
  style.id = 'gradientBG-keyframes';
  style.innerHTML = `@keyframes gradientBG {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }`;
  document.head.appendChild(style);
}

// Add the keyframes for the pulseGlow animation
if (typeof document !== 'undefined' && !document.getElementById('pulseGlow-keyframes')) {
  const style = document.createElement('style');
  style.id = 'pulseGlow-keyframes';
  style.innerHTML = `@keyframes pulseGlow {
    0% { box-shadow: 0 0 24px 0 #1DB95444, 0 0 0 0 #1DB95433; }
    70% { box-shadow: 0 0 32px 8px #1DB95433, 0 0 0 0 #1DB95422; }
    100% { box-shadow: 0 0 24px 0 #1DB95444, 0 0 0 0 #1DB95433; }
  }`;
  document.head.appendChild(style);
}
