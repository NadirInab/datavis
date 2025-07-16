import React from 'react';
import { motion } from 'framer-motion';

/**
 * Collaborative Cursor Component
 * Shows other users' cursors in real-time
 */
const CollaborativeCursor = ({ 
  userId, 
  userName, 
  userColor, 
  position, 
  isActive = true 
}) => {
  if (!position || !isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: position.x,
        y: position.y
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        opacity: { duration: 0.2 }
      }}
      className="fixed pointer-events-none z-50"
      style={{ 
        left: 0, 
        top: 0,
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    >
      {/* Cursor Arrow */}
      <div className="relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="drop-shadow-sm"
        >
          <path
            d="M2 2L18 8L8 12L2 18V2Z"
            fill={userColor}
            stroke="white"
            strokeWidth="1"
          />
        </svg>
        
        {/* User Name Label */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="absolute top-5 left-2 whitespace-nowrap"
        >
          <div 
            className="px-2 py-1 rounded-md text-white text-xs font-medium shadow-lg"
            style={{ backgroundColor: userColor }}
          >
            {userName || 'Anonymous'}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

/**
 * Cursor Manager Component
 * Manages multiple collaborative cursors
 */
export const CursorManager = ({ cursors, collaborators }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {Array.from(cursors.entries()).map(([userId, cursorData]) => {
        const user = collaborators.find(c => c.id === userId);
        if (!user || !cursorData.cursor) return null;

        return (
          <CollaborativeCursor
            key={userId}
            userId={userId}
            userName={user.name}
            userColor={user.color}
            position={cursorData.cursor}
            isActive={true}
          />
        );
      })}
    </div>
  );
};

export default CollaborativeCursor;
