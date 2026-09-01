import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Admin panel now lives in Settings page (password protected)
export default function AdminPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/settings', { replace: true });
  }, []);
  return null;
}
