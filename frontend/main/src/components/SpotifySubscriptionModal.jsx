import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { API_BASE_URL } from '../utils/api';

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
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Connect Spotify & Add Subscription</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Subscription Type</Form.Label>
            <Form.Select
              name="subscription_type"
              value={formData.subscription_type}
              onChange={handleChange}
              required
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Subscription Price ($)</Form.Label>
            <Form.Control
              type="number"
              name="subscription_price"
              value={formData.subscription_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="Enter price"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Next Billing Date</Form.Label>
            <Form.Control
              type="date"
              name="renewal_date"
              value={formData.renewal_date}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="dark" type="submit" disabled={loading}>
              {loading ? 'Connecting...' : 'Connect & Add Subscription'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default SpotifySubscriptionModal; 