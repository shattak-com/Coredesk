import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Your existing pages (reuse your real implementations)

import { getAllCourses } from "./services/courses.services";
import EditCourse from "./Pages/EditCourse";
import AdminCourses from "./Pages/AdminCourses";
import Dashboard from "./Pages/Dashboard";
import AppLayout from "./Pages/components/Applayout";
import AddCourse from "./Pages/AddCourse";
import CourseDetails from "./Pages/CourseDetails";
import ProtectedRoute from "./Pages/ProtectedRoute";
import AdminLogin from "./Pages/AdminLogin";

const App = () => {
  const [courses, setCourses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await getAllCourses();
        if (!mounted) return;
        const sorted = [...data].sort((a, b) => {
          const aPub = (a.status || "").toLowerCase() === "published";
          const bPub = (b.status || "").toLowerCase() === "published";
          if (aPub !== bPub) return aPub ? -1 : 1;
          return (b.rating || 0) - (a.rating || 0);
        });
        setCourses(sorted);
        console.log(data);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Failed to load courses");
      } finally {
        setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  return (

    <BrowserRouter>
      <Routes>

        {/* Login page */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Protected Admin Layout */}
        <Route
          // path="/admin"
          path="/admin"
          element={
            <ProtectedRoute>
              <AppLayout
                courses={courses ?? []}
                loading={loading}
                err={err}
              />
            </ProtectedRoute>
          }
        >

          {/* /admin */}
          <Route
            index
            element={
              <Dashboard
                courses={courses ?? []}
                loading={loading}
                err={err}
              />
            }
          />

          {/* /admin/courses */}
          <Route
            path="courses"
            element={
              <AdminCourses
                courses={courses ?? []}
                loading={loading}
                err={err}
              />
            }
          />

          {/* /admin/courses/add */}
          <Route path="courses/add" element={<AddCourse />} />

          {/* /admin/courses/:id */}
          <Route path="courses/:id" element={<CourseDetails />} />

          {/* /admin/courses/:id/edit */}
          <Route path="courses/:id/edit" element={<EditCourse />} />
        </Route>
        {/* <Route path="" element={<AdminLogin />} /> */}

      </Routes>
    </BrowserRouter>

  );
};

export default App;
