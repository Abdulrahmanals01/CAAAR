import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const ChatMessage = ({ message, isCurrentUser }) => {
  const formattedTime = message.created_at
    ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
    : '';

  return (
    <div className={`flex w-full mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
        isCurrentUser
          ? 'bg-blue-600 text-white rounded-br-none'
          : 'bg-gray-200 text-gray-800 rounded-bl-none'
      }`}>
        <div className="flex items-center gap-1 mb-1">
          {!isCurrentUser && (
            <span className="text-xs font-semibold">
              {message.sender_name || 'Other User'}
            </span>
          )}
        </div>
        <div className="text-sm break-words">{message.message}</div>
        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
          {formattedTime}
          {isCurrentUser && message.read && (
            <span className="ml-2">✓</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
