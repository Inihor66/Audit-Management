import React, { useState } from 'react';
import * as storage from '../services/storageService';

const DevReset = () => {
  const [status, setStatus] = useState<'idle'|'done'>('idle');

  const handleClear = () => {
    if (!confirm('This will permanently delete all users, forms and admin notifications stored in your browser. Proceed?')) return;
    storage.clearAllData();
    setStatus('done');
  };

  return (
    <div className="page-center">
      <div className="auth-form-container">
        <div className="auth-form-card" style={{maxWidth: '36rem'}}>
          <h2 className="text-center">Developer: Reset App Data</h2>
          <p>This page clears all saved users, forms and admin notifications from localStorage and sessionStorage for this app (development only).</p>

          {status === 'idle' ? (
            <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
              <button onClick={handleClear} className="btn btn-danger">Clear all stored data</button>
            </div>
          ) : (
            <div>
              <p style={{color: 'var(--color-success)'}}>All stored data cleared. You may reload the app.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevReset;
