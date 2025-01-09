import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import styles from '../Styles/ChatInterface.module.css';
import { ComponentPropsWithoutRef } from 'react';

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
  const extractMarkdownContent = (): string => {
    const aiResponse = response.aiResponse;
    if (typeof aiResponse === 'string') return aiResponse.trim();
    if (typeof aiResponse === 'object') return (aiResponse.aiResponse || '').trim();
    return '';
  };

  const markdownContent = extractMarkdownContent();
  if (!markdownContent) return null;

  const formattedTimestamp = new Date(response.timestamp).toLocaleString(); // Format timestamp for readability

  return (
    <div className={styles.aiResponseContainer}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus as any} // Black-themed code block
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
          blockquote: ({ children, ...props }) => (
            <blockquote className={styles.hint} {...props}>
              {children}
            </blockquote>
          ),
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
        {markdownContent}
      </ReactMarkdown>
      <div className={styles.timestamp}>{formattedTimestamp}</div> {/* Timestamp at the bottom */}
    </div>
  );
};

export default FormattedAIResponse;
