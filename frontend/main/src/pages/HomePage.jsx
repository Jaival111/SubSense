import { useAuth } from '../context/AuthContext';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../utils/api';
import SpotifySubscriptionModal from '../components/SpotifySubscriptionModal';

function HomePage() {
  const { user, setUser } = useAuth();
  const [spotifyProfile, setSpotifyProfile] = useState(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const hasCheckedPendingSubscription = useRef(false);
  const hasFetchedSpotifyProfile = useRef(false);

  const fetchSpotifyData = async () => {
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
    try {
      await fetchWithAuth('/api/spotify/disconnect', {
        method: 'POST'
      });
      setSpotifyProfile(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Card className="text-center p-5 shadow">
          <Card.Body>
            <h1 className="mb-4">Welcome to SubSense</h1>
            <p className="lead">Please log in to access your dashboard.</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-4">Welcome, {user.name}!</h2>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Spotify Connection</Card.Title>
              {error && <div className="alert alert-danger">{error}</div>}
              {!spotifyProfile ? (
                <div className="text-center py-4">
                  <p className="mb-4">Connect your Spotify account to see your listening activity</p>
                  <Button variant="dark" onClick={handleLogin}>
                    Connect to Spotify
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  {spotifyProfile.images && spotifyProfile.images[0] && (
                    <img
                      src={spotifyProfile.images[0].url}
                      alt="Profile"
                      className="rounded-circle mb-3"
                      style={{ width: '150px', height: '150px' }}
                    />
                  )}
                  <h4>{spotifyProfile.display_name}</h4>
                  <p className="text-muted">{spotifyProfile.email}</p>
                  <p className="text-muted">Followers: {spotifyProfile.followers?.total || 0}</p>
                  <Button
                    variant="outline-danger"
                    className="mt-3"
                    onClick={handleDisconnect}
                  >
                    Disconnect Spotify
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
