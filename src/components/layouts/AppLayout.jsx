import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[#FAFFCA]/30">
      {/* Header with Navigation */}
      <Header />

      {/* Main Content Area - Full Width */}
      <main className="flex-1 overflow-y-auto bg-[#FAFFCA]/30 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
