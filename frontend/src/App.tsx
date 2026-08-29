import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Login } from './components/Auth/GoogleLogin';
import { Header } from './components/Dashboard/Header';
import { EmailTable } from './components/Dashboard/EmailTable';
import { ComposeModal } from './components/Dashboard/ComposeModal';
import { getScheduledEmails, getSentEmails, searchEmails, deleteEmail } from './services/api';
import { Plus, Search } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [scheduled, setScheduled] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const s = await getScheduledEmails(user.id);
      const done = await getSentEmails(user.id);
      setScheduled(s);
      setSent(done);
    } catch (error) {
      console.error('Failed to fetch data');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 2) {
      const res = await searchEmails(q);
      setSearchResults(res);
    } else {
      setSearchResults([]);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this email?')) {
      try {
        await deleteEmail(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete email', error);
        alert('Failed to delete email');
      }
    }
  };



  const displayedEmails = searchQuery.length > 2 ? searchResults : (activeTab === 'scheduled' ? scheduled : sent);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex space-x-1 p-1 bg-gray-900 border border-gray-800 rounded-lg">
            <button
              onClick={() => { setActiveTab('scheduled'); setSearchQuery(''); }}
              className={`px-6 py-2 rounded-md text-sm font-medium transition ${activeTab === 'scheduled' ? 'bg-gray-800 text-white shadow border border-gray-700' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Scheduled
            </button>
            <button
              onClick={() => { setActiveTab('sent'); setSearchQuery(''); }}
              className={`px-6 py-2 rounded-md text-sm font-medium transition ${activeTab === 'sent' ? 'bg-gray-800 text-white shadow border border-gray-700' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Sent / Failed
            </button>
          </div>

          <div className="flex space-x-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search emails (Elasticsearch)..."
                className="pl-10 w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition text-sm text-gray-200 placeholder-gray-500 shadow-sm"
              />
            </div>
            
            <button
              onClick={() => setIsComposeOpen(true)}
              className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-500 transition flex items-center whitespace-nowrap shadow-sm border border-transparent"
            >
              <Plus className="w-4 h-4 mr-2" />
              Compose New
            </button>
          </div>
        </div>

        <EmailTable
          emails={displayedEmails}
          type={searchQuery.length > 2 ? 'sent' : activeTab}
          isLoading={loading}
          onDelete={handleDelete}
        />
      </main>

      {user && (
        <ComposeModal
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)}
          userId={user.id}
          senderEmail={user.email}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
