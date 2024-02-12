import React from 'react';
import Sidebar from './sidebar'; // Assuming Sidebar.js is in the same directory

function Dashboard() {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar Component */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 p-10">
          <h1 className="text-2xl font-semibold">Welcome to Your Cinema.fi Dashboard</h1>
          {/* Dashboard content goes here */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;