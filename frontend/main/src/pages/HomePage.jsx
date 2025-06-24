import { useAuth } from '../context/AuthContext';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useState, useEffect } from 'react';
import { API_BASE_URL, fetchWithAuth } from '../utils/api';

function HomePage() {
  const { user, setUser } = useAuth();
  const [spotifyProfile, setSpotifyProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSpotifyProfile = async () => {
      try {
        const response = await fetchWithAuth('/api/spotify/profile');
        const data = await response.json();
        setSpotifyProfile(data);
      } catch (err) {
        setError(err.message);
      }
    };

    const checkStatus = async () => {
      const res = await fetchWithAuth('/api/spotify/status');
      const status = await res.json();
      if (status.connected) {
        fetchSpotifyProfile();
      } else {
        setSpotifyProfile(null);
      }
    };

    if (user) {
      checkStatus();
    }
  }, [user]);

  useEffect(() => {
    const handleSpotifyAuth = (event) => {
      if (event.data.type === 'spotify-auth-success') {
        localStorage.setItem('access_token', event.data.token);
        // Fetch user data after successful login
        fetchWithAuth('/me')
          .then(response => response.json())
          .then(userData => {
            setUser(userData);
          })
          .catch(err => {
            setError(err.message);
          });
      }
    };

    window.addEventListener('message', handleSpotifyAuth);
    return () => window.removeEventListener('message', handleSpotifyAuth);
  }, [setUser]);

  const handleLogin = () => {
    const jwtToken = localStorage.getItem("access_token");
    window.location.href = `${API_BASE_URL}/api/spotify/login?token=${jwtToken}`;
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
        <Col md={6}>
          <Card className="shadow-sm h-100">
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
                    onClick={async () => {
                      try {
                        await fetchWithAuth('/api/spotify/disconnect', {
                          method: 'POST'
                        });
                        setSpotifyProfile(null);
                      } catch (err) {
                        setError(err.message);
                      }
                    }}
                  >
                    Disconnect Spotify
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Your Subscriptions</Card.Title>
              <div className="text-center py-4">
                <p className="text-muted">No active subscriptions yet</p>
                <Button variant="outline-dark">Add Subscription</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default HomePage;
