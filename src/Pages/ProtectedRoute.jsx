import React from "react";
import { Navigate } from "react-router-dom";
import { isAdminAuthenticated } from "../firebase/auth";

const ProtectedRoute = ({ children }) => {
    if (!isAdminAuthenticated()) {
        console.log("Hello")
        return <Navigate to="/admin-login" replace />;
    }

    return children;
};

export default ProtectedRoute;
