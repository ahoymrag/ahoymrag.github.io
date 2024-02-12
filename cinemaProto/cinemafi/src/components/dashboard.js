import React from 'react';



function Dashboard() {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Sidebar Placeholder */}
        <div className="w-64 h-screen bg-gray-800"></div>
        
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
