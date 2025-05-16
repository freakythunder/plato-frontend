import React from 'react';
import styles from '../Styles/WhimsicalComponents.module.css';
import googleIcon from '../assets/icons8-google.svg';

const NavbarWhimsical = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <div className={styles.navbarLogo}>
          <h1 className={styles.navbarLogoText}>Plato</h1>
        </div>
        
        <div className={styles.navbarButtons}>          <button 
            className={styles.navbarLoginButton}
            onClick={onLogin}
          >
            <img src={googleIcon} alt="Google Icon" className={styles.googleIcon} />
            Login
          </button>
          <button 
            className={styles.navbarSignupButton}
            onClick={onLogin}
          >
            <img src={googleIcon} alt="Google Icon" className={styles.googleIcon} />
            Sign up
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavbarWhimsical;
