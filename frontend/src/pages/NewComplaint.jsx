import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const NewComplaint = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("CSE");

  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("detecting");
  const [locationError, setLocationError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // AUTOMATIC LOCATION DETECTION
  // =========================================================

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLocationStatus("detecting");
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError(
        "Location services are not supported by this browser."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        let address = "Address unavailable";

        // Reverse geocoding
        try {
          const response = await axios.get(
            "https://nominatim.openstreetmap.org/reverse",
            {
              params: {
                lat: latitude,
                lon: longitude,
                format: "json",
                zoom: 18,
                addressdetails: 1,
              },
              headers: {
                Accept: "application/json",
              },
            }
          );

          address =
            response.data?.display_name || "Address unavailable";
        } catch (err) {
          console.error("Address detection failed:", err);
        }

        const locationData = {
          latitude,
          longitude,
          accuracy,
          address,
          campusArea: null,
          capturedAt: new Date().toISOString(),
        };

        setLocation(locationData);
        setLocationStatus("success");
      },
      (err) => {
        console.error("GPS Error:", err);

        setLocationStatus("error");

        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError(
              "Location access was denied. Please allow location access in your browser settings."
            );
            break;

          case err.POSITION_UNAVAILABLE:
            setLocationError(
              "Current location is unavailable. Please check your device location services."
            );
            break;

          case err.TIMEOUT:
            setLocationError(
              "Location detection timed out. Please try again."
            );
            break;

          default:
            setLocationError(
              "Unable to detect your current location."
            );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // =========================================================
  // SUBMIT COMPLAINT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError(
        "No authentication token found. Please log in again."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);

      return;
    }

    if (!location) {
      setError(
        "Your current location has not been detected yet. Please wait for location detection to complete."
      );
      return;
    }

    try {
      setLoading(true);

      const storedUser = localStorage.getItem("user");
      let user = null;

      try {
        user = storedUser ? JSON.parse(storedUser) : null;
      } catch {
        user = null;
      }

      const response = await axios.post(
        "http://localhost:5000/api/complaints",
        {
          title: title.trim(),
          category,
          description: description.trim(),
          department,

          // Automatically detected location
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            address: location.address,
            campusArea: location.campusArea,
            capturedAt: location.capturedAt,
          },

          // Additional location fields
          latitude: location.latitude,
          longitude: location.longitude,
          locationAccuracy: location.accuracy,
          locationAddress: location.address,

          // Complaint owner
          raisedBy: user?.role || "parent",
          userId: user?.id || user?._id || user?.uid || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Complaint submitted:", response.data);

      // Role-based redirect
      const role = user?.role?.toLowerCase();

      if (role === "admin") {
        navigate("/admin-dashboard");
      } else if (role === "staff") {
        navigate("/staff-dashboard");
      } else {
        navigate("/parent-dashboard");
      }
    } catch (err) {
      console.error("Complaint submission error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setError(
          "Your session has expired. Please log in again."
        );

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to submit complaint. Please check the server connection."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // SHARED THEME-AWARE INLINE STYLES
  // =========================================================

  const styles = {
    page: {
      minHeight: "100vh",
      background: "var(--dashboard-bg)",
      color: "var(--text-primary)",
      padding: "40px 20px",
      transition: "background-color 0.25s ease, color 0.25s ease",
    },

    card: {
      maxWidth: "800px",
      margin: "0 auto",
      background: "var(--card-bg)",
      color: "var(--text-primary)",
      padding: "30px",
      borderRadius: "16px",
      border: "1px solid var(--border-color)",
      boxShadow: "var(--card-shadow)",
      transition:
        "background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease",
    },

    heading: {
      marginBottom: "8px",
      color: "var(--text-heading)",
      fontSize: "26px",
      fontWeight: 750,
    },

    description: {
      color: "var(--text-secondary)",
      marginBottom: "25px",
      lineHeight: 1.7,
    },

    locationCard: {
      marginBottom: "25px",
      padding: "18px",
      borderRadius: "12px",
      border: "1px solid var(--border-color)",
      background: "var(--surface-secondary)",
      color: "var(--text-primary)",
    },

    sectionHeading: {
      marginTop: 0,
      marginBottom: "10px",
      color: "var(--text-heading)",
      fontSize: "17px",
      fontWeight: 700,
    },

    field: {
      marginBottom: "20px",
    },

    label: {
      display: "block",
      marginBottom: "7px",
      fontWeight: 600,
      color: "var(--text-primary)",
    },

    input: {
      width: "100%",
      padding: "12px",
      border: "1px solid var(--input-border)",
      borderRadius: "8px",
      background: "var(--input-bg)",
      color: "var(--text-primary)",
      boxSizing: "border-box",
      outlineColor: "var(--primary)",
    },

    textarea: {
      width: "100%",
      padding: "12px",
      border: "1px solid var(--input-border)",
      borderRadius: "8px",
      background: "var(--input-bg)",
      color: "var(--text-primary)",
      resize: "vertical",
      boxSizing: "border-box",
    },

    error: {
      background: "var(--error-bg)",
      color: "var(--error-text)",
      border: "1px solid var(--error-border)",
      padding: "12px 15px",
      borderRadius: "8px",
      marginBottom: "20px",
    },

    locationDetails: {
      color: "var(--text-secondary)",
      fontSize: "14px",
      lineHeight: 1.8,
      overflowWrap: "anywhere",
    },

    retryButton: {
      marginTop: "10px",
      padding: "9px 14px",
      border: "none",
      borderRadius: "7px",
      background: "var(--primary)",
      color: "#ffffff",
      fontWeight: 600,
      cursor: "pointer",
    },

    submitButton: {
      width: "100%",
      padding: "14px",
      border: "none",
      borderRadius: "8px",
      background: "var(--primary)",
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: 700,
      cursor: "pointer",
      opacity: loading || locationStatus !== "success" ? 0.65 : 1,
      transition: "background-color 0.2s ease",
    },
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Submit New Complaint</h1>

        <p style={styles.description}>
          Submit your complaint and it will be automatically linked
          to the location where it was lodged.
        </p>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}

        {/* AUTOMATIC LOCATION STATUS */}

        <div style={styles.locationCard}>
          <h3 style={styles.sectionHeading}>
            📍 Complaint Location
          </h3>

          {locationStatus === "detecting" && (
            <div style={{ color: "var(--primary)" }}>
              📡 Automatically detecting your current location...
            </div>
          )}

          {locationStatus === "success" && location && (
            <div>
              <div
                style={{
                  color: "var(--badge-resolved-text)",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}
              >
                ✓ Location detected successfully
              </div>

              <div style={styles.locationDetails}>
                <div>
                  <strong>Address:</strong> {location.address}
                </div>

                <div>
                  <strong>Latitude:</strong> {location.latitude}
                </div>

                <div>
                  <strong>Longitude:</strong> {location.longitude}
                </div>

                <div>
                  <strong>GPS Accuracy:</strong>{" "}
                  {Math.round(location.accuracy)} meters
                </div>
              </div>
            </div>
          )}

          {locationStatus === "error" && (
            <div
              style={{
                color: "var(--error-text)",
                lineHeight: 1.6,
              }}
            >
              <div>⚠️ {locationError}</div>

              <button
                type="button"
                onClick={detectLocation}
                style={styles.retryButton}
              >
                Retry Location Detection
              </button>
            </div>
          )}
        </div>

        {/* COMPLAINT FORM */}

        <form onSubmit={handleSubmit}>
          {/* TITLE */}

          <div style={styles.field}>
            <label htmlFor="complaint-title" style={styles.label}>
              Complaint Title *
            </label>

            <input
              id="complaint-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter complaint title"
              required
              style={styles.input}
            />
          </div>

          {/* CATEGORY */}

          <div style={styles.field}>
            <label htmlFor="complaint-category" style={styles.label}>
              Category
            </label>

            <select
              id="complaint-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.input}
            >
              <option value="Infrastructure">Infrastructure</option>
              <option value="Academics">Academics</option>
              <option value="Transport">Transport</option>
              <option value="Hostel">Hostel</option>
              <option value="Mess">Mess</option>
              <option value="Fees">Fees &amp; Payments</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* DEPARTMENT */}

          <div style={styles.field}>
            <label htmlFor="complaint-department" style={styles.label}>
              Department
            </label>

            <select
              id="complaint-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              style={styles.input}
            >
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">Mechanical</option>
              <option value="CIVIL">Civil</option>
              <option value="AIDS">AI &amp; DS</option>
              <option value="AIML">AI &amp; ML</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* DESCRIPTION */}

          <div style={{ ...styles.field, marginBottom: "25px" }}>
            <label
              htmlFor="complaint-description"
              style={styles.label}
            >
              Description *
            </label>

            <textarea
              id="complaint-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your complaint in detail..."
              rows={6}
              required
              style={styles.textarea}
            />
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading || locationStatus !== "success"}
            style={{
              ...styles.submitButton,
              cursor:
                loading || locationStatus !== "success"
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "Submitting Complaint..."
              : locationStatus !== "success"
              ? "Waiting for Location..."
              : "Submit Complaint"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewComplaint;
