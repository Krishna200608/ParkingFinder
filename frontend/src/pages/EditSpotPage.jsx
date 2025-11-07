import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Input from '../components/form/Input';
import Button from '../components/form/Button';
import FormContainer from '../components/form/FormContainer';

// This page will be pre-filled with spot data and will call
// the PUT /api/spots/:id endpoint
const EditSpotPage = () => {
  const { id } = useParams(); // Get spot ID from URL
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // 1. Fetch the existing spot data to pre-fill the form
  useEffect(() => {
    const fetchSpot = async () => {
      try {
        const { data } = await axios.get(`/api/spots/${id}`);
        setAddress(data.address);
        setDescription(data.description);
        setPricePerHour(data.pricePerHour);
        setLatitude(data.location.coordinates[1]); // Note: Lat is index 1
        setLongitude(data.location.coordinates[0]); // Note: Lng is index 0
        setIsDataLoading(false);
      } catch (error) {
        toast.error('Could not find spot data.');
        navigate('/host/dashboard');
      }
    };
    fetchSpot();
  }, [id, navigate]);

  // 2. Handle the form submission to update the spot
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.put(
        `/api/spots/${id}`,
        {
          address,
          description,
          pricePerHour: Number(pricePerHour),
          location: {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)],
          },
        },
        config
      );

      toast.success('Spot updated successfully!');
      navigate('/host/dashboard'); // Go back to dashboard
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update spot.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isDataLoading) {
    return <p>Loading spot data...</p>;
  }

  return (
    <section className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-semibold mb-6 text-gray-700">Edit Your Spot</h2>
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
          label="Description"
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
            step="any"
            required
          />
          <Input
            label="Longitude"
            type="number"
            id="longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            step="any"
            required
          />
        </div>

        <Button type="submit" isLoading={isLoading} className="mt-6">
          {isLoading ? 'Updating Spot...' : 'Update Spot'}
        </Button>
      </FormContainer>
    </section>
  );
};

export default EditSpotPage;