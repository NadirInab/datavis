import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Edit3, Trash2, Send } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Annotation Component
 * Individual sticky note annotation
 */
const Annotation = ({ 
  annotation, 
  onRemove, 
  onEdit, 
  canEdit = false,
  isVisible = true 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(annotation.text);

  if (!isVisible) return null;

  const handleSave = () => {
    if (editText.trim() && editText !== annotation.text) {
      onEdit(annotation.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(annotation.text);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="absolute z-30"
      style={{
        left: annotation.position.x,
        top: annotation.position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-lg border-l-4 p-3 max-w-xs min-w-48"
        style={{ borderLeftColor: annotation.author.color }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: annotation.author.color }}
            ></div>
            <span className="text-xs font-medium text-gray-600">
              {annotation.author.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {canEdit && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
            )}
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(annotation.id)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
            {!canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(annotation.id)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 text-sm border border-gray-200 rounded resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Add your note..."
              autoFocus
            />
            <div className="flex justify-end space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-gray-500"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={!editText.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-700 mb-2">{annotation.text}</p>
            <p className="text-xs text-gray-400">
              {new Date(annotation.createdAt).toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Pointer */}
        <div 
          className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"
        ></div>
      </div>
    </motion.div>
  );
};

/**
 * Annotation Creator
 * Interface for creating new annotations
 */
const AnnotationCreator = ({ 
  position, 
  onSave, 
  onCancel,
  chartId 
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSave = () => {
    if (text.trim()) {
      onSave(chartId, position, text.trim());
      setText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute z-40"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="bg-white rounded-lg shadow-lg border-2 border-primary-200 p-3 max-w-xs min-w-48">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">Add Note</span>
          </div>
          
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full p-2 text-sm border border-gray-200 rounded resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={3}
            placeholder="Add your note... (Enter to save, Esc to cancel)"
          />
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-500"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!text.trim()}
              icon={Send}
            >
              Add Note
            </Button>
          </div>
        </div>

        {/* Pointer */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
      </div>
    </motion.div>
  );
};

/**
 * Annotation System Manager
 * Manages all annotations for a chart
 */
const AnnotationSystem = ({ 
  chartId,
  annotations = [],
  onAddAnnotation,
  onRemoveAnnotation,
  onEditAnnotation,
  currentUserId,
  isVisible = true,
  onDoubleClick
}) => {
  const [creatingAnnotation, setCreatingAnnotation] = useState(null);

  const handleDoubleClick = (e) => {
    if (!onAddAnnotation) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setCreatingAnnotation(position);
    onDoubleClick?.(e);
  };

  const handleSaveAnnotation = (chartId, position, text) => {
    onAddAnnotation(chartId, position, text);
    setCreatingAnnotation(null);
  };

  const handleCancelAnnotation = () => {
    setCreatingAnnotation(null);
  };

  const chartAnnotations = annotations.filter(a => a.chartId === chartId);

  return (
    <div 
      className="relative w-full h-full"
      onDoubleClick={handleDoubleClick}
    >
      {/* Existing Annotations */}
      <AnimatePresence>
        {chartAnnotations.map((annotation) => (
          <Annotation
            key={annotation.id}
            annotation={annotation}
            onRemove={onRemoveAnnotation}
            onEdit={onEditAnnotation}
            canEdit={annotation.author.id === currentUserId}
            isVisible={isVisible}
          />
        ))}
      </AnimatePresence>

      {/* Annotation Creator */}
      <AnimatePresence>
        {creatingAnnotation && (
          <AnnotationCreator
            position={creatingAnnotation}
            chartId={chartId}
            onSave={handleSaveAnnotation}
            onCancel={handleCancelAnnotation}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnotationSystem;
