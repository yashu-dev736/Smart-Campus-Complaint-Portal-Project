import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const passwordRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = "http://localhost:5000/api";

  // ==========================================
  // EMAIL ENTER KEY
  // Move cursor to Password
  // ==========================================

  const handleEmailKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (!email.trim()) {
        setError("Please enter your email.");
        return;
      }

      setError("");

      passwordRef.current?.focus();
    }
  };

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          email: email.trim(),
          password,
        }
      );

      const data = response.data;

      console.log("Login Response:", data);

      if (!data.token || !data.user) {
        setError("Invalid login response from server.");
        return;
      }

      // Save user and token
      login(data.user, data.token);

      const role = data.user.role?.toLowerCase();

      // Redirect based on role
      if (role === "admin") {
        navigate("/admin-dashboard");
      } else if (role === "staff") {
        navigate("/staff-dashboard");
      } else if (role === "parent") {
        navigate("/parent-dashboard");
      } else {
        setError(`Unknown user role: ${data.user.role}`);
      }

    } catch (error) {
      console.error("Login Error:", error);

      if (error.response) {
        setError(
          error.response.data?.message ||
          "Invalid email or password."
        );
      } else {
        setError("Unable to connect to the server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "35px",
          boxShadow:
            "0 10px 35px rgba(15, 23, 42, 0.10)",
        }}
      >

        {/* =====================================
            HEADER
        ====================================== */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "55px",
              height: "55px",
              margin: "0 auto 15px",
              borderRadius: "14px",
              background: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "700",
            }}
          >
            SC
          </div>

          <h1
            style={{
              margin: 0,
              color: "#0f172a",
              fontSize: "26px",
            }}
          >
            Welcome Back
          </h1>

          <p
            style={{
              marginTop: "8px",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Login to Smart Campus Complaint Portal
          </p>
        </div>

        {/* =====================================
            ERROR MESSAGE
        ====================================== */}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fecaca",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* =====================================
            LOGIN FORM
        ====================================== */}

        <form onSubmit={handleLogin}>

          {/* EMAIL */}

          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Email Address
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              autoComplete="email"
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onKeyDown={handleEmailKeyDown}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "14px",
              }}
            />
          </div>

          {/* PASSWORD */}

          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Password
            </label>

            <input
              ref={passwordRef}
              type="password"
              placeholder="Enter your password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                outline: "none",
                fontSize: "14px",
              }}
            />
          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "8px",
              background: loading
                ? "#94a3b8"
                : "#2563eb",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "700",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* =====================================
            REGISTER
        ====================================== */}

        <div
          style={{
            textAlign: "center",
            marginTop: "22px",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          Don't have an account?{" "}

          <Link
            to="/register"
            style={{
              color: "#2563eb",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            Register
          </Link>
        </div>

        {/* =====================================
            BACK HOME
        ====================================== */}

        <div
          style={{
            textAlign: "center",
            marginTop: "15px",
          }}
        >
          <Link
            to="/"
            style={{
              color: "#64748b",
              fontSize: "13px",
              textDecoration: "none",
            }}
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;