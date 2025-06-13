import { useState } from 'react';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useEmailNotifications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to get auth token
  const getAuthToken = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    return userInfo?.token;
  };

  // Send purchase receipt email
  const sendPurchaseReceipt = async (orderId) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/email/purchase-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Purchase receipt sent successfully!');
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to send receipt');
      }
    } catch (error) {
      console.error('Error sending purchase receipt:', error);
      setError(error.message);
      toast.error('Failed to send receipt email');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Send delivery feedback email
  const sendDeliveryFeedback = async (orderId) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/email/delivery-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Delivery feedback email sent successfully!');
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to send delivery feedback');
      }
    } catch (error) {
      console.error('Error sending delivery feedback:', error);
      setError(error.message);
      toast.error('Failed to send delivery feedback email');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Send order status update email (admin only)
  const sendOrderStatusUpdate = async (orderId, status, message = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/api/email/order-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status, message }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Order status update email sent successfully!');
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to send status update');
      }
    } catch (error) {
      console.error('Error sending order status update:', error);
      setError(error.message);
      toast.error('Failed to send order status update email');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to newsletter
  const subscribeToNewsletter = async (email, firstName = '', lastName = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/email/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, firstName, lastName }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Successfully subscribed to newsletter!');
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      setError(error.message);
      toast.error('Failed to subscribe to newsletter');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Unsubscribe from newsletter
  const unsubscribeFromNewsletter = async (email) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/email/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Successfully unsubscribed from newsletter');
        return { success: true, data: result };
      } else {
        throw new Error(result.message || 'Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Error unsubscribing from newsletter:', error);
      setError(error.message);
      toast.error('Failed to unsubscribe from newsletter');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return {
    isLoading,
    error,
    sendPurchaseReceipt,
    sendDeliveryFeedback,
    sendOrderStatusUpdate,
    subscribeToNewsletter,
    unsubscribeFromNewsletter,
    clearError,
  };
}; 