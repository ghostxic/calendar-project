import React from 'react';

interface EventConfirmationProps {
  event: any;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit: (event: any) => void;
}

export default function EventConfirmation({ event, onConfirm, onCancel, onEdit }: EventConfirmationProps) {
  console.log('EventConfirmation component rendering with event:', event);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border-2 border-gray-300">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm Event</h3>
        
        <div className="space-y-3 mb-6">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-800"><strong className="text-blue-600">Title:</strong> <span className="text-gray-900">{event.title}</span></p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-800"><strong className="text-blue-600">Start:</strong> <span className="text-gray-900">{new Date(event.start).toLocaleString()}</span></p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-gray-800"><strong className="text-blue-600">End:</strong> <span className="text-gray-900">{new Date(event.end).toLocaleString()}</span></p>
          </div>
          {event.location && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-800"><strong className="text-blue-600">Location:</strong> <span className="text-gray-900">{event.location}</span></p>
            </div>
          )}
          {event.description && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-800"><strong className="text-blue-600">Description:</strong> <span className="text-gray-900">{event.description}</span></p>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => onEdit(event)}
            className="flex-1 px-4 py-3 border-2 border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 font-semibold"
          >
            Edit
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
