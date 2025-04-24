import React, { useState, useRef } from 'react';
import { IoSend } from 'react-icons/io5';

const ChatInput = ({ onSend }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
      inputRef.current?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-3 bg-white">
      <div className="flex items-center rounded-full border px-3 py-1 bg-gray-50">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 py-2 px-3 bg-transparent outline-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          ref={inputRef}
        />
        
        <button 
          type="submit" 
          className="p-2 bg-blue-600 text-white rounded-full disabled:opacity-50"
          disabled={!message.trim()}
          aria-label="Send message"
        >
          <IoSend size={18} />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
