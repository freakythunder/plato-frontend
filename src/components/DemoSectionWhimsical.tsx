import React from 'react';
import styles from '../Styles/WhimsicalComponents.module.css';
import googleIcon from "../assets/icons8-google.svg";

const DemoSectionWhimsical = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className={styles.demoSection}>
      <h2 className={styles.demoTitle}>
        See this in action yourself...
      </h2>
      
      <div className={styles.demoVideoContainer}>
        <div className={styles.demoVideo}>
          <iframe 
            className={styles.demoVideoFrame}
            src="https://www.youtube.com/embed/IACHfKmZMr8" 
            title="Plato AI Tutoring Demo"
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen>
          </iframe>
        </div>
      </div>
      
      <div className={styles.demoButtonContainer}>
        <button className={styles.demoButton} onClick={onLogin}>
          <img src={googleIcon} alt="Google Icon" className={styles.googleIcon} />
          Get Started
        </button>
      </div>
    </div>
  );
};

export default DemoSectionWhimsical;
