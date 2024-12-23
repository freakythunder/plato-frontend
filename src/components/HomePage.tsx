import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../Styles/HomePage.module.css";
import { useAuth } from "../context/AuthContext";
import { useAuth0 } from "@auth0/auth0-react";
import googleIcon from "../assets/icons8-google.svg";

// Reusable LoadingScreen Component
const LoadingScreen: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className={styles.loadingScreen} aria-live="polite">
      <h2>{message}</h2>
    </div>
  );
};

const HomePage: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Logging you in...");
  const loadingMessages = ["Logging you in...", "Fetching your data...", "Almost there..."];
  const { loginWithRedirect, user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const authenticateUser = async (attempts: number = 0) => {
      if (!isAuthenticated || !user) return; // Prevent unnecessary execution

      setLoading(true);
      let messageIndex = 0;

      // Update loading messages periodically
      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingText(loadingMessages[messageIndex]);
      }, 1000);

      try {
        const username = user.email;
        const password = user.name;

        const response = await api.post("/auth/login", { username, password });
        clearInterval(interval);

        if (response.data?.data) {
          login(username, response.data.data.token, response.data.message);
          navigate("/main"); // Redirect after successful login
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (error: any) {
        clearInterval(interval);
        if (attempts < 2) {
          console.log(`Retrying login... Attempt ${attempts + 1}`);
          authenticateUser(attempts + 1); // Retry login
        } else {
          setErrorMessage(
            error.response?.data?.message || "Failed to authenticate after multiple attempts."
          );
          setLoading(false);
        }
      } finally {
        setLoading(false);
      }
    };

    // Trigger authentication only once per session
    const isAlreadyAuthenticated = localStorage.getItem("authenticated") === "true";
    if (!isAlreadyAuthenticated && isAuthenticated && user) {
      localStorage.setItem("authenticated", "true");
      authenticateUser();
    }
  }, [isAuthenticated, user, login, navigate]);

  const handleGoogleLogin = () => {
    setErrorMessage("");
    setLoading(true);
    loginWithRedirect();
  };

  const handleTryForFree = () => {
    setErrorMessage("");
    setLoading(true);
    loginWithRedirect();
  };

  return (
    <main className={styles.homePage}>
      {loading ? (
        <LoadingScreen message={loadingText} />
      ) : (
        <>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.logo}>plato</div>
          </header>

          {/* Main Content */}
          <div className={styles.content}>
            <h1 className={styles.title}>Welcome to Plato</h1>
            <p className={styles.subtitle}>
              We've built a personal tutor to help you learn JavaScript! This is our first
              prototype, and we'd love your feedback. Book a call with the founders to share your
              feedback{" "}
              <a href="https://calendly.com/adityaramteke-1357/30min" target="_blank" rel="noreferrer">
                here
              </a>
              .
            </p>

            <button className={styles.tryButton} onClick={handleTryForFree}>
              <img src={googleIcon} alt="Google Icon" className={styles.googleIcon} />
              Signup or Login
            </button>
          </div>
        </>
      )}

      {/* Error Message */}
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}
    </main>
  );
};

export default HomePage;
