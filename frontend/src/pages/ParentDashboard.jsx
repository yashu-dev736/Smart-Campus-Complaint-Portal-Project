import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ParentDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [expandedId, setExpandedId] = useState(null);
  const [commentInput, setCommentInput] = useState('');

  const [counts, setCounts] = useState({
    assigned: 0,
    unassigned: 0,
    resolved: 0
  });

  // State for Raising a New Complaint
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General Inquiry');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch specifically from the parent-dedicated endpoint
      const response = await axios.get('http://localhost:5000/api/complaints/parent', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const parentComplaints = Array.isArray(response.data) 
        ? response.data 
        : (response.data.complaints || response.data.data || []);
        
      setComplaints(parentComplaints);

      const pendingCount = parentComplaints.filter(item => {
        const s = (item.status || 'Pending').toLowerCase();
        return s === 'pending' || s === 'open' || s === 'assigned';
      }).length;

      const resolvedCount = parentComplaints.filter(item => {
        const s = (item.status || '').toLowerCase();
        return s === 'resolved' || s === 'closed';
      }).length;
      
      setCounts({
        assigned: pendingCount,
        unassigned: 0,
        resolved: resolvedCount
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching parent queue:", err);
      setError("Failed to load your complaints. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, []);

  // Handle Submit New Complaint
  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      alert('Please fill in both the title and description.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

      const payload = {
        title: newTitle,
        category: newCategory,
        description: newDescription,
        raisedBy: 'parent',
        parentId: storedUser.id || storedUser._id || storedUser.userId,
        email: storedUser.email
      };

      await axios.post('http://localhost:5000/api/complaints', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Clear form inputs
      setNewTitle('');
      setNewCategory('General Inquiry');
      setNewDescription('');

      // Refresh the list immediately
      await fetchParentData();
      setSubmitting(false);
    } catch (err) {
      console.error("Error submitting complaint:", err);
      alert('Failed to submit complaint. Please check your network or backend route.');
      setSubmitting(false);
    }
  };

  // Filter complaints based on status dropdown selection
  const filteredComplaints = Array.isArray(complaints) ? complaints.filter(item => {
    const currentStatus = item.status || 'Pending';
    if (statusFilter === 'All') return true;
    return currentStatus.toLowerCase() === statusFilter.toLowerCase();
  }) : [];

  const getBadgeStyle = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'resolved' || s === 'closed') {
      return { bg: '#e6f4ea', color: '#137333', border: '#ceead6' };
    } else if (s === 'rejected') {
      return { bg: '#fce8e6', color: '#c5221f', border: '#fad2cf' };
    } else {
      return { bg: '#fef7e0', color: '#b06000', border: '#fef1c7' };
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return { time: '10:00 AM', date: '24', month: 'Jul 2026' };
    const dateObj = new Date(timestamp);
    return {
      time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: dateObj.getDate(),
      month: dateObj.toLocaleDateString([], { month: 'short', year: 'numeric' })
    };
  };

  const handleAddComment = (id, e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    
    setComplaints(prev => prev.map(item => {
      if ((item.id || item._id) === id) {
        const existingComments = item.comments || [];
        return {
          ...item,
          comments: [...existingComments, { text: commentInput, sender: 'Parent', timestamp: new Date().toISOString() }]
        };
      }
      return item;
    }));
    setCommentInput('');
  };

  return (
    <div style={{ padding: '32px', fontFamily: 'Inter, sans-serif', background: '#fdfbf7', minHeight: '100vh', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '12px', color: '#8c7b65', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '4px' }}>
        PARENT DESK · CAMPUS PORTAL
      </div>
      <h1 style={{ fontSize: '28px', color: '#1a1a1a', marginBottom: '24px' }}>
        Complaints Raised By You
      </h1>

      {/* Raise a New Complaint Section */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0eae1', marginBottom: '28px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1a1a1a' }}>Raise a New Complaint</h3>
        <form onSubmit={handleCreateComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <input 
              type="text"
              placeholder="Complaint Title / Subject"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                flex: 2,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #dcd6cd',
                fontSize: '14px',
                outline: 'none',
                background: '#fff'
              }}
            />
            <select 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #dcd6cd',
                fontSize: '14px',
                outline: 'none',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="General Inquiry">General Inquiry</option>
              <option value="Fee & Payments">Fee & Payments</option>
              <option value="Academic Performance">Academic Performance</option>
              <option value="Infrastructure & Transport">Infrastructure & Transport</option>
              <option value="Hostel & Mess">Hostel & Mess</option>
            </select>
          </div>

          <textarea 
            placeholder="Describe your concern or issue in detail..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={4}
            style={{
              width: '100vw',
              maxWidth: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #dcd6cd',
              fontSize: '14px',
              outline: 'none',
              background: '#fff',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              disabled={submitting}
              style={{
                background: '#122031',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>

      {/* Top Metric Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: '#e6ad35', padding: '20px', borderRadius: '12px', flex: 1, color: '#fff', boxShadow: '0 4px 6px rgba(230, 173, 53, 0.2)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{counts.assigned}</div>
          <div style={{ fontSize: '11px', letterSpacing: '1px', fontWeight: '600', marginTop: '4px' }}>ASSIGNED / PENDING</div>
        </div>
        <div style={{ background: '#122031', padding: '20px', borderRadius: '12px', flex: 1, color: '#fff', boxShadow: '0 4px 6px rgba(18, 32, 49, 0.2)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{counts.unassigned}</div>
          <div style={{ fontSize: '11px', letterSpacing: '1px', fontWeight: '600', marginTop: '4px' }}>UNASSIGNED</div>
        </div>
        <div style={{ background: '#122031', padding: '20px', borderRadius: '12px', flex: 1, color: '#fff', boxShadow: '0 4px 6px rgba(18, 32, 49, 0.2)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{counts.resolved}</div>
          <div style={{ fontSize: '11px', letterSpacing: '1px', fontWeight: '600', marginTop: '4px' }}>RESOLVED</div>
        </div>
      </div>

      {/* Main Content Container */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0eae1' }}>
        
        {/* Dropdown Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f0eae1', paddingBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#2c2c2c' }}>Ticket Tracking & History</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#666' }}>Filter Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #dcd6cd',
                background: '#fff',
                fontSize: '13px',
                fontWeight: '500',
                color: '#333',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="All">All Tickets</option>
              <option value="Pending">Pending List</option>
              <option value="Rejected">Rejected List</option>
              <option value="Resolved">Resolved List</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#666', padding: '30px 0', textAlign: 'center' }}>Loading your complaints...</div>
        ) : error ? (
          <div style={{ color: '#d9534f', padding: '30px 0', textAlign: 'center' }}>{error}</div>
        ) : (
          <div>
            {filteredComplaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: '14px' }}>
                You haven't raised any parent portal tickets matching "{statusFilter}". Use the form above to raise your first complaint!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredComplaints.map((item, index) => {
                  const itemId = item.id || item._id || index;
                  const isExpanded = expandedId === itemId;
                  const status = item.status || 'Pending';
                  const badge = getBadgeStyle(status);
                  const dt = formatDateTime(item.createdAt);

                  return (
                    <div 
                      key={itemId}
                      style={{
                        background: '#faf9f6',
                        border: '1px solid #ebe5dc',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Card Header */}
                      <div 
                        onClick={() => setExpandedId(isExpanded ? null : itemId)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '16px 20px',
                          cursor: 'pointer',
                          background: isExpanded ? '#f4efe6' : '#faf9f6'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>
                            {item.title || item.description || "Untitled Complaint"}
                          </span>
                          <span style={{ fontSize: '12px', color: '#777' }}>
                            {item.category || 'General'} • Raised on: {dt.date} {dt.month}, {dt.time}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            fontSize: '12px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {status}
                          </div>
                          <span style={{ fontSize: '12px', color: '#888' }}>{isExpanded ? '▲ Hide' : '▼ View'}</span>
                        </div>
                      </div>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <div style={{ padding: '20px', borderTop: '1px solid #ebe5dc', background: '#fff', display: 'flex', gap: '24px' }}>
                          
                          {/* Side Tracking */}
                          <div style={{ flex: 1, borderRight: '1px solid #eee', paddingRight: '20px' }}>
                            <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#333' }}>Side Tracking Lifecycle</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#137333', marginTop: '4px' }}></div>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>Ticket Created</div>
                                  <div style={{ fontSize: '11px', color: '#777' }}>{dt.date} {dt.month} at {dt.time}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: status !== 'Pending' ? '#137333' : '#e6ad35', marginTop: '4px' }}></div>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>Under Review</div>
                                  <div style={{ fontSize: '11px', color: '#777' }}>Processed by campus admin</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: status === 'Resolved' || status === 'Closed' || status === 'Rejected' ? '#137333' : '#ccc', marginTop: '4px' }}></div>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>Final Status: {status}</div>
                                  <div style={{ fontSize: '11px', color: '#777' }}>{dt.date} {dt.month}, {dt.time}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Comment Box */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>Discussion & Comment Box</h4>
                            <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {(!item.comments || item.comments.length === 0) ? (
                                <p style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', margin: 0 }}>No comments yet.</p>
                              ) : (
                                item.comments.map((c, i) => (
                                  <div key={i} style={{ background: '#f8f6f0', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                                    <strong>{c.sender}:</strong> {c.text}
                                  </div>
                                ))
                              )}
                            </div>
                            <form onSubmit={(e) => handleAddComment(itemId, e)} style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                              <input 
                                type="text"
                                placeholder="Type your note..."
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #dcd6cd', fontSize: '12px', outline: 'none' }}
                              />
                              <button type="submit" style={{ background: '#122031', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                Send
                              </button>
                            </form>
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
