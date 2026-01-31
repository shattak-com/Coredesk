import { db } from "../firebase/firestore";
import {
  collection,
  getDocs,
} from "firebase/firestore";

const coursesRef = collection(db, "courses");
export const getAllCourses = async () => {
  const snapshot = await getDocs(coursesRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
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
