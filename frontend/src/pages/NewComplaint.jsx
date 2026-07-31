import React, { useState } from 'react';
import axios from 'axios';

const NewComplaint = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Hostel');
  const [priority, setPriority] = useState('Medium');
  const [location, setLocation] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !category) {
      setError('Title, description, and category are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const response = await axios.post('http://localhost:5000/api/complaints', {
        title,
        description,
        category,
        priority,
        location
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 201 || response.status === 200) {
        window.location.href = '/staff'; 
      }
    } catch (err) {
      console.error("Failed to submit complaint:", err);
      setError(err.response?.data?.error || 'Failed to submit complaint. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px', fontFamily: 'Inter, sans-serif', background: '#fdfbf7', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '650px', background: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f0eae1' }}>
        
        <div style={{ fontSize: '12px', color: '#8c7b65', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '4px' }}>
          FILE A NEW TICKET
        </div>
        <h1 style={{ fontSize: '26px', color: '#1a1a1a', marginBottom: '20px' }}>
          Submit a complaint
        </h1>

        {error && (
          <div style={{ background: '#fce8e6', color: '#c5221f', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', border: '1px solid #fad2cf' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Title</label>
            <input 
              type="text" 
              placeholder="e.g. Broken AC in Seminar Hall"
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dcd6cd', fontSize: '14px', outline: 'none', background: '#faf9f6' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Description</label>
            <textarea 
              rows="4"
              placeholder="Provide detailed information regarding the issue..."
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dcd6cd', fontSize: '14px', outline: 'none', background: '#faf9f6', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Category</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dcd6cd', fontSize: '14px', outline: 'none', background: '#faf9f6', cursor: 'pointer' }}
              >
                <option value="Hostel">Hostel</option>
                <option value="IT/WiFi">IT/WiFi</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Canteen">Canteen</option>
                <option value="Academics">Academics</option>
                <option value="Library">Library</option>
                <option value="Transport">Transport</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Priority</label>
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dcd6cd', fontSize: '14px', outline: 'none', background: '#faf9f6', cursor: 'pointer' }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>Location / Venue</label>
            <input 
              type="text" 
              placeholder="e.g. Old Block 2nd Floor"
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #dcd6cd', fontSize: '14px', outline: 'none', background: '#faf9f6' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: '#122031',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Submitting...' : 'Create complaint ticket'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default NewComplaint;
