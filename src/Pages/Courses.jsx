import { useEffect, useState } from "react";
import { getAllCourses } from "../services/courses.services";

const Courses = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    getAllCourses().then(setCourses);
  }, []);
  const show = () => {
    console.log(courses);
  }
  return (
    <div style={{ padding: "30px" }}>
      <h2 onClick={show}>Courses</h2>
      {courses.map(course => (
        <div key={course.id}>
          <h4>{course.title}</h4>
          <p>₹{course.tone}</p>
        </div>
      ))}
    </div>
  );
};

export default Courses;
