import React from "react";
import { Link } from "react-router-dom";

const formatINR = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
    : n;

const formatDuration = (h = 0, m = 0) => {
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return parts.length ? parts.join(" ") : "—";
};

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
      <span className="rating-text">{value?.toFixed ? value.toFixed(1) : value}</span>
    </div>
  );
};

const CourseCard = ({ course }) => {
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
    "/images/courses/course-1.svg";

  const hasDiscount =
    typeof price === "number" && typeof originalPrice === "number" && originalPrice > price;
  const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return (
    <article className="course-card">
      <div className="course-img-wrap">
        <img src={img} alt={title} className="course-img" loading="lazy" />
        {status && <span className={`badge status ${status.toLowerCase()}`}>{status}</span>}
        {mode && <span className="badge mode">{mode}</span>}
        {level && <span className="badge level">{level}</span>}
      </div>

      <div className="course-body">
        <h3 className="course-title" title={title}>{title}</h3>
        <p className="course-summary">
          {(summary || about || "").slice(0, 120)}
          {(summary || about || "").length > 120 ? "…" : ""}
        </p>

        <div className="course-meta">
          {category ? <span className="chip">{category}</span> : null}
          <span className="chip">{formatDuration(durationHours, durationMinutes)}</span>
          <span className="chip">{enrollmentCount ? `${enrollmentCount.toLocaleString()} enrolled` : "New"}</span>
        </div>

        <div className="course-footer">
          <div className="price-wrap">
            <span className="price">{typeof price === "number" ? formatINR(price) : price}</span>
            {hasDiscount && (
              <>
                <span className="mrp">{formatINR(originalPrice)}</span>
                <span className="discount">-{discountPct}%</span>
              </>
            )}
          </div>

          <div className="btn-row">
            {liveUrl ? (
              <a href={liveUrl} className="btn btn-primary" target="_blank" rel="noreferrer">
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

export default CourseCard;