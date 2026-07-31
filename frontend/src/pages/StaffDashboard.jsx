import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Track which card is currently expanded for comments & tracking
  const [expandedId, setExpandedId] = useState(null);
  const [commentInput, setCommentInput] = useState('');

  const [counts, setCounts] = useState({
    assigned: 0,
    unassigned: 0,
    resolved: 0
  });

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get('http://localhost:5000/api/complaints', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = response.data.complaints || response.data || [];
        setComplaints(data);

        const assignedCount = data.filter(item => (item.status || 'Pending').toLowerCase() !== 'resolved').length;
        const resolvedCount = data.filter(item => (item.status || '').toLowerCase() === 'resolved').length;
        
        setCounts({
          assigned: assignedCount,
          unassigned: 0,
          resolved: resolvedCount
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching staff queue:", err);
        setError("Failed to load queue. Please try again.");
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  const filteredComplaints = complaints.filter(item => {
    const currentStatus = item.status || 'Pending';
    if (statusFilter === 'All') return true;
    return currentStatus.toLowerCase() === statusFilter.toLowerCase();
  });

  const getBadgeStyle = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'resolved') {
      return { bg: '#e6f4ea', color: '#137333', border: '#ceead6' };
    } else if (s === 'rejected') {
      return { bg: '#fce8e6', color: '#c5221f', border: '#fad2cf' };
    } else {
      return { bg: '#fef7e0', color: '#b06000', border: '#fef1c7' };
    }
  };

  // Format date, time, and month nicely from timestamp strings
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
    
    // Update local state to show comment instantly
    setComplaints(prev => prev.map(item => {
      if ((item.id || item._id) === id) {
        const existingComments = item.comments || [];
        return {
          ...item,
          comments: [...existingComments, { text: commentInput, sender: 'Staff', timestamp: new Date().toISOString() }]
        };
      }
      return item;
    }));
    setCommentInput('');
  };

  return (
    <div style={{ padding: '32px', fontFamily: 'Inter, sans-serif', background: '#fdfbf7', minHeight: '100vh', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '12px', color: '#8c7b65', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '4px' }}>
        STAFF DESK · CSE
      </div>
      <h1 style={{ fontSize: '28px', color: '#1a1a1a', marginBottom: '24px' }}>
        Your work queue
      </h1>

      {/* Top Metric Cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: '#e6ad35', padding: '20px', borderRadius: '12px', flex: 1, color: '#fff', boxShadow: '0 4px 6px rgba(230, 173, 53, 0.2)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{counts.assigned}</div>
          <div style={{ fontSize: '11px', letterSpacing: '1px', fontWeight: '600', marginTop: '4px' }}>ASSIGNED TO ME</div>
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
          <h3 style={{ margin: 0, fontSize: '18px', color: '#2c2c2c' }}>Ticket Queue (Click card to view tracking & comments)</h3>
          
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
          <div style={{ color: '#666', padding: '30px 0', textAlign: 'center' }}>Loading queue...</div>
        ) : error ? (
          <div style={{ color: '#d9534f', padding: '30px 0', textAlign: 'center' }}>{error}</div>
        ) : (
          <div>
            {filteredComplaints.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: '14px' }}>
                No tickets found for "{statusFilter}".
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
                      {/* Main Ticket Card Header (Clickable to Expand) */}
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

                      {/* Expanded Section: Side Tracking & Comment Box */}
                      {isExpanded && (
                        <div style={{ padding: '20px', borderTop: '1px solid #ebe5dc', background: '#fff', display: 'flex', gap: '24px' }}>
                          
                          {/* Side Tracking Timeline */}
                          <div style={{ flex: 1, borderRight: '1px solid #eee', paddingRight: '20px' }}>
                            <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', color: '#333' }}>Side Tracking Lifecycle</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                              
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
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>Under Review / Assigned</div>
                                  <div style={{ fontSize: '11px', color: '#777' }}>Processed by department team</div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: status === 'Resolved' || status === 'Rejected' ? '#137333' : '#ccc', marginTop: '4px' }}></div>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>Final Status: {status}</div>
                                  <div style={{ fontSize: '11px', color: '#777' }}>Current stage status update</div>
                                </div>
                              </div>

                            </div>
                          </div>

                          {/* Comment Box & Discussion Section */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>Discussion & Comment Box</h4>
                            
                            <div style={{ maxH: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {(!item.comments || item.comments.length === 0) ? (
                                <p style={{ fontSize: '12px', color: '#888', fontStyle: 'italic', margin: 0 }}>No comments yet. Leave a note below.</p>
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
                                placeholder="Type your comment or update..."
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid #dcd6cd',
                                  fontSize: '12px',
                                  outline: 'none'
                                }}
                              />
                              <button 
                                type="submit"
                                style={{
                                  background: '#122031',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '8px 14px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
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

export default StaffDashboard;
