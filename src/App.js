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
        {/* Shared layout with sidebar */}
        <Route
          element={
            <AppLayout courses={courses ?? []} loading={loading} err={err} />
          }
        >
          <Route
            index
            element={
              <Dashboard courses={courses ?? []} loading={loading} err={err} />
            }
          />
          <Route path="admin">
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
            <Route path="/admin/courses/add" element={<AddCourse />} />

            <Route path="courses/:id" element={<CourseDetails />} />

            <Route path="courses/:id/edit" element={<EditCourse />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
