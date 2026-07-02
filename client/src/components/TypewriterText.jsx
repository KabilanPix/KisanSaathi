import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function TypewriterText({ text, speed = 15, chunkSize = 4, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset when text changes completely (not just appending)
  useEffect(() => {
    if (!text || text.length === 0) {
      setDisplayedText('');
      setCurrentIndex(0);
    }
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        const nextIndex = Math.min(currentIndex + chunkSize, text.length);
        setDisplayedText(text.substring(0, nextIndex));
        setCurrentIndex(nextIndex);
      }, speed);
      
      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && text.length > 0) {
      if (onComplete) onComplete();
    }
  }, [currentIndex, text, speed, chunkSize, onComplete]);

  // If text is immediately updated to full length (e.g., historical messages), we might want a prop for that. 
  // But usually, we only use TypewriterText for the latest message.
  
  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm, remarkMath]} 
      rehypePlugins={[rehypeKatex]}
    >
      {displayedText}
    </ReactMarkdown>
  );
}
