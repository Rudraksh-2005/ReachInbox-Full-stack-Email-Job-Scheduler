import React, { useState } from 'react';
import { X, Upload, Mail } from 'lucide-react';
import Papa from 'papaparse';
import { scheduleEmails } from '../../services/api';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  senderEmail: string;
  onSuccess: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, userId, senderEmail, onSuccess }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [delay, setDelay] = useState('2000');
  const [hourlyLimit, setHourlyLimit] = useState('200');
  const [leads, setLeads] = useState<string[]>([]);
  const [singleEmail, setSingleEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          const emails = results.data
            .map((row: any) => row[0])
            .filter((email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
          setLeads(emails);
        },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalLeads = [...leads];
    if (singleEmail) {
      // Very basic validation, split by commas if they want to put multiple
      const parsedEmails = singleEmail.split(',').map(e => e.trim()).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      finalLeads.push(...parsedEmails);
    }

    if (finalLeads.length === 0) {
      setError('Please provide at least one recipient email or upload a CSV.');
      return;
    }
    if (!scheduledTime) {
      setError('Please select a scheduled time.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const emailPayloads = finalLeads.map(recipient => ({
        recipient,
        subject,
        body,
        scheduledTime,
      }));

      await scheduleEmails({
        userId,
        senderEmail,
        emails: emailPayloads,
        delayBetweenEmailsMs: parseInt(delay),
        hourlyLimit: parseInt(hourlyLimit),
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to schedule emails. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950 bg-opacity-75 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-gray-100 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-brand-500" />
            Compose Outreach
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 text-red-400 text-sm rounded-lg border border-red-800/50">
              {error}
            </div>
          )}

          <form id="compose-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-gray-200 placeholder-gray-600"
                placeholder="Exciting news from ReachInbox!"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Body (Text)</label>
              <textarea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition resize-none text-gray-200 placeholder-gray-600"
                placeholder="Hi there, I wanted to reach out about..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Recipient Email(s)</label>
                <input
                  type="text"
                  value={singleEmail}
                  onChange={(e) => setSingleEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-sm text-gray-300 placeholder-gray-600"
                  placeholder="name@example.com, ..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Or Upload Leads (CSV)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full px-4 py-2 bg-gray-950 border border-gray-800 border-dashed rounded-lg cursor-pointer hover:bg-gray-800 transition text-sm text-gray-400"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {leads.length > 0 ? `${leads.length} loaded` : 'Choose CSV'}
                  </label>
                </div>
              </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-sm text-gray-300"
                />
              </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Delay Between Emails (ms)</label>
                <input
                  type="number"
                  value={delay}
                  onChange={(e) => setDelay(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-sm text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Hourly Limit</label>
                <input
                  type="number"
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-sm text-gray-400"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-800 flex justify-end space-x-3 bg-gray-900 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 focus:outline-none transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="compose-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-lg hover:bg-brand-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Scheduling...
              </>
            ) : 'Schedule Emails'}
          </button>
        </div>
      </div>
    </div>
  );
};
