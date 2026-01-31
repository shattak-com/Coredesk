import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Courses from "./Pages/Courses";
import Home from "./Pages/Home";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
