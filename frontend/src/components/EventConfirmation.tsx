import React from 'react';

interface EventConfirmationProps {
  event: any;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: (event: any) => void;
}

export default function EventConfirmation({ event, onConfirm, onCancel, onEdit }: EventConfirmationProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Confirm Event</h3>
        
        <div className="space-y-2 mb-4">
          <p><strong>Title:</strong> {event.title}</p>
          <p><strong>Start:</strong> {new Date(event.start).toLocaleString()}</p>
          <p><strong>End:</strong> {new Date(event.end).toLocaleString()}</p>
          {event.location && <p><strong>Location:</strong> {event.location}</p>}
          {event.description && <p><strong>Description:</strong> {event.description}</p>}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onEdit(event)}
            className="flex-1 px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50"
          >
            Edit
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
