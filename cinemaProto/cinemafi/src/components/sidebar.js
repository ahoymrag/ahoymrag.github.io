import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="w-64 h-full shadow-md bg-white px-1">
      <ul className="space-y-2">
        <li><NavLink to="/browse-projects" activeClassName="text-blue-500">Browse New Projects</NavLink></li>
        <li><NavLink to="/existing-projects" activeClassName="text-blue-500">Check Existing Projects</NavLink></li>
        <li><NavLink to="/existing-assets" activeClassName="text-blue-500">Check Existing Assets</NavLink></li>
        <li><NavLink to="/collect-money" activeClassName="text-blue-500">Collect Money</NavLink></li>
        <li><NavLink to="/watch-films" activeClassName="text-blue-500">Watch Films</NavLink></li>
        <li><NavLink to="/share-films" activeClassName="text-blue-500">Share Films</NavLink></li>
        <li><NavLink to="/latest-news" activeClassName="text-blue-500">Read the Latest of Cinema.fi</NavLink></li>
        <li><NavLink to="/financial-tools" activeClassName="text-blue-500">Financial Tools</NavLink></li>
        <li><NavLink to="/projection-tools" activeClassName="text-blue-500">Projection Tools</NavLink></li>
      </ul>
    </div>
  );
};

export default Sidebar;
