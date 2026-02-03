// import { useEffect, useState } from "react";
// import { getAllCourses } from "../services/courses.services";

// const Courses = () => {
//   const [courses, setCourses] = useState([]);

//   useEffect(() => {
//     getAllCourses().then(setCourses);
//   }, []);
//   const show = () => {
//     console.log(courses);
//   }
//   return (
//     <div style={{ padding: "30px" }}>
//       <h2 onClick={show}>Courses</h2>
//       {courses.map(course => (
//         <div key={course.id}>
//           <h4>{course.title}</h4>
//           <h4>{course.id}</h4>
//           <p>₹{course.price}</p>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default Courses;

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllCourses } from "../services/courses.services";
import "./Courses.css";

const formatINR = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n)
    : n;

const formatDuration = (h = 0, m = 0) => {
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return parts.length ? parts.join(" ") : "—";
};

const SkeletonCard = () => (
  <div className="course-card skeleton">
    <div className="course-img" />
    <div className="course-body">
      <div className="skeleton-line title" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
      <div className="course-meta">
        <div className="skeleton-chip" />
        <div className="skeleton-chip" />
        <div className="skeleton-chip" />
      </div>
      <div className="course-footer">
        <div className="skeleton-price" />
        <div className="skeleton-btns" />
      </div>
    </div>
  </div>
);

const Courses = ({ courses }) => {
  const [q, setQ] = useState("");
 

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return courses;
    return courses.filter((c) => {
      const s = [
        c.title,
        c.subtitle,
        c.category,
        c.level,
        c.mode,
        c.summary,
        c.about,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return s.includes(t);
    });
  }, [courses, q]);

  return (
    <div className="courses-page">
      <header className="courses-header">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">Browse live and self‑paced programs</p>
        </div>
        <div className="search-wrap">
          <input
            className="search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, category, level…"
            aria-label="Search courses"
          />
        </div>
      </header>

      {false && (
        <div className="banner error">
          <span>⚠️ </span>
          <button
            className="btn btn-ghost"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {false ? (
        <div className="courses-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <img
            alt="No results"
            src="https://illustrations.popsy.co/gray/customer-support.svg"
          />
          <h3>No courses found</h3>
          <p>Try clearing the search or check back later.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Courses;

/** --- Inline CourseCard for convenience; move to components/CourseCard.jsx if you like --- */
const StarRating = ({ value = 0, size = 14 }) => {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const stars = Array.from({ length: 5 }).map((_, i) => {
    if (i < full) return "full";
    if (i === full && half) return "half";
    return "empty";
  });
  return (
    <div className="stars" style={{ fontSize: size }}>
      {stars.map((s, i) => (
        <span key={i} className={`star ${s}`} aria-hidden>
          ★
        </span>
      ))}
      <span className="rating-text">
        {value?.toFixed ? value.toFixed(1) : value}
      </span>
    </div>
  );
};

export const CourseCard = ({ course }) => {
  const {
    id,
    title,
    summary,
    about,
    category,
    level,
    mode,
    status,
    rating,
    enrollmentCount,
    durationHours,
    durationMinutes,
    price,
    originalPrice,
    liveUrl,
    thumbnailImage,
    promoImage,
  } = course;

  const img =
    (thumbnailImage && thumbnailImage.trim()) ||
    (promoImage && promoImage.trim()) ||
    "/images/courses/course-1.svg"; // fallback (ensure exists in public/)

  const hasDiscount =
    typeof price === "number" &&
    typeof originalPrice === "number" &&
    originalPrice > price;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <article className="course-card">
      <div className="course-img-wrap">
        <img src={img} alt={title} className="course-img" loading="lazy" />
        {status && (
          <span className={`badge status ${status.toLowerCase()}`}>
            {status}
          </span>
        )}
        {mode && <span className="badge mode">{mode}</span>}
        {level && <span className="badge level">{level}</span>}
      </div>

      <div className="course-body">
        <h3 className="course-title" title={title}>
          {title}
        </h3>
        <p className="course-summary">
          {(summary || about || "").slice(0, 120)}
          {(summary || about || "").length > 120 ? "…" : ""}
        </p>

        <div className="course-meta">
          {category ? <span className="chip">{category}</span> : null}
          <span className="chip">
            {formatDuration(durationHours, durationMinutes)}
          </span>
          <span className="chip">
            {enrollmentCount
              ? `${enrollmentCount.toLocaleString()} enrolled`
              : "New"}
          </span>
        </div>

        <div className="course-footer">
          <div className="price-wrap">
            <span className="price">
              {typeof price === "number" ? formatINR(price) : price}
            </span>
            {hasDiscount && (
              <>
                <span className="mrp">{formatINR(originalPrice)}</span>
                <span className="discount">-{discountPct}%</span>
              </>
            )}
          </div>

          <div className="btn-row">
            {liveUrl ? (
              <a
                href={liveUrl}
                className="btn btn-primary"
                target="_blank"
                rel="noreferrer"
              >
                Live class
              </a>
            ) : null}
            <Link className="btn btn-secondary" to={`/courses/${id}`}>
              Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};
