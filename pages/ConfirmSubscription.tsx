import React, { useEffect, useState } from 'react';
import * as storage from '../services/storageService';
import { API_BASE_URL } from '../constants';

const ConfirmSubscription = () => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const firmId = params.get('firmId');
    const notificationId = params.get('notificationId');

    if (!firmId || !notificationId) {
      setStatus('error');
      setMessage('Missing required parameters.');
      return;
    }

    const doConfirm = async () => {
      setStatus('processing');
      try {
        // If there's a backend, call it to confirm the subscription (preferred)
        if (API_BASE_URL) {
          try {
            await fetch(`${API_BASE_URL}/admin/confirm`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notificationId, firmId }),
            });
          } catch (err) {
            // proceed to local fallback even if API call fails
            console.error('API confirm failed', err);
          }
        }

        // Local fallback: mark admin notification handled and activate user's subscription in localStorage
        const notifications = storage.getAdminNotifications();
        const notif = notifications.find(n => n.id === notificationId && n.firmId === firmId);
        if (notif) {
          notif.handled = true;
          storage.updateAdminNotification(notif);
        }

        const user = storage.getUserById(firmId);
        if (user) {
          user.subscription = {
            ...user.subscription,
            status: 'active',
            plan: user.subscription.plan || 'monthly',
            startDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
          };
          storage.updateUser(user);
        }

        setStatus('success');
        setMessage('Subscription confirmed. The user account has been activated (local fallback).');
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage('Failed to confirm subscription.');
      }
    };

    // Auto-run confirmation so clicking email link confirms immediately
    doConfirm();
  }, []);

  return (
    <div className="page-center">
      <div className="auth-form-container">
        <div className="auth-form-card" style={{maxWidth: '36rem'}}>
          <h2 className="text-center">Confirm Subscription</h2>
          {status === 'processing' && <p>Processing confirmation...</p>}
          {status === 'success' && <p style={{color: 'var(--color-success)'}}>{message}</p>}
          {status === 'error' && <p className="form-error">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default ConfirmSubscription;
