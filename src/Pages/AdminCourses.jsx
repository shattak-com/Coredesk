import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllCourses } from "../services/courses.services";
import "./AdminCourses.css";

/* ---------- helpers ---------- */
const formatINR = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n)
    : n;

const uniq = (arr) => Array.from(new Set(arr.filter(Boolean))).sort();
const toCategoryArray = (raw) => {
  if (Array.isArray(raw)) {
    return raw.filter((x) => typeof x === "string" && x.trim() !== "");
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    return s ? [s] : [];
  }
  return [];
};

/** Returns the first category (primary) or "" if none */
const primaryCategoryOf = (categoryArray) =>
  Array.isArray(categoryArray) && categoryArray.length > 0
    ? categoryArray[0]
    : "";

/* ---------- Component ---------- */
const AdminCourses = () => {
  const navigate = useNavigate();

  // data
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters (keep current UX)
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await getAllCourses();
        if (!mounted) return;

        // ✅ Normalize: title, status, etc., and category → string[]
        const normalized = (data || []).map((c) => {
          const categoryArray = toCategoryArray(c?.category);
          return {
            ...c,
            title: c?.title || "",
            category: categoryArray, // <-- always array
            status: c?.status || "Draft",
            level: c?.level || "",
            mode: c?.mode || "",
            subtitle: c?.subtitle || "",
            summary: c?.summary || "",
          };
        });

        // Published first, then by title
        const sorted = normalized.sort((a, b) => {
          const ap = (a.status || "").toLowerCase() === "published";
          const bp = (b.status || "").toLowerCase() === "published";
          if (ap !== bp) return ap ? -1 : 1;
          return a.title.localeCompare(b.title);
        });

        setCourses(sorted);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Failed to load courses");
      } finally {
        setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // Build category filter options (using "primary" category so we don't change your UX)
  // If a course has multiple categories, the first one acts as its "primary" for this filter.
  const categories = useMemo(() => {
    const primaryValues = courses.map((c) => primaryCategoryOf(c.category));
    return ["All", ...uniq(primaryValues)];
  }, [courses]);

  const statuses = useMemo(
    () => ["All", ...uniq(courses.map((c) => c.status || "Draft"))],
    [courses],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return courses.filter((c) => {
      // Single-select category filter on primary category (backwards compatible)
      const primaryCat = primaryCategoryOf(c.category);
      if (category !== "All" && primaryCat !== category) return false;

      if (status !== "All" && (c.status || "Draft") !== status) return false;

      if (!term) return true;

      // Search across all categories (joined), plus your existing fields
      const allCatsJoined = (c.category || []).join(" ");

      const hay = [
        c.title,
        c.subtitle,
        allCatsJoined,
        c.status,
        c.level,
        c.mode,
        c.summary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(term);
    });
  }, [courses, category, status, q]);

  return (
    <div className=" ac-root">
      {/* Main */}
      <main
        className="content ac-content"
        role="main"
        aria-label="Admin courses"
      >
        <header className="ac-header">
          <h1 className="ac-title">All Course</h1>
          <div className="ac-filters">
            {/* Category filter (single-select, keeps your UX) */}
            <div className="ac-filter">
              <label>Filter : category</label>
              <select
                className="ac-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="ac-filter">
              <label>Filter : publish</label>
              <select
                className="ac-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="ac-filter ac-filter-search">
              <label>search – (deprioritized)</label>
              <input
                className="ac-input"
                placeholder="Search title/category/status…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </header>

        {err ? (
          <div className="banner error">
            <span>⚠️ {err}</span>
            <button
              className="btn btn-ghost"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : null}

        <section className="ac-list">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div className="ac-row skeleton" key={i}>
                <div className="sk-line title" />
                <div className="sk-chip" />
                <div className="sk-chip" />
                <div className="sk-buttons" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <img
                alt="No courses"
                src="https://illustrations.popsy.co/gray/customer-support.svg"
              />
              <h3>No courses match the filters</h3>
              <p className="muted">
                Try clearing the search or changing filters.
              </p>
            </div>
          ) : (
            filtered.map((c) => (
              <div className="ac-row" key={c.id}>
                <div className="ac-title-wrap">
                  <div className="ac-course-title" title={c.title}>
                    {c.title || "Untitled course"}
                  </div>
                  {typeof c.price === "number" ? (
                    <div className="ac-sub muted">{formatINR(c.price)}</div>
                  ) : null}
                </div>

                <div className="ac-meta">
                  <span
                    className={
                      "ac-badge ac-status " +
                      ((c.status || "Draft").toLowerCase() === "published"
                        ? "published"
                        : "draft")
                    }
                  >
                    {c.status || "Draft"}
                  </span>

                  {/* ✅ Show ALL categories as chips */}
                  {Array.isArray(c.category) && c.category.length > 0 ? (
                    <span className="ac-badges-wrap">
                      {c.category.map((cat) => (
                        <span key={cat} className="ac-badge ac-category">
                          {cat}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </div>

                <div className="ac-actions">
                  <Link
                    to={`/admin/courses/${c.id}`}
                    className="ac-btn ac-btn-dark"
                  >
                    View
                  </Link>
                  <Link
                    to={`/admin/courses/${c.id}/edit`}
                    className="ac-btn ac-btn-dark"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminCourses;
