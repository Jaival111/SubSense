import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { API_BASE_URL } from '../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDollarSign, 
  faCalendarAlt, 
  faCreditCard,
  faTimes,
  faLink
} from '@fortawesome/free-solid-svg-icons';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const SpotifySubscriptionModal = ({ show, onHide }) => {
  const [formData, setFormData] = useState({
    subscription_type: 'monthly',
    subscription_price: '',
    start_date: '',
    renewal_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Store subscription data in localStorage
      const subscriptionData = {
        app_name: 'Spotify',
        cost: parseFloat(formData.subscription_price),
        billing_cycle: formData.subscription_type,
        start_date: formData.start_date,
        next_billing_date: formData.renewal_date
      };
      localStorage.setItem('pending_spotify_subscription', JSON.stringify(subscriptionData));

      // Redirect to Spotify login
      const jwtToken = localStorage.getItem("access_token");
      window.location.href = `${API_BASE_URL}/api/spotify/login?token=${jwtToken}`;
    } catch (err) {
      setError(err.message || 'Failed to process subscription data');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      subscription_type: 'monthly',
      subscription_price: '',
      start_date: '',
      renewal_date: ''
    });
    setError('');
    onHide();
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      centered
      size="lg"
      style={{
        backdropFilter: 'blur(5px)'
      }}
    >
      <Modal.Header 
        closeButton 
        style={{
          borderBottom: '1px solid var(--gray-200)',
          padding: 'var(--spacing-xl)',
          backgroundColor: 'var(--bg-primary)'
        }}
      >
        <div className="d-flex align-items-center">
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
            <Modal.Title style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Connect Spotify & Add Subscription
            </Modal.Title>
            <p style={{ 
              margin: 'var(--spacing-xs) 0 0 0', 
              color: 'var(--text-secondary)',
              fontSize: '0.95rem'
            }}>
              Link your account and set up subscription tracking
            </p>
          </div>
        </div>
      </Modal.Header>
      
      <Modal.Body style={{ padding: 'var(--spacing-xl)' }}>
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
            <FontAwesomeIcon icon={faTimes} />
            {error}
          </div>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label style={{
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)'
                }}>
                  <FontAwesomeIcon icon={faCreditCard} style={{ color: 'var(--primary-color)' }} />
                  Subscription Type
                </Form.Label>
                <Form.Select
                  name="subscription_type"
                  value={formData.subscription_type}
                  onChange={handleChange}
                  required
                  style={{
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid var(--gray-200)',
                    fontSize: '1rem',
                    transition: 'all var(--transition-fast)',
                    backgroundColor: 'var(--bg-primary)'
                  }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label style={{
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)'
                }}>
                  <FontAwesomeIcon icon={faDollarSign} style={{ color: 'var(--success-color)' }} />
                  Subscription Price ($)
                </Form.Label>
                <div className="input-icon-wrapper">
                  <FontAwesomeIcon icon={faDollarSign} className="input-icon" />
                  <Form.Control
                    type="number"
                    name="subscription_price"
                    value={formData.subscription_price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label style={{
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)'
                }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ color: 'var(--accent-color)' }} />
                  Start Date
                </Form.Label>
                <div className="input-icon-wrapper">
                  <FontAwesomeIcon icon={faCalendarAlt} className="input-icon" />
                  <Form.Control
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label style={{
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)'
                }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ color: 'var(--primary-color)' }} />
                  Next Billing Date
                </Form.Label>
                <div className="input-icon-wrapper">
                  <FontAwesomeIcon icon={faCalendarAlt} className="input-icon" />
                  <Form.Control
                    type="date"
                    name="renewal_date"
                    value={formData.renewal_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-3 mt-4">
            <Button 
              variant="outline-secondary" 
              onClick={handleClose}
              style={{
                borderColor: 'var(--gray-300)',
                color: 'var(--text-secondary)',
                padding: 'var(--spacing-md) var(--spacing-xl)',
                borderRadius: 'var(--radius-lg)',
                fontWeight: '500',
                transition: 'all var(--transition-fast)'
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
              style={{
                backgroundColor: '#1DB954',
                border: 'none',
                padding: 'var(--spacing-md) var(--spacing-xl)',
                borderRadius: 'var(--radius-lg)',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faLink} />
                  Connect & Add Subscription
                </>
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default SpotifySubscriptionModal; 