// import { db } from "../firebase/firestore";
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDocs,
//   updateDoc,
// } from "firebase/firestore";

// const coursesRef = collection(db, "courses");
// export const getAllCourses = async () => {
//   const snapshot = await getDocs(coursesRef);

//   return snapshot.docs.map(doc => ({
//     id: doc.id,
//     ...doc.data()
//   }));
// };
// export const addCourse = async course => {
//   await addDoc(coursesRef, course);
// };
// export const updateCourse = async (id, data) => {
//   const ref = doc(db, "courses", id);
//   await updateDoc(ref, data);
// };
// export const deleteCourse = async id => {
//   const ref = doc(db, "courses", id);
//   await deleteDoc(ref);
// };
import { db } from "../firebase/firestore";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  updateDoc,
} from "firebase/firestore";

const coursesRef = collection(db, "courses");

export const getAllCourses = async () => {
  const snapshot = await getDocs(coursesRef);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

export const getCourseById = async (id) => {
  const snap = await getDoc(doc(db, "courses", id));
  if (!snap.exists()) {
    throw new Error("Course not found");
  }
  return { id: snap.id, ...snap.data() };
};

export const addCourse = async (course) => {
  await addDoc(coursesRef, course);
};

export const updateCourse = async (id, data) => {
  const ref = doc(db, "courses", id);
  await updateDoc(ref, data);
};

export const deleteCourse = async (id) => {
  const ref = doc(db, "courses", id);
  await deleteDoc(ref);
  await getAllCourses();
};
