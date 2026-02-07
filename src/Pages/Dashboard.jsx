import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = ({ courses = [], loading = false, err = "" }) => {
  const navigate = useNavigate();

  // Defensive normalization
  const data = Array.isArray(courses) ? courses : [];

  const formatINR = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(n)
      : n;

  // -------- Metrics ----------
  const metrics = useMemo(() => {
    const total = data.length;

    const publishedArr = data.filter(
      (c) => (c?.status || "").toLowerCase() === "published",
    );
    const draftsArr = data.filter(
      (c) => (c?.status || "").toLowerCase() !== "published",
    );

    const totalEnrollments = data.reduce(
      (a, c) => a + (Number(c?.enrollmentCount) || 0),
      0,
    );

    // Simple revenue proxy: price * enrollmentCount (if available)
    const revenue = data.reduce((a, c) => {
      const p = Number(c?.price) || 0;
      const n = Number(c?.enrollmentCount) || 0;
      return a + p * n;
    }, 0);

    // Top course by rating (break tie by enrollments)
    const topCourse =
      [...data]
        .filter(Boolean)
        .sort(
          (a, b) =>
            (Number(b?.rating) || 0) - (Number(a?.rating) || 0) ||
            (Number(b?.enrollmentCount) || 0) -
              (Number(a?.enrollmentCount) || 0),
        )[0] || null;

    // Recent list (use createdAt/updatedAt if you have; else just first 5)
    const recent = data.slice(0, 5);

    return {
      total,
      published: publishedArr.length,
      drafts: draftsArr.length,
      totalEnrollments,
      revenue,
      topCourse,
      recent,
    };
  }, [data]);

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div>
      {/* Sidebar */}

      {/* Main content */}
      <main className="content" role="main" aria-label="Courses page">
        {/* KPIs row */}
        <section className="tile-row">
          <div className="tile tile-sm kpi">
            <div className="kpi-icon kpi-blue" aria-hidden>
              📚
            </div>
            <div className="kpi-info">
              <div className="kpi-label">Total Courses</div>
              <div className="kpi-value">{metrics.total.toLocaleString()}</div>
            </div>
          </div>

          <div className="tile tile-sm kpi">
            <div className="kpi-icon kpi-green" aria-hidden>
              ✅
            </div>
            <div className="kpi-info">
              <div className="kpi-label">Published</div>
              <div className="kpi-value">
                {metrics.published.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="tile tile-sm kpi">
            <div className="kpi-icon kpi-orange" aria-hidden>
              📝
            </div>
            <div className="kpi-info">
              <div className="kpi-label">Drafts</div>
              <div className="kpi-value">{metrics.drafts.toLocaleString()}</div>
            </div>
          </div>

          <div className="tile tile-sm kpi">
            <div className="kpi-icon kpi-violet" aria-hidden>
              👥
            </div>
            <div className="kpi-info">
              <div className="kpi-label">Enrollments</div>
              <div className="kpi-value">
                {metrics.totalEnrollments.toLocaleString()}
              </div>
            </div>
          </div>
        </section>

        {/* Mid two medium cards */}
        <section className="cards-2">
          <article className="tile tile-md">
            <header className="tile-header">
              Sales Snapshot
              <span className="subtle"> (proxy)</span>
            </header>
            <div className="tile-body">
              <div className="sales-row">
                <div className="sales-stat">
                  <div className="label">Estimated Revenue</div>
                  <div className="value">{formatINR(metrics.revenue)}</div>
                </div>
                <div className="sales-stat">
                  <div className="label">Avg. Price</div>
                  <div className="value">
                    {(() => {
                      const paid = data.filter((c) => Number(c?.price) > 0);
                      const avg =
                        paid.reduce((a, c) => a + Number(c?.price || 0), 0) /
                        (paid.length || 1);
                      return formatINR(Math.round(avg || 0));
                    })()}
                  </div>
                </div>
              </div>

              {/* Chart placeholder (no external libs) */}
              <div
                className="chart-placeholder"
                role="img"
                aria-label="Sales chart placeholder"
              >
                {/* <div className="bar b1" />
                <div className="bar b2" />
                <div className="bar b3" />
                <div className="bar b4" />
                <div className="bar b5" /> */}
              </div>
            </div>
          </article>

          <article className="tile tile-md">
            <header className="tile-header">Top Rated</header>
            <div className="tile-body">
              {metrics.topCourse ? (
                <div className="top-course">
                  <img
                    src={
                      metrics.topCourse?.thumbnailImage?.trim?.() ||
                      metrics.topCourse?.promoImage?.trim?.() ||
                      "/images/courses/course-1.svg"
                    }
                    alt={metrics.topCourse?.title || "Top course"}
                  />
                  <div className="top-course-info">
                    <h4 title={metrics.topCourse?.title}>
                      {metrics.topCourse?.title}
                    </h4>
                    <div className="chips">
                      {metrics.topCourse?.categories && (
                        <span className="chip">
                          {metrics.topCourse.categories}
                        </span>
                      )}
                      {metrics.topCourse?.level && (
                        <span className="chip">{metrics.topCourse.level}</span>
                      )}
                      {metrics.topCourse?.mode && (
                        <span className="chip">{metrics.topCourse.mode}</span>
                      )}
                    </div>
                    <div className="meta">
                      ⭐ {Number(metrics.topCourse?.rating || 0).toFixed(1)} •{" "}
                      {Number(
                        metrics.topCourse?.enrollmentCount || 0,
                      ).toLocaleString()}{" "}
                      enrolled
                    </div>
                  </div>
                </div>
              ) : (
                <p className="muted">No courses yet.</p>
              )}
            </div>
          </article>
        </section>

        {/* Bottom wide card */}
        <section className="cards-1">
          <article className="tile tile-lg">
            <header className="tile-header">
              Recent Courses
              <span className="count">{metrics.recent.length}</span>
            </header>
            <div className="tile-body">
              {err && (
                <div className="banner error">
                  <span>⚠️ {err}</span>
                  <button
                    className="btn btn-ghost"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="recent-table">
                <div className="thead">
                  <div>Course</div>
                  <div>Status</div>
                  {/* <div>Price</div> */}
                  <div>Course ID</div>
                  <div>Enrollments</div>
                  <div>Rating</div>
                </div>
                <div className="tbody">
                  {metrics.recent.map((c, i) => (
                    <div className="trow" key={c?.id || i}>
                      <div className="cell course">
                        <img
                          src={
                            // c?.thumbnailImage?.trim?.() ||
                            c?.promoImage?.trim?.() ||
                            "/images/courses/course-1.svg"
                          }
                          alt={c?.title || "Course image"}
                        />
                        <div className="title-wrap">
                          <div className="title" title={c?.title}>
                            {c?.title}
                          </div>
                          <div className="sub">
                            {/* {c?.categories || "—"} · {c?.level || "—"} */}
                            {c?.categories?.join(", ") || "—"} - {c?.level}
                          </div>
                        </div>
                      </div>
                      <div className="cell">
                        <span
                          className={`badge status ${(
                            c?.status || "draft"
                          ).toLowerCase()}`}
                        >
                          {c?.status || "Draft"}
                        </span>
                      </div>
                      <div className="cell">
                        {/* {Number(c?.price) > 0
                          ? new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 0,
                            }).format(c?.price)
                          : "Free"} */}
                          {c?.id || "—"}
                      </div>
                      <div className="cell">
                        {(Number(c?.enrollmentCount) || 0).toLocaleString()}
                      </div>
                      <div className="cell">
                        <>⭐ {Number(c?.rating || 0).toFixed(1)}</>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
