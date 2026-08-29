import React, { useState } from 'react';
import { Calendar, CheckCircle, Clock, XCircle, ChevronRight, Trash2 } from 'lucide-react';
import { EmailViewerModal } from './EmailViewerModal';

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

interface EmailTableProps {
  emails: Email[];
  type: 'scheduled' | 'sent';
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export const EmailTable: React.FC<EmailTableProps> = ({ emails, type, isLoading, onDelete }) => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-900 rounded-xl border border-gray-800 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-gray-900 rounded-xl border border-gray-800 shadow-sm border-dashed">
        <p className="text-gray-400 font-medium">No emails found</p>
        <p className="text-sm text-gray-500 mt-1">Get started by scheduling a new email.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-900 shadow-sm rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {type === 'scheduled' ? 'Scheduled For' : 'Sent At'}
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {emails.map((email) => (
                <tr 
                  key={email.id} 
                  onClick={() => setSelectedEmail(email)}
                  className="hover:bg-gray-800/70 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 font-medium">{email.recipient}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    {email.subject.length > 40 ? email.subject.substring(0, 40) + '...' : email.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center space-x-1 border ${
                      email.status === 'SCHEDULED' ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' : 
                      email.status === 'SENT' ? 'bg-green-900/30 text-green-400 border-green-800/50' : 
                      'bg-red-900/30 text-red-400 border-red-800/50'
                    }`}>
                      {email.status === 'SCHEDULED' && <Clock className="w-3 h-3 mr-1" />}
                      {email.status === 'SENT' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {email.status === 'FAILED' && <XCircle className="w-3 h-3 mr-1" />}
                      {email.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    {new Date(email.scheduledTime || email.sentAt || email.createdAt!).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2 items-center">
                    {onDelete && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(email.id); }}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                        title="Delete email"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-brand-500 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EmailViewerModal 
        email={selectedEmail} 
        onClose={() => setSelectedEmail(null)} 
      />
    </>
  );
};
