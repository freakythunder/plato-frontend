import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import styles from "../Styles/HomePage.module.css";
import { useAuth } from "../context/AuthContext";
import googleIcon from "../assets/icons8-google.svg";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import posthog from 'posthog-js';
import NavbarWhimsical from "./NavbarWhimsical";
import HeroSectionWhimsical from "./HeroSectionWhimsical";
import DemoSectionWhimsical from "./DemoSectionWhimsical";
import FooterWhimsical from "./FooterWhimsical";

posthog.init('phc_SkoWOGNlQvwgXkAqlKWmYT6l0JStbH2Dpeh5dtY1b2N', { api_host: 'https://us.i.posthog.com' })

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

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/home');
    }
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const credential = GoogleAuthProvider.credentialFromResult(result);
      let idToken;
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
        const alltopics = response.data.data.topics;
        localStorage.setItem("allTopics", JSON.stringify(alltopics));
        login(user.displayName, sessionToken, message);
        
        // Check if this is a new user
        const isNewUser = message.trim().toLowerCase() === 'user registered';
        
        // Redirect based on user status
        if (isNewUser) {
          navigate("/course_generation");
        } else {
          navigate("/home");
        }
      } else {
        throw new Error("Invalid response from server");
      }
      posthog.identify(user.email , {username : user.displayName , email : user.email});
      posthog.capture('user_signed_up', { username: user.displayName , email: user.email });
    }  catch (error: any) {
      console.error("Authentication error:", error);
      setErrorMessage(error.response?.data?.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };  return (
    <div className={styles.whimsicalContainer}>
      {loading ? (
        <LoadingScreen message={loadingText} />
      ) : (
        <>
          <NavbarWhimsical onLogin={handleGoogleLogin} />
          <main className={styles.mainContent}>
            <HeroSectionWhimsical onLogin={handleGoogleLogin} />
            <DemoSectionWhimsical onLogin={handleGoogleLogin} />
          </main>
          <FooterWhimsical />
          {errorMessage && <div className={styles.error}>{errorMessage}</div>}
        </>
      )}
    </div>
  );
};

export default HomePage;
