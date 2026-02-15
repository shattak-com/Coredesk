export const isAdminAuthenticated = () => {
    console.log(localStorage.getItem("admin-auth"));
    return localStorage.getItem("admin-auth") === "true";
};

export const loginAdmin = (password) => {
    if (password === process.env.REACT_APP_ADMIN_PASSWORD) {
        localStorage.setItem("admin-auth", "true");
        return true;
    }
    return false;
};

export const logoutAdmin = () => {
    localStorage.removeItem("admin-auth");
};
