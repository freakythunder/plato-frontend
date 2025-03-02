import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import styles from '../Styles/ChatInterface.module.css';
import { ComponentPropsWithoutRef } from 'react';
<<<<<<< HEAD
import MarkdownIt from 'markdown-it';

const mdParser = new MarkdownIt();
=======
>>>>>>> feature-practice-arena-frontend

interface FormattedAIResponseProps {
  response: {
    aiResponse: string | {
      user_id?: string;
      userMessage?: string;
      aiResponse?: string;
      timestamp?: string;
    };
    timestamp: string;
  };
}

const FormattedAIResponse: React.FC<FormattedAIResponseProps> = ({ response }) => {
<<<<<<< HEAD
  const [accumulatedResponse, setAccumulatedResponse] = useState('');
  const [lastValidMarkdown, setLastValidMarkdown] = useState('');

  useEffect(() => {
    const aiResponse = response.aiResponse;
    const newResponse = typeof aiResponse === 'string' ? aiResponse : aiResponse.aiResponse || '';

    // Append new response to accumulated
    setAccumulatedResponse(newResponse);
  }, [response]);

  useEffect(() => {
    const extractValidMarkdown = (content: string): string => {
      const lines = content.split('\n'); // Split into lines for granular processing
      let validContent = '';

      for (const line of lines) {
        try {
          const rendered = mdParser.render(line.trim());
          if (rendered.trim()) {
            validContent += line + '\n'; // Accumulate valid lines
          }
        } catch {
          // Skip invalid lines
        }
      }

      return validContent.trim();
    };

    const validMarkdown = extractValidMarkdown(accumulatedResponse);
    if (validMarkdown) {
      setLastValidMarkdown(validMarkdown); // Update with extracted valid content
    }
  }, [accumulatedResponse]);

  if (!lastValidMarkdown) return null;
  const formattedTimestamp = new Date(response.timestamp).toLocaleString();
=======
  const [markdownContent, setMarkdownContent] = useState('');
  
  useEffect(() => {
    // Extract aiResponse content regardless of its type (string or object)
    const aiResponse = response.aiResponse;
    const content = typeof aiResponse === 'string' ? aiResponse : aiResponse?.aiResponse || '';
    
    // Set the extracted content directly without validation
    setMarkdownContent(content);
  }, [response]);

  const formattedTimestamp = new Date(response.timestamp).toLocaleString();
  
  if (!markdownContent) return null;
>>>>>>> feature-practice-arena-frontend

  return (
    <div className={styles.aiResponseContainer}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
<<<<<<< HEAD
          code({ inline, className, children, ...props }: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus as any}
                language={match[1]}
                className={styles.codeBlock}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={inline ? styles.inlineCode : ''} {...props}>
                {children}
              </code>
            );
          },
          h3: ({ ...props }) => <h3 className={styles.aiResponseHeader} {...props} />,
          p: ({ node, children, ...props }) => {
            const content = String(children).toLowerCase();
            const isChallenge = content.includes('challenge:');
            const isExplanation = content.includes('explanation:') || content.includes('hint:');
            const appliedClass = isChallenge
              ? styles.challengePrompt
              : isExplanation
                ? styles.explanationBox
                : styles.aiResponseText;

            return (
              <p className={appliedClass} {...props}>
                {children}
              </p>
            );
          },
          ul: ({ ...props }) => <ul className={styles.bulletPoints} {...props} />,
          li: ({ ...props }) => <li className={styles.bulletPoint} {...props} />,
=======
          // Improved code block rendering with better inline styling
          code({ inline, className, children, ...props }: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
            const match = /language-(\w+)/.exec(className || '');
            // Only use dark background for explicit language-tagged code blocks
            if (!inline && match && match[1] !== 'plaintext') {
              return (
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language={match[1]}
                  className={styles.codeBlock}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              );
            } else {
              // For inline code or code without language specification
              return (
                <code className={styles.inlineCode} {...props}>
                  {children}
                </code>
              );
            }
          },
          
          // Headers with consistent styling
          h1: ({ ...props }) => <h1 className={styles.aiResponseHeader} {...props} />,
          h2: ({ ...props }) => <h2 className={styles.aiResponseHeader} {...props} />,
          h3: ({ ...props }) => <h3 className={styles.aiResponseHeader} {...props} />,
          h4: ({ ...props }) => <h4 className={styles.aiResponseHeader} {...props} />,
          h5: ({ ...props }) => <h5 className={styles.aiResponseHeader} {...props} />,
          h6: ({ ...props }) => <h6 className={styles.aiResponseHeader} {...props} />,
          
          // Paragraphs with conditional styling
          p: ({ node, children, ...props }) => {
            const content = String(children).toLowerCase();
            
            // Apply specific classes based on content patterns
            if (content.includes('challenge:') || content.includes('problem ')) {
              return <p className={styles.challengePrompt} {...props}>{children}</p>;
            } else if (content.includes('explanation:') || content.includes('hint:') || 
                      content.includes('theory:') || content.includes('numerical walkthrough:')) {
              return <p className={styles.explanationBox} {...props}>{children}</p>;
            } else {
              return <p className={styles.aiResponseText} {...props}>{children}</p>;
            }
          },
          
          // Lists with consistent styling
          ul: ({ ...props }) => <ul className={styles.bulletPoints} {...props} />,
          ol: ({ ...props }) => <ol className={styles.orderedList} {...props} />,
          li: ({ ...props }) => <li className={styles.bulletPoint} {...props} />,
          
          // Blockquotes with hint styling
>>>>>>> feature-practice-arena-frontend
          blockquote: ({ children, ...props }) => (
            <blockquote className={styles.hint} {...props}>
              {children}
            </blockquote>
          ),
<<<<<<< HEAD
          strong: ({ children, ...props }) => (
            <strong className={styles.boldText} {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className={styles.italicText} {...props}>
              {children}
            </em>
          ),
        }}
      >
        {lastValidMarkdown}
=======
          
          // Text formatting
          strong: ({ children, ...props }) => (
            <strong className={styles.boldText} {...props}>{children}</strong>
          ),
          em: ({ children, ...props }) => (
            <em className={styles.italicText} {...props}>{children}</em>
          ),
          
          // Table styling for better readability
          table: ({ children, ...props }) => (
            <div className={styles.tableContainer}>
              <table className={styles.markdownTable} {...props}>{children}</table>
            </div>
          ),
          thead: ({ ...props }) => <thead className={styles.tableHeader} {...props} />,
          tbody: ({ ...props }) => <tbody className={styles.tableBody} {...props} />,
          tr: ({ ...props }) => <tr className={styles.tableRow} {...props} />,
          th: ({ ...props }) => <th className={styles.tableHeadCell} {...props} />,
          td: ({ ...props }) => <td className={styles.tableCell} {...props} />,
          
          // Links with proper styling
          a: ({ ...props }) => <a className={styles.markdownLink} target="_blank" rel="noopener noreferrer" {...props} />,
          
          // Images with responsive styling
          img: ({ ...props }) => <img className={styles.markdownImage} {...props} />,
        }}
      >
        {markdownContent}
>>>>>>> feature-practice-arena-frontend
      </ReactMarkdown>
      <div className={styles.timestamp}>{formattedTimestamp}</div>
    </div>
  );
};

export default FormattedAIResponse;