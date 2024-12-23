import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../Styles/Navbar.module.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useAuth0 } from "@auth0/auth0-react";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { username, isAuthenticated, localLogout } = useAuth();
  const { logout } = useAuth0();

  const handleLogout = async () => {
    try {
      console.log('Attempting to log out'); // Log start of logout

      // Send logout request to backend
      const response = await api.post('/auth/logout');
      console.log('Backend logout successful:', response); // Log backend success response

      // Perform local logout actions to clear local storage and auth state
      localLogout();
      setIsMenuOpen(false);

      // Temporary delay before Auth0 logout to ensure backend completion
      setTimeout(() => {
        console.log('Executing Auth0 logout'); // Log before Auth0 logout
        logout({ logoutParams: { returnTo: window.location.origin } });
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

      // Trigger Auth0 logout in case backend logout fails
      setTimeout(() => {
        console.log('Executing Auth0 logout after backend error'); // Log in case of backend failure
        logout({ logoutParams: { returnTo: window.location.origin } });
      }, 500);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.navbar}>
      <h1 className={styles.title}>plato</h1>
      <div className={styles.navLinks}>
        {isAuthenticated ? (
          <div className={styles.userMenu}>
            <button onClick={toggleMenu} className={styles.userButton}>
              👤
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
