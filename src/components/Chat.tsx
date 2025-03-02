import React, { useState, useEffect, useRef } from 'react';
import styles from '../Styles/Chat.module.css';

interface ChatProps {
    onSend: (message: string) => void;
}

const Chat: React.FC<ChatProps> = ({ onSend }) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        console.log('Sending message:', message);
        if (message.trim()) {
            onSend(message);
            setMessage('');
        }
    };

    // Auto-resize textarea based on content
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    return (
        <div className={styles.chat}>
            <div className={styles.chatContainer}>
                <textarea
                    ref={textareaRef}
                    placeholder="Ask me anything..."
                    className={styles.input}
                    value={message}
                    onChange={(e) => {
                        console.log('Message changed:', e.target.value);
                        setMessage(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            console.log('Enter pressed without Shift');
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    rows={1}
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
