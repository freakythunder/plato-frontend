import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './practice.module.css';
import chatStyles from '../../Styles/Chat.module.css';
import { useProgress } from '../../context/AppContext';

const Practice: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [showModal, setShowModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setPrompt: setGlobalPrompt, allProblemSets, setAllProblemSets, setCurrentSubtopic, setPracticeMode } = useProgress();
  const navigate = useNavigate();

  // Updated handleGenerate to accept optional prompt override and serial number.
  const handleGenerate = (promptOverride?: string, serialNumber?: number) => {
    const currentPrompt = promptOverride ?? prompt;
    if (serialNumber !== undefined) {
      console.log('Generating problem set for table row:', currentPrompt, serialNumber);
      setCurrentSubtopic(`DSA_problemset_${serialNumber.toString()}`);
      // Set special global prompt so that ChatInterface avoids sending a message.
      setGlobalPrompt("don't send handlsend");
      // Update allProblemSets state by adding the prompt.
      setPracticeMode(true);
      
    } else {
      console.log('Generating problem set for:', currentPrompt);
      const m = allProblemSets.length;
      setCurrentSubtopic(`DSA_problemset_${(m + 1).toString()}`);
      setGlobalPrompt(currentPrompt);
      setPracticeMode(true);
      setAllProblemSets([...allProblemSets, currentPrompt]);
      
    }
    localStorage.setItem('language', 'DSA_Practice');
    setTimeout(() => {
      navigate('/main');
    }, 1000);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Screen1: original chat/prompt UI.
  const Screen1 = () => {
    const modalTextareaRef = useRef<HTMLTextAreaElement>(null);
    // Create local state to prevent parent re-renders from affecting cursor
    const [promptInput, setPromptInput] = useState(prompt);
    const [hoverDynamic, setHoverDynamic] = useState(false);
    const [hoverArrays, setHoverArrays] = useState(false);
    
    // Focus textarea only once on mount.
    useEffect(() => {
      modalTextareaRef.current?.focus();
    }, []);
    
    // Synchronize promptInput with parent prompt if parent prompt changes
    useEffect(() => {
      setPromptInput(prompt);
    }, [prompt]);
    
    // Add effect to adjust textarea height whenever promptInput changes
    useEffect(() => {
      if (modalTextareaRef.current) {
        modalTextareaRef.current.style.height = 'auto';
        modalTextareaRef.current.style.height = `${modalTextareaRef.current.scrollHeight}px`;
      }
    }, [promptInput]);
    
    // Handler to adjust height without affecting cursor position
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPromptInput(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    };

    // Only update parent state when submitting
    const handleSubmit = () => {
      setPrompt(promptInput);
      handleGenerate(promptInput);
    };
    
    // Update local state when prompt suggestions are clicked
    const handlePromptSuggestion = (suggestion: string) => {
      setPromptInput(suggestion);
      setPrompt(suggestion); // Update parent state as well to maintain sync
      // Remove the height adjustment here since it's now handled by the useEffect
    };
    
    return (
      <div className={chatStyles.chatContainer}>
        <div>
          <h1 className={styles.title}>Welcome to DSA Practice Arena!</h1>
          <p className={styles.description}>
            Here you can generate problem sets based on what you want to practice.<br />
            Customize your problems and challenges.
          </p>
        </div>
        <div className={styles.inputSection}>
          <div className={chatStyles.chatContainer}>
            <textarea
              ref={modalTextareaRef}
              placeholder="Enter your prompt for generating problemsets..."
              value={promptInput}
              onChange={handleInput}
              className={chatStyles.input}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
            />
            <button onClick={handleSubmit} className={chatStyles.arrowButton}>
              &#8594;
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <span
            style={{
              cursor: 'pointer',
              fontSize: '0.7rem',
              border: '1px solid #ccc',
              padding: '4px',
              borderRadius: '4px',
              backgroundColor: hoverDynamic ? '#eee' : 'transparent',
              transition: 'background-color 0.3s'
            }}
            onClick={() => handlePromptSuggestion('I want to recap my DSA skills. Give me a mix of medium and hard question from all important DSA topics.')}
            onMouseEnter={() => setHoverDynamic(true)}
            onMouseLeave={() => setHoverDynamic(false)}
          >
            I want to recap my DSA skills. Give me a mix of medium and hard question from all important DSA topics.
          </span>
          <span
            style={{
              cursor: 'pointer',
              fontSize: '0.7rem',
              border: '1px solid #ccc',
              padding: '4px',
              borderRadius: '4px',
              backgroundColor: hoverArrays ? '#eee' : 'transparent',
              transition: 'background-color 0.3s'
            }}
            onClick={() => handlePromptSuggestion('I want to practice 4 Medium questions on graphs.')}
            onMouseEnter={() => setHoverArrays(true)}
            onMouseLeave={() => setHoverArrays(false)}
          >
            I want to practice 4 Medium questions on graphs.
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Practice Problem Sets</h2>
        <button className={styles.createButton} onClick={() => setShowModal(true)}>+ Create New Problemset</button>
      </div>
      <div className={styles.problemSetsContainerWrapper}>
        <div className={styles.problemSetsContainer} style={{ height: '400px' }}>
          {allProblemSets && allProblemSets.length > 0 ? (
            <table className={styles.problemSetTable}>
              <thead>
                <tr style={{ 
                  backgroundColor: '#4CAF50', 
                  color: 'white',
                  textAlign: 'left',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  <th style={{ padding: '12px 15px', borderTopLeftRadius: '6px' }}>#</th>
                  <th style={{ padding: '12px 15px', borderTopRightRadius: '6px' }}>ProblemSet</th>
                </tr>
              </thead>
              <tbody>
                {allProblemSets.map((set: string, index: number) => (
                  <tr 
                    key={index} 
                    className={styles.tableRow} 
                    onClick={() => handleGenerate(set, index + 1)}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderBottom: '1px solid #e0e0e0',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#c8e6c9';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <td style={{ padding: '12px 15px', width: '50px', color: '#4CAF50', fontWeight: 'bold' }}>{index + 1}</td>
                    <td style={{ 
                      padding: '12px 15px', 
                      color: '#333',
                      textAlign: 'left',
                      maxWidth: '500px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{set}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ 
              display: 'table',
              width: '100%',
              height: '100%',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'table-cell',
                verticalAlign: 'middle',
                padding: '20px'
              }}>
                <p style={{ color: '#757575' }}>No problem sets available.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <div 
          className={styles.modalOverlay} 
          onClick={() => setShowModal(false)}
        >
          <div 
            className={styles.modalContent} 
            style={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ffffff, #f1f8e9)'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent clicks on the content from closing the modal
          >
            <button className={styles.closeModal} onClick={() => setShowModal(false)} style={{ color: '#4CAF50' }}>×</button>
            <Screen1 />
          </div>
        </div>
      )}
    </div>
  );
};

export default Practice;
