import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import { logoutAdmin } from "../../firebase/auth";

const Sidebar = ({ open, onToggle }) => {
  const navigate = useNavigate();

  return (
    <aside className={`sidebar2 ${open ? "open" : "collapsed"}`}>
      <button className="sb-burger" onClick={onToggle} aria-label="Toggle menu">
        ☰
      </button>

      <div className="sb-header">
        <div className="brand2" onClick={() => navigate("/")}>
          <img className="logo-square2" aria-hidden src="https://firebasestorage.googleapis.com/v0/b/shattak-prod.firebasestorage.app/o/Shattak_logo_dark.png?alt=media&token=7609d196-b953-47aa-a498-bc3f4440a0b1" />
          {/* <span className="logo-square2" aria-hidden /> */}
          <div className="brand2-text">
            <h1 className="brand2-title">CoreDesk</h1>
            <p className="brand2-sub">For Shattak</p>
          </div>
        </div>
      </div>

      <nav className="sb-nav">
        <NavLink end to="/admin" className="sb-link">
          <span className="sb-ico">🏠</span>
          <span className="sb-text">Overview</span>
        </NavLink>

        <NavLink to="/admin/courses" className="sb-link">
          <span className="sb-ico">📚</span>
          <span className="sb-text">All Courses</span>
        </NavLink>

        <NavLink to="/admin/courses/add" className="sb-link">
          <span className="sb-ico">➕</span>
          <span className="sb-text">Add Course</span>
        </NavLink>

        <NavLink to="/admin/coupons" className="sb-link">
          <span className="sb-ico">🏷️</span>
          <span className="sb-text">Coupons</span>
        </NavLink>

        <NavLink to="/admin/students" className="sb-link">
          <span className="sb-ico">👥</span>
          <span className="sb-text">Students</span>
        </NavLink>
      </nav>

      <div className="sb-footer">
        <button className="sb-logout" onClick={() => {
          logoutAdmin();
          window.location.href = "/admin-login";
        }}>Logout</button>
      </div>
    </aside>
  );
};

export default Sidebar;
