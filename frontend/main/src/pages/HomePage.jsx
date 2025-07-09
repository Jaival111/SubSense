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
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'var(--primary-color)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--spacing-xl)',
              color: 'white',
              fontSize: '2rem',
              fontWeight: 'bold'
            }}>
              S
            </div>
            <h1 className="mb-3" style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
              Welcome to SubSense
            </h1>
            <p className="lead mb-4" style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Your intelligent subscription management platform
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
    );
  }

  return (
    <Container className="py-5 fade-in">
      {/* Welcome Section */}
      <Row className="mb-5">
        <Col>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--spacing-3xl)',
            color: 'white',
            textAlign: 'center'
          }}>
            <h1 className="mb-3" style={{ fontWeight: '700' }}>
              Welcome back, {user.name}! 👋
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
                <div className='d-flex align-items-center justify-content-between'>
                  <div className='d-flex align-items-center'>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#1DB954',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 'var(--spacing-md)'
                    }}>
                      <FontAwesomeIcon icon={faSpotify} style={{ color: 'white', fontSize: '1.5rem' }} />
                    </div>
                    <div>
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
                  >
                    <FontAwesomeIcon icon={faLink} className="me-2" />
                    Connect to Spotify
                  </Button>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-between">
                  <div className='d-flex align-items-center justify-content-center'>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#1DB954',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 'var(--spacing-md)'
                    }}>
                      <FontAwesomeIcon icon={faSpotify} style={{ color: 'white', fontSize: '1.5rem' }} />
                    </div>

                    <h3 className="mb-2" style={{ fontWeight: '600' }}>
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

      <SpotifySubscriptionModal
        show={showModal}
        onHide={() => setShowModal(false)}
      />
    </Container>
  );
}

export default HomePage;
