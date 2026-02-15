import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../firebase/auth";

const AdminLogin = () => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loginAdmin(password)) {
            navigate("/admin");
        } else {
            setError("Incorrect password");
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.card}>
                <h2>Admin Access</h2>

                <input
                    type="password"
                    placeholder="Enter Admin Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                />

                {error && <p style={{ color: "red" }}>{error}</p>}

                <button type="submit" style={styles.button}>
                    Enter
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f7fa",
    },
    card: {
        background: "#fff",
        padding: "40px",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        width: "320px",
    },
    input: {
        padding: "10px",
        borderRadius: "6px",
        border: "1px solid #ddd",
    },
    button: {
        padding: "10px",
        borderRadius: "6px",
        border: "none",
        background: "#2563eb",
        color: "#fff",
        cursor: "pointer",
    },
};

export default AdminLogin;
