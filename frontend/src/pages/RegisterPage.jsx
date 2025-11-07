import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FormContainer from '../components/form/FormContainer';
import Input from '../components/form/Input';
import Button from '../components/form/Button';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('driver'); // <-- NEW ROLE STATE
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Call the API endpoint
      const { data } = await axios.post('/api/auth/register', {
        name,
        email,
        password,
        role, // <-- SEND ROLE TO BACKEND
      });

      // Log the user in
      login(data);
      toast.success('Registration successful!');
      
      // Redirect based on role
      if (data.role === 'host') {
        navigate('/host/dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer>
      <h1 className="text-3xl font-bold text-center mb-6">Create Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email Address"
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        
        {/* --- NEW ROLE SELECTOR --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700">I am a...</label>
          <div className="mt-2 flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`flex-1 py-2 px-4 rounded-l-md border
              ${role === 'driver' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Driver (I need parking)
            </button>
            <button
              type="button"
              onClick={() => setRole('host')}
              className={`flex-1 py-2 px-4 rounded-r-md border
              ${role === 'host' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Host (I have parking)
            </button>
          </div>
        </div>
        
        <Button type="submit" isLoading={isLoading} className="w-full">
          {isLoading ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </FormContainer>
  );
};

export default RegisterPage;