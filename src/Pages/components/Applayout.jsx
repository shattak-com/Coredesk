import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./Applayout.css";

const AppLayout = ({ courses = [], loading = false, err = "" }) => {
  const [open, setOpen] = useState(true); // sidebar toggle for small screens

  return (
    <div className={`app-shell ${open ? "sidebar-open" : "sidebar-closed"}`}>
      <Sidebar open={open} onToggle={() => setOpen((s) => !s)} />
      <main className="app-content">
        {/* You can pass shared props to nested pages using context or props drilling */}
        <Outlet context={{ courses, loading, err }} />
      </main>
    </div>
  );
};

export default AppLayout;