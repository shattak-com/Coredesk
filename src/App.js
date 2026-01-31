import React from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import Courses from "./Pages/Courses";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/courses" element={<Courses />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
