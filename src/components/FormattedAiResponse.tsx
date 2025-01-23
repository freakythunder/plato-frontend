import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import styles from '../Styles/ChatInterface.module.css';
import { ComponentPropsWithoutRef } from 'react';
import MarkdownIt from 'markdown-it';

const mdParser = new MarkdownIt();

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

  return (
    <div className={styles.aiResponseContainer}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
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
        {lastValidMarkdown}
      </ReactMarkdown>
      <div className={styles.timestamp}>{formattedTimestamp}</div>
    </div>
  );
};

export default FormattedAIResponse;