import React from 'react';
import styles from '../Styles/Chat.module.css';

const Chat: React.FC = () => {
    return (
        <div className={styles.chat}>
            <input type="tt" placeholder="Type your message here..." className={styles.input} />
            <button className={styles.button}>Send</button>
        </div>
    );
}

export default Chat;
