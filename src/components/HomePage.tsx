import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../Styles/HomePage.module.css";
import { useAuth } from "../context/AuthContext"; // Assuming this manages user session
import googleIcon from "../assets/icons8-google.svg";
import firebase from 'firebase/compat/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth'; // Updated imports

// Reusable LoadingScreen Component
const LoadingScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className={styles.loadingScreen} aria-live="polite">
    <h2>{message}</h2>
  </div>
);

const HomePage: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Logging you in...");
  const loadingMessages = ["Logging you in...", "Fetching your data...", "Almost there..."];
  const navigate = useNavigate();
  const { login } = useAuth(); // Assuming this function saves user data in session

  const auth = getAuth(); // Initialize Firebase Auth instance

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const credential = GoogleAuthProvider.credentialFromResult(result);
      let idToken ;
      const user = result.user;
      // Check if user signed in successfully
      console.log("User signed in successfully:", result.user);
      if (result.user) {
        const user = result.user;

        // Get a fresh ID token using onAuthStateChanged
        const idTokenPromise = new Promise((resolve, reject) => {
          onAuthStateChanged(auth, (user) => {
            if (user) {
              user.getIdToken(true)
                .then((idToken) => {
                  resolve(idToken);
                })
                .catch((error) => {
                  reject(error);
                });
            }
          });
        });

       idToken = await idTokenPromise;
      }

      



      // Send user data (including ID token) to backend for verification
      const response = await api.post("/auth/login", {
         idToken, // Use ID token for verification
       
      });

      if (response.data?.success) {
        const sessionToken = idToken;
        const message = response.data.message;
        const topics = response.data.data.topics; // Optional
        localStorage.setItem('topics', JSON.stringify(topics));
        login(user.displayName, sessionToken, message);
        navigate("/main");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      setErrorMessage(error.response?.data?.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
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
              <a
                href="https://calendly.com/adityaramteke-1357/30min"
                target="_blank"
                rel="noreferrer"
                className={styles.linkText}
              >
                here
              </a>
              .
            </p>

            <button className={styles.tryButton} onClick={handleGoogleLogin}>
              <img src={googleIcon} alt="Google Icon" className={styles.googleIcon} />
              Signup or Login

              <div id="firebaseui-auth-container"
              ></div>

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
