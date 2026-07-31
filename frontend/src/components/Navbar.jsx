import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.clear();
    navigate('/login');
  };

  const styles = {
    nav: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      padding: '16px 24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontFamily: 'sans-serif',
    },
    brand: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 'bold',
      fontSize: '18px',
      textDecoration: 'none',
      color: '#ffffff',
    },
    diamond: {
      color: '#fbbf24',
    },
    linksContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
    },
    link: {
      color: '#ffffff',
      textDecoration: 'none',
      fontSize: '15px',
      fontWeight: '500',
    },
    badge: {
      backgroundColor: '#fbbf24',
      color: '#0f172a',
      fontSize: '12px',
      fontWeight: 'bold',
      padding: '4px 8px',
      borderRadius: '4px',
    },
    logoutBtn: {
      background: 'transparent',
      border: 'none',
      color: '#f87171',
      fontSize: '15px',
      fontWeight: '500',
      cursor: 'pointer',
    }
  };

  return (
    <nav style={styles.nav}>
      <Link to="/admin" style={styles.brand}>
        <span style={styles.diamond}>♦</span>
        <span>Smart Campus Complaint Desk</span>
      </Link>

      <div style={styles.linksContainer}>
        <Link to="/admin" style={styles.link}>Dashboard</Link>
        <Link to="/new-complaint" style={styles.link}>New Complaint</Link>
        
        <span style={styles.badge}>ADMIN</span>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          Log out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;