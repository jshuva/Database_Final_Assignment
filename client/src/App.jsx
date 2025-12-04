import React from 'react';
import TableViewer from './components/TableViewer';
import AddSoftwareForm from './components/AddSoftwareForm';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SoftwareList from './components/SoftwareList';

function App() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                            Software Review <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">System</span>
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg font-medium">Manage and analyze software performance metrics</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
                            System Active
                        </span>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Add Form & Analytics */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        <section>
                            <AddSoftwareForm />
                        </section>
                        <section className="h-[400px]">
                            <SoftwareList />
                        </section>
                        <section className="flex-1 min-h-[300px]">
                            <AnalyticsDashboard />
                        </section>
                    </div>

                    {/* Right Column: Table Viewer */}
                    <div className="lg:col-span-8 h-[800px] lg:h-auto lg:min-h-[800px]">
                        <TableViewer />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;
