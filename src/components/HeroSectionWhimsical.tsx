import React from 'react';
import styles from '../Styles/WhimsicalComponents.module.css';
import googleIcon from "../assets/icons8-google.svg";

const HeroSectionWhimsical = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <div className={styles.heroTextContent}>
            <h1 className={styles.heroTitle}>
              Introducing Plato...
            </h1>
            <p className={styles.heroDescription}>
              Your AI-powered personal tutor that can create customised courses for you in a matter of minutes!
            </p>
            <button className={styles.heroButton} onClick={onLogin}>
              <img src={googleIcon} alt="Google Icon" className={styles.googleIcon} />
              Get Started
            </button>
          </div>
          <div className={styles.heroImageContainer}>
            <div className={styles.heroImage}>
              <img 
                src="https://cdn.dribbble.com/users/2851002/screenshots/7736965/media/e08e0676dd54ae8715c2d72bbdd51eb2.gif" 
                alt="Animated student learning on laptop" 
                className={styles.heroImageContent}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSectionWhimsical;
