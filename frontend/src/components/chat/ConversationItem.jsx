import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const ConversationItem = ({ conversation, isActive, onClick }) => {
  const formattedTime = conversation.created_at 
    ? formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })
    : '';

  return (
    <div 
      className={`flex items-center p-3 border-b cursor-pointer hover:bg-gray-50 ${
        isActive ? 'bg-blue-50' : ''
      }`}
      onClick={() => onClick(conversation)}
    >
      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mr-3">
        <span className="text-xl text-white font-medium">
          {conversation.other_user_name?.charAt(0).toUpperCase() || '?'}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="font-medium text-gray-900 truncate">
            {conversation.other_user_name || 'Unknown User'}
          </h3>
          <span className="text-xs text-gray-500">{formattedTime}</span>
        </div>
        
        <p className="text-sm text-gray-600 truncate mt-1">
          {conversation.message}
        </p>
      </div>
      
      {conversation.unread_count > 0 && (
        <div className="ml-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
          {conversation.unread_count}
        </div>
      )}
    </div>
  );
};

export default ConversationItem;
