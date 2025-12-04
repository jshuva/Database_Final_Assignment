import React, { useState } from 'react';
import TableViewer from './components/TableViewer';
import AddSoftwareForm from './components/AddSoftwareForm';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import UserManagement from './components/UserManagement';
import ReviewManagement from './components/ReviewManagement';

function App() {
    const [activeTab, setActiveTab] = useState('overview');
    const [softwareRefreshTrigger, setSoftwareRefreshTrigger] = useState(0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
                <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between flex-shrink-0">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                            Software Review <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">System</span>
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg font-medium">Manage and analyze software performance metrics</p>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <div className="flex space-x-1 bg-white/50 p-1 rounded-xl mb-6 w-fit border border-gray-200 shadow-sm flex-shrink-0">
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" />
                    <TabButton active={activeTab === 'software'} onClick={() => setActiveTab('software')} label="Software" />
                    <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} label="Reviews" />
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Users" />
                    <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} label="Raw Data" />
                </div>

                <main className="flex-1 overflow-hidden">
                    {activeTab === 'overview' && (
                        <div className="h-full overflow-auto custom-scrollbar pb-4">
                            <AnalyticsDashboard />
                        </div>
                    )}

                    {activeTab === 'software' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full overflow-hidden">
                            <div className="lg:col-span-4 h-full overflow-auto custom-scrollbar pb-4">
                                <AddSoftwareForm onSuccess={() => setSoftwareRefreshTrigger(prev => prev + 1)} />
                            </div>
                            <div className="lg:col-span-8 h-full overflow-hidden">
                                <TableViewer
                                    allowedTables={['SoftwareSystem', 'Brand', 'ProductType']}
                                    refreshTrigger={softwareRefreshTrigger}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="h-full overflow-hidden">
                            <ReviewManagement />
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="h-full overflow-hidden">
                            <UserManagement />
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="h-full overflow-hidden">
                            <TableViewer />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

const TabButton = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
            ? 'bg-white text-indigo-600 shadow-md'
            : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
            } `}
    >
        {label}
    </button>
);

export default App;
