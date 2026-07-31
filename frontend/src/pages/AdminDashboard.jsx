import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/complaints', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComplaints(response.data);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter(c => c.status?.toLowerCase() === 'pending').length;
  const resolvedCount = complaints.filter(c => c.status?.toLowerCase() === 'resolved').length;

  const filteredComplaints = statusFilter === 'All' 
    ? complaints 
    : complaints.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase());

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'sans-serif',
    },
    content: {
      padding: '32px 48px',
    },
    headerTitle: {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#64748b',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      marginBottom: '4px',
    },
    mainTitle: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#0f172a',
      marginBottom: '24px',
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
      marginBottom: '32px',
    },
    card: {
      backgroundColor: '#ffffff',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
    },
    cardTitle: {
      fontSize: '14px',
      color: '#64748b',
      marginBottom: '8px',
      fontWeight: '500',
    },
    cardValueTotal: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#0f172a',
    },
    cardValuePending: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#d97706',
    },
    cardValueResolved: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#16a34a',
    },
    filterContainer: {
      marginBottom: '24px',
    },
    select: {
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #cbd5e1',
      backgroundColor: '#ffffff',
      fontSize: '14px',
      color: '#334155',
      outline: 'none',
      cursor: 'pointer',
    },
    tableContainer: {
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
      fontSize: '14px',
    },
    th: {
      backgroundColor: '#f1f5f9',
      padding: '12px 16px',
      fontWeight: '600',
      color: '#475569',
      borderBottom: '1px solid #e2e8f0',
    },
    td: {
      padding: '12px 16px',
      borderBottom: '1px solid #e2e8f0',
      color: '#334155',
    },
    emptyState: {
      padding: '32px',
      textAlign: 'center',
      color: '#64748b',
      fontSize: '14px',
    }
  };

  return (
    <div style={styles.container}>
      {/* Navbar removed from here to prevent duplication */}
      
      <div style={styles.content}>
        <div style={styles.headerTitle}>Admin Desk</div>
        <h1 style={styles.mainTitle}>Campus-wide complaint overview</h1>

        {/* Metrics Overview Cards */}
        <div style={styles.metricsGrid}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Total Complaints</div>
            <div style={styles.cardValueTotal}>{totalComplaints}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Pending</div>
            <div style={styles.cardValuePending}>{pendingCount}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Resolved</div>
            <div style={styles.cardValueResolved}>{resolvedCount}</div>
          </div>
        </div>

        {/* Status Filter */}
        <div style={styles.filterContainer}>
          <select 
            style={styles.select} 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Complaints Data Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={styles.emptyState}>Loading complaints...</td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.emptyState}>No complaints found.</td>
                </tr>
              ) : (
                filteredComplaints.map((item, index) => (
                  <tr key={item.id || index}>
                    <td style={styles.td}>#{item.id ? item.id.slice(-6) : index + 1}</td>
                    <td style={styles.td}>{item.category || 'General'}</td>
                    <td style={styles.td}>{item.description || item.title || 'No description provided'}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: item.status?.toLowerCase() === 'resolved' ? '#dcfce7' : '#fef3c7',
                        color: item.status?.toLowerCase() === 'resolved' ? '#16a34a' : '#d97706',
                      }}>
                        {item.status || 'Pending'}
                      </span>
                    </td>
                    <td style={styles.td}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
