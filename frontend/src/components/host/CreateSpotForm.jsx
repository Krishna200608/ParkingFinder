import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../form/Input';
import Button from '../form/Button';
import FormContainer from '../form/FormContainer';

// This form calls the POST /api/spots endpoint
const CreateSpotForm = () => {
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerHour, setPricePerHour] = useState(5);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { userInfo } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!userInfo || userInfo.role !== 'host') {
      toast.error('You must be a host to create a spot.');
      setIsLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.post(
        '/api/spots',
        {
          address,
          description,
          pricePerHour: Number(pricePerHour),
          // We send coordinates in the format our backend expects
          location: {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
          },
        },
        config
      );

      toast.success('Spot created successfully!');
      // Reset form
      setAddress('');
      setDescription('');
      setPricePerHour(5);
      setLatitude('');
      setLongitude('');
      // We would ideally also trigger a refresh of the 'MySpotsList' component
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create spot.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Input
        label="Address"
        type="text"
        id="address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
      />
      <Input
        label="Description (e.g., 'Private driveway')"
        type="text"
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <Input
        label="Price per Hour ($)"
        type="number"
        id="price"
        value={pricePerHour}
        onChange={(e) => setPricePerHour(e.target.value)}
        min="1"
        step="0.5"
        required
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Latitude"
          type="number"
          id="latitude"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="e.g., 40.7128"
          step="any"
          required
        />
        <Input
          label="Longitude"
          type="number"
          id="longitude"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="e.g., -74.0060"
          step="any"
          required
        />
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Tip: Use Google Maps to right-click on your spot and get the coordinates.
      </p>

      <Button type="submit" isLoading={isLoading} className="mt-6">
        {isLoading ? 'Creating Spot...' : 'Create Spot'}
      </Button>
    </FormContainer>
  );
};

export default CreateSpotForm;