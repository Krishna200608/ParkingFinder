import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Import reusable components
import FormContainer from '../components/form/FormContainer';
import Input from '../components/form/Input';
import Button from '../components/form/Button';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { userInfo, login } = useAuth();

  // If user is already logged in, redirect them
  useEffect(() => {
    if (userInfo) {
      navigate('/dashboard'); // Redirect to a dashboard or home
    }
  }, [userInfo, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Our Vite proxy will redirect this to http://localhost:5001/api/auth/login
      const { data } = await axios.post('/api/auth/login', {
        email,
        password,
      });
      
      // Call the login function from our AuthContext
      login(data);
      
      toast.success('Login Successful!');
      navigate('/dashboard'); // Redirect to a protected page

    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer title="Sign In" onSubmit={submitHandler}>
      <Input
        id="email"
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
        required
      />
      <Input
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        required
      />
      <Button isLoading={isLoading}>Sign In</Button>
      
      <div className="text-sm text-center">
        New Customer?{' '}
        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
          Register here
        </Link>
      </div>
    </FormContainer>
  );
};

export default LoginPage;
