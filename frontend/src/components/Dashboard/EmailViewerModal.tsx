import React from 'react';
import { X, Calendar, User, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Email {
  id: string;
  subject: string;
  recipient: string;
  body: string;
  scheduledTime?: string;
  sentAt?: string;
  createdAt?: string;
  status: string;
}

interface EmailViewerModalProps {
  email: Email | null;
  onClose: () => void;
}

export const EmailViewerModal: React.FC<EmailViewerModalProps> = ({ email, onClose }) => {
  if (!email) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950 bg-opacity-75 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-start p-6 border-b border-gray-800 bg-gray-800/20 rounded-t-xl">
          <div className="pr-8">
            <h2 className="text-xl font-bold text-gray-100">{email.subject}</h2>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center text-sm text-gray-400 gap-2 sm:gap-6">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1.5 text-gray-500" />
                To: {email.recipient}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-gray-500" />
                {new Date(email.scheduledTime || email.sentAt || email.createdAt!).toLocaleString()}
              </span>
              <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full items-center space-x-1 border ${
                email.status === 'SCHEDULED' ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' : 
                email.status === 'SENT' ? 'bg-green-900/30 text-green-400 border-green-800/50' : 
                'bg-red-900/30 text-red-400 border-red-800/50'
              }`}>
                {email.status === 'SCHEDULED' && <Clock className="w-3 h-3 mr-1" />}
                {email.status === 'SENT' && <CheckCircle className="w-3 h-3 mr-1" />}
                {email.status === 'FAILED' && <XCircle className="w-3 h-3 mr-1" />}
                {email.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition shrink-0 p-1 bg-gray-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-900 text-gray-300 whitespace-pre-wrap leading-relaxed border-t border-gray-800/50">
          {email.body}
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-end bg-gray-950 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 focus:outline-none transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
