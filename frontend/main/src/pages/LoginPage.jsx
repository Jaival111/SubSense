import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/Container';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/api'; 

function LoginPage() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

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
        }
    };

    const containerStyle = {
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
    }

    return (
        <Container className='mt-5 mb-5' style={containerStyle}>
            <h1 className='text-center'>Welcome Back!</h1>
            <h4 className='text-center mb-5'>Log in to continue.</h4>
            {error && <div className="alert alert-danger">{error}</div>}
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <Form.Text className="text-muted">
                        We'll never share your email with anyone else.
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control 
                        type="password" 
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>
                <Button variant="dark" type="submit" className="w-100">
                    Log In
                </Button>
                <p className="text-muted text-center mt-3">Don't have an account? <a href="/signup">Sign up</a></p>
            </Form>
        </Container>
    );
}

export default LoginPage;