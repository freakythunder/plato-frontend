import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../Styles/Navbar.module.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getAuth, signOut } from "firebase/auth";
import Syllabus from './syllabus/syllabus';


const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { username, isAuthenticated, localLogout, imageurl } = useAuth();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      console.log('Attempting to log out'); // Log start of logout

      const topics = JSON.parse(localStorage.getItem('topics') || '[]');

      // Send logout request to backend with topics
      const response = await api.post('/auth/logout', { topics });
      console.log('Backend logout successful:', response); // Log backend success response

      // Perform local logout actions to clear local storage and auth state
      localLogout();
      setIsMenuOpen(false);

      setTimeout(async () => {
        console.log('Executing Auth0 logout'); // Log before Auth0 logout
        await signOut(auth);
        navigate('/');
      }, 1000); // Half a second delay to ensure backend completion

    } catch (error) {
      console.error('Logout request failed:', error);

      if (error.response) {
        console.error('Server responded with:', error.response.status, error.response.data);
      } else {
        console.error('No response received from server or request setup failed');
      }

      // Perform local logout even if backend logout fails
      localLogout();
      setIsMenuOpen(false);

      await signOut(auth);
      navigate('/');

    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const feedbackLink = "https://calendly.com/adityaramteke-1357/30min";

  return (
    <nav className={styles.navbar}>
      <div className={styles.title}>plato</div>

      <div className={styles.syllabus}>
        <Syllabus />
      </div>

      <div className={styles.navLinks} >

        <div className={styles.feedbackSection}>
          <span className={styles.feedbackText}>Have Feedback?</span>
          <button
            className={styles.feedbackButton}
            onClick={() => window.open(feedbackLink, '_blank')} // Open link in a new tab
          >
            Talk to Founders
          </button>
        </div>
        {isAuthenticated ? (
          <div className={styles.userMenu}>
            <button onClick={toggleMenu} className={styles.userButton}>

              <img src={imageurl} alt="User Profile Picture" style={{
                width: '40px', // adjust the width to your desired size
                height: '40px', // adjust the height to your desired size
                borderRadius: '50%', // make the image circular
                objectFit: 'cover', // ensure the image is scaled to fit within the dimensions
              }} />
            </button>
            {isMenuOpen && (
              <div className={styles.dropdown}>
                <span className={styles.username}>{username}</span>
                <button onClick={handleLogout} className={styles.logoutButton}>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );

}

export default Navbar;
