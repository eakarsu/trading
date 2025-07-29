import React, { useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import '../styles/pages/ProfilePage.css';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    preferences: {
      tradingStyle: 'day',
      riskTolerance: 'moderate',
      notifications: {
        email: true,
        sms: false
      }
    }
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        username: userData.username || '',
        email: userData.email || '',
        preferences: {
          tradingStyle: userData.preferences?.tradingStyle || 'day',
          riskTolerance: userData.preferences?.riskTolerance || 'moderate',
          notifications: {
            email: userData.preferences?.notifications?.email || true,
            sms: userData.preferences?.notifications?.sms || false
          }
        }
      });
    } catch (err) {
      setError('Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1];
      setFormData({
        ...formData,
        preferences: {
          ...formData.preferences,
          [prefKey]: value
        }
      });
    } else if (name.startsWith('notifications.')) {
      const notifKey = name.split('.')[1];
      setFormData({
        ...formData,
        preferences: {
          ...formData.preferences,
          notifications: {
            ...formData.preferences.notifications,
            [notifKey]: type === 'checkbox' ? checked : value
          }
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updatedUser = await authAPI.updateProfile(formData);
      setUser(updatedUser);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="profile-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="alert alert-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <h1>User Profile</h1>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <div className="profile-content">
          {!isEditing ? (
            <div className="profile-view">
              <div className="profile-card">
                <h2>Personal Information</h2>
                <div className="profile-field">
                  <label>Username:</label>
                  <span>{user?.username}</span>
                </div>
                <div className="profile-field">
                  <label>Name:</label>
                  <span>{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="profile-field">
                  <label>Email:</label>
                  <span>{user?.email}</span>
                </div>
                <div className="profile-field">
                  <label>Role:</label>
                  <span>{user?.role}</span>
                </div>
                <div className="profile-field">
                  <label>Member Since:</label>
                  <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
              
              <div className="profile-card">
                <h2>Preferences</h2>
                <div className="profile-field">
                  <label>Trading Style:</label>
                  <span>{user?.preferences?.tradingStyle || 'Not set'}</span>
                </div>
                <div className="profile-field">
                  <label>Risk Tolerance:</label>
                  <span>{user?.preferences?.riskTolerance || 'Not set'}</span>
                </div>
                <div className="profile-field">
                  <label>Email Notifications:</label>
                  <span>{user?.preferences?.notifications?.email ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="profile-field">
                  <label>SMS Notifications:</label>
                  <span>{user?.preferences?.notifications?.sms ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
              
              <button className="btn" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            </div>
          ) : (
            <div className="profile-edit">
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-section">
                  <h2>Personal Information</h2>
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="form-control"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="form-control"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="form-control"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-section">
                  <h2>Preferences</h2>
                  <div className="form-group">
                    <label htmlFor="tradingStyle">Trading Style</label>
                    <select
                      id="tradingStyle"
                      name="preferences.tradingStyle"
                      className="form-control"
                      value={formData.preferences.tradingStyle}
                      onChange={handleInputChange}
                    >
                      <option value="day">Day Trading</option>
                      <option value="swing">Swing Trading</option>
                      <option value="position">Position Trading</option>
                      <option value="investment">Investment</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="riskTolerance">Risk Tolerance</label>
                    <select
                      id="riskTolerance"
                      name="preferences.riskTolerance"
                      className="form-control"
                      value={formData.preferences.riskTolerance}
                      onChange={handleInputChange}
                    >
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="notifications.email"
                        checked={formData.preferences.notifications.email}
                        onChange={handleInputChange}
                      />
                      Email Notifications
                    </label>
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="notifications.sms"
                        checked={formData.preferences.notifications.sms}
                        onChange={handleInputChange}
                      />
                      SMS Notifications
                    </label>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
