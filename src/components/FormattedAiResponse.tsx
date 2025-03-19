import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import styles from '../Styles/ChatInterface.module.css';
import { ComponentPropsWithoutRef } from 'react';
import { preprocessMarkdown } from '../utils/markdownHelper';

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
  const [markdownContent, setMarkdownContent] = useState('');
  
  useEffect(() => {
    // Extract aiResponse content regardless of its type (string or object)
    const aiResponse = response.aiResponse;
    const content = typeof aiResponse === 'string' ? aiResponse : aiResponse?.aiResponse || '';
    
    // Preprocess the markdown content to ensure proper rendering
    const processedContent = preprocessMarkdown(content);
    setMarkdownContent(processedContent);
  }, [response]);

  const formattedTimestamp = new Date(response.timestamp).toLocaleString();
  
  if (!markdownContent) return null;

  return (
    <div className={styles.aiResponseContainer}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Improved code block rendering with better inline styling
          code({ inline, className, children, ...props }: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
            const match = /language-(\w+)/.exec(className || '');
            const content = String(children).replace(/\n$/, '');
            
            // Handle code blocks with language specification
            if (!inline && match) {
              return (
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language={match[1]}
                  className={styles.codeBlock}
                  PreTag="div"
                  {...props}
                >
                  {content}
                </SyntaxHighlighter>
              );
            } 
            
            // For inline code
            return (
              <code className={styles.inlineCode} {...props}>
                {children}
              </code>
            );
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
          blockquote: ({ children, ...props }) => (
            <blockquote className={styles.hint} {...props}>
              {children}
            </blockquote>
          ),
          
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
      </ReactMarkdown>
      <div className={styles.timestamp}>{formattedTimestamp}</div>
    </div>
  );
};

export default FormattedAIResponse;