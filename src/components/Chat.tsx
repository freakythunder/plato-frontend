import React, { useState } from 'react';
import styles from '../Styles/Chat.module.css';

interface ChatProps {
    onSend: (message: string) => void; // Function to send a message
}

const Chat: React.FC<ChatProps> = ({ onSend }) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim()) {
            onSend(message); // Call the send function
            setMessage(''); // Clear the input box
        }
    };

    return (
        <div className={styles.chat}>
            <div className={styles.chatContainer}>
                <input
                    type="text"
                    placeholder="Ask me your doubts..."
                    className={styles.input}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSend(); // Send message on Enter key
                    }}
                />
                <button
                    className={styles.arrowButton}
                    onClick={handleSend}
                ></button>
            </div>
        </div>
    );
};

export default Chat;
