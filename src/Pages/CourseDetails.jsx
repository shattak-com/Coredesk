import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCourseById, deleteCourse } from "../services/courses.services";
import "./CourseDetails.css";

const formatINR = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n)
    : n;

// ---------- helpers ----------
/** Normalize to array of strings (accepts string | string[] | undefined) */
const toCategoryArray = (v) => {
  if (Array.isArray(v)) {
    return v.filter((x) => typeof x === "string" && x.trim() !== "");
  }
  if (typeof v === "string") {
    const s = v.trim();
    return s ? [s] : [];
  }
  return [];
};

const asArray = (v) => (Array.isArray(v) ? v : []);
const safeTxt = (v, d = "—") => (v && String(v).trim() ? v : d);

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [course, setCourse] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await getCourseById(id);
        if (!mounted) return;
        setCourse(data);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  const hasDiscount = useMemo(() => {
    if (!course) return false;
    const p = Number(course.price) || 0;
    const mrp = Number(course.originalPrice) || 0;
    return mrp > p && p > 0;
  }, [course]);

  const discountPct = useMemo(() => {
    if (!course) return 0;
    const p = Number(course.price) || 0;
    const mrp = Number(course.originalPrice) || 0;
    if (!(mrp > p && p > 0)) return 0;
    return Math.round(((mrp - p) / mrp) * 100);
  }, [course]);

  const onDelete = async () => {
    if (!course) return;
    const yes = window.confirm(
      `Delete course "${course.title || "Untitled"}"?\nThis cannot be undone.`,
    );
    if (!yes) return;
    try {
      setDeleting(true);
      await deleteCourse(course.id);
      navigate("/admin/courses");
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to delete the course");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="cd-page">
        <div className="cd-skel">Loading…</div>
      </div>
    );
  }
  if (err) {
    return (
      <div className="cd-page">
        <div className="banner error">
          <span>⚠️ {err}</span>
          <button
            className="btn btn-ghost"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!course) return null;

  const {
    title,
    subtitle,
    about,
    categories, // ← can be string | string[]
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

    highlights,
    outcomes,
    requirements,
    prerequisites,
    liveSessions,
    postSessionMaterials,
    schedule,

    completion,
    audience,
    tools,
    projectGallery,
    projects,
    instructors,
    reviews,
    faqs,
  } = course;

  // ✅ Normalize categories for display
  const all_categories = toCategoryArray(categories);

  const heroImg =
    (thumbnailImage && thumbnailImage.trim()) ||
    (promoImage && promoImage.trim()) ||
    "/images/courses/course-1.svg"; // ensure exists in /public

  /* ---------- Small UI helpers ---------- */
  const Badge = ({ children, className = "" }) => (
    <span className={`cd-badge ${className}`}>{children}</span>
  );

  const Section = ({ icon = "📦", title, children, right = null }) => (
    <section className="card">
      <div className="cd-sec-head">
        <div className="cd-sec-title">
          <span className="cd-sec-ico" aria-hidden>
            {icon}
          </span>
          <h3 className="card-title">{title}</h3>
        </div>
        {right}
      </div>
      {children}
    </section>
  );

  const List = ({ items }) =>
    !items?.length ? null : (
      <ul className="cd-list">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    );

  return (
    <div className="cd-page">
      {/* Sticky top bar */}
      <div className="cd-top">
        <div className="cd-top-left">
          <button
            className="btn btn-ghost"
            onClick={() => navigate(-1)}
            title="Back"
          >
            ← Back
          </button>
          <h2 className="cd-title">Course details</h2>
        </div>
        <div className="cd-actions">
          <Link to={`/admin/courses/${id}/edit`} className="btn" title="Edit">
            ✏️ Edit
          </Link>
          <button
            className="btn btn-danger"
            onClick={onDelete}
            disabled={deleting}
            title="Delete"
          >
            {deleting ? "Deleting…" : "🗑 Delete"}
          </button>
        </div>
      </div>

      {/* HERO */}
      <section className="card cd-hero cd-elevate">
        <div className="cd-hero-media">
          <img src={heroImg} alt={title || "Course image"} />
        </div>

        <div className="cd-hero-body">
          <h1 className="cd-course-title" title={title}>
            {safeTxt(title, "Untitled course")}
          </h1>
          {subtitle ? <p className="cd-sub muted">{subtitle}</p> : null}

          <div className="cd-badges">
            <Badge
              className={
                "cd-status " +
                ((status || "Draft").toLowerCase() === "published"
                  ? "published"
                  : "draft")
              }
            >
              {status || "Draft"}
            </Badge>

            {/* ✅ Show ALL categories as chips */}
            {categories.length > 0 &&
              categories.map((cat) => (
                <Badge key={cat} className="cd-category">
                  {cat}
                </Badge>
              ))}

            {level ? <Badge>{level}</Badge> : null}
            {mode ? <Badge>{mode}</Badge> : null}
          </div>

          <div className="cd-price-row">
            <div className="cd-price">
              {typeof price === "number" ? formatINR(price) : price || "Free"}
            </div>
            {hasDiscount && (
              <>
                <div className="cd-mrp">{formatINR(originalPrice)}</div>
                <div className="cd-off">-{discountPct}%</div>
              </>
            )}
          </div>

          <div className="cd-meta-row">
            <div className="cd-meta">⭐ {Number(rating || 0).toFixed(1)}</div>
            <div className="cd-meta">
              👥 {(Number(enrollmentCount) || 0).toLocaleString()} enrolled
            </div>
            <div className="cd-meta">
              ⏱ {Number(durationHours) || 0}h {Number(durationMinutes) || 0}m
            </div>
            {liveUrl ? (
              <a
                className="btn btn-link"
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open live URL ↗
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="card cd-stats">
        <div className="cd-stat">
          <div className="cd-stat-label">Status</div>
          <div
            className={`cd-stat-value ${
              (status || "").toLowerCase() === "published" ? "ok" : "warn"
            }`}
          >
            {status || "Draft"}
          </div>
        </div>
        <div className="cd-stat">
          <div className="cd-stat-label">Rating</div>
          <div className="cd-stat-value">{Number(rating || 0).toFixed(1)}</div>
        </div>
        <div className="cd-stat">
          <div className="cd-stat-label">Enrolled</div>
          <div className="cd-stat-value">
            {(Number(enrollmentCount) || 0).toLocaleString()}
          </div>
        </div>
        <div className="cd-stat">
          <div className="cd-stat-label">Duration</div>
          <div className="cd-stat-value">
            {Number(durationHours) || 0}h {Number(durationMinutes) || 0}m
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS + OUTCOMES */}
      <div className="cd-grid-two">
        <Section icon="✨" title="Highlights">
          <div className="cd-pills">
            {asArray(highlights).map((h) => (
              <span key={h.id || h.label} className="cd-chip">
                <b>{h.label}:</b> {h.value}
              </span>
            ))}
          </div>
        </Section>

        <Section icon="🎯" title="Outcomes">
          <List items={asArray(outcomes).map((o) => o.text)} />
        </Section>
      </div>

      {/* REQUIREMENTS */}
      <Section icon="🧰" title="Requirements">
        <List items={asArray(requirements)} />
      </Section>

      {/* PREREQUISITES + LIVE SESSIONS */}
      <div className="cd-grid-two">
        <Section icon="🪜" title="Prerequisites">
          {asArray(prerequisites).length === 0 ? (
            <div className="muted">No prerequisites provided.</div>
          ) : (
            asArray(prerequisites).map((sec, idx) => (
              <div className="cd-subsection" key={sec.sectionName || idx}>
                <h4 className="cd-h4">{sec.sectionName}</h4>
                <ul className="cd-subsection-list">
                  {asArray(sec.subsections).map((s, i) => (
                    <li key={i}>
                      <span className="cd-time">{s.time}</span>
                      <span>{s.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </Section>

        <Section icon="📺" title="Live Sessions">
          {asArray(liveSessions).length === 0 ? (
            <div className="muted">No live session plan provided.</div>
          ) : (
            asArray(liveSessions).map((sec, idx) => (
              <div className="cd-subsection" key={sec.sectionName || idx}>
                <h4 className="cd-h4">{sec.sectionName}</h4>
                <ul className="cd-subsection-list">
                  {asArray(sec.subsections).map((s, i) => (
                    <li key={i}>
                      <span className="cd-time">{s.time}</span>
                      <span>{s.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </Section>
      </div>

      {/* POST-SESSION MATERIALS */}
      <Section icon="📚" title="Post‑Session Materials">
        {asArray(postSessionMaterials).length === 0 ? (
          <div className="muted">No post‑session materials added.</div>
        ) : (
          asArray(postSessionMaterials).map((sec, idx) => (
            <div className="cd-subsection" key={sec.sectionName || idx}>
              <h4 className="cd-h4">{sec.sectionName}</h4>
              <ul className="cd-subsection-list">
                {asArray(sec.subsections).map((s, i) => (
                  <li key={i}>
                    <span className="cd-time">{s.time}</span>
                    <span>{s.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </Section>

      {/* SCHEDULE TIMELINE */}
      <Section icon="🗓️" title="Schedule">
        {asArray(schedule).length === 0 ? (
          <div className="muted">No schedule added.</div>
        ) : (
          <ul className="cd-timeline">
            {schedule.map((s) => (
              <li key={s.id || s.label}>
                <div className="cd-tl-dot" />
                <div className="cd-tl-card">
                  <div className="cd-tl-top">
                    <span className="cd-tl-label">{s.label}</span>
                    <span className="cd-tl-time">{s.time}</span>
                  </div>
                  <div className="cd-tl-sub muted">{s.duration}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* COMPLETION */}
      <Section icon="🏁" title="Completion">
        <div className="cd-grid-two">
          <div>
            <h4 className="cd-h4">Benefits</h4>
            <List items={asArray(completion?.benefits)} />
          </div>
          <div>
            <h4 className="cd-h4">Certificate</h4>
            <div className="cd-cert">
              <img
                src={
                  completion?.certificateImage || "/images/courses/course-2.svg"
                }
                alt="Certificate"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* AUDIENCE */}
      <Section icon="👥" title="Audience">
        <div className="cd-audience-grid">
          {asArray(audience).map((a) => (
            <div
              className={`cd-audience ${a.tone ? `tone-${a.tone}` : ""}`}
              key={a.id || a.title}
            >
              <div className="cd-aud-title">{a.title}</div>
              <ul className="cd-aud-list">
                {asArray(a.bullets).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* TOOLS */}
      <Section icon="🧩" title="Tools">
        <div className="cd-tools">
          {asArray(tools).map((t) => {
            const img =
              t.image && t.image.trim()
                ? t.image
                : "/images/courses/course-3.svg";
            return (
              <div className="cd-tool" key={t.id || t.name}>
                <div className="cd-tool-img">
                  {img ? <img src={img} alt={t.name} /> : t.name?.[0] || "T"}
                </div>
                <div className="cd-tool-name">{t.name}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* PROJECT GALLERY */}
      <Section icon="🖼️" title="Project Gallery">
        <div className="cd-gallery">
          {asArray(projectGallery).map((p) => (
            <figure className="cd-gallery-card" key={p.id || p.image}>
              <img
                src={p.image || "/images/courses/course-1.svg"}
                alt={p.alt || "Project preview"}
              />
              {p.alt ? (
                <figcaption className="muted">{p.alt}</figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </Section>

      {/* PROJECTS */}
      <Section icon="🚀" title="Projects">
        <div className="cd-projects">
          {asArray(projects).map((p) => (
            <div className="cd-project" key={p.id || p.title}>
              <img
                src={p.previewImage || "/images/courses/course-1.svg"}
                alt={p.title || "Project"}
              />
              <div className="cd-project-info">
                <div className="cd-project-title">{p.title}</div>
                <div className="cd-project-sub muted">
                  {p.author ? `by ${p.author}` : "—"}
                  {typeof p.likes === "number" ? ` • ❤ ${p.likes}` : ""}
                </div>
                {p.liveUrl ? (
                  <a
                    href={p.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-link"
                  >
                    Open ↗
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* INSTRUCTORS */}
      <Section icon="🏫" title="Instructors">
        <div className="cd-instructors">
          {asArray(instructors).map((ins) => (
            <div className="cd-instructor" key={ins.id || ins.name}>
              <div className="cd-ins-photo">
                <img
                  src={
                    ins.photo?.trim()
                      ? ins.photo
                      : "/images/testimonials/avatar-2.svg"
                  }
                  alt={ins.name || "Instructor"}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
              <div className="cd-ins-body">
                <div className="cd-ins-name">{ins.name}</div>
                {ins.role ? (
                  <div className="cd-ins-role muted">{ins.role}</div>
                ) : null}
                {ins.bio ? <p className="cd-ins-bio">{ins.bio}</p> : null}
                {ins.linkedInUrl ? (
                  <a
                    className="btn btn-link"
                    href={ins.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn ↗
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* REVIEWS */}
      <Section icon="💬" title="Reviews">
        <div className="cd-reviews">
          {asArray(reviews)
            .filter((r) => r.show !== false)
            .map((r) => (
              <div className="cd-review" key={r.id || r.name}>
                <div className="cd-review-left">
                  <img
                    src={
                      r.avatar?.trim()
                        ? r.avatar
                        : "/images/testimonials/avatar-3.svg"
                    }
                    alt={r.name || "Reviewer"}
                  />
                </div>
                <div className="cd-review-body">
                  <div className="cd-review-top">
                    <div className="cd-review-name">{r.name}</div>
                    <div className="cd-review-meta muted">
                      {typeof r.rating === "number"
                        ? `⭐ ${r.rating.toFixed(1)}`
                        : "—"}
                      {typeof r.likes === "number" ? ` • ❤ ${r.likes}` : ""}
                      {r.affiliation ? ` • ${r.affiliation}` : ""}
                    </div>
                  </div>
                  <p className="cd-review-text">{r.body}</p>
                </div>
              </div>
            ))}
        </div>
      </Section>

      {/* FAQs */}
      <Section icon="❓" title="FAQs">
        <div className="cd-faqs">
          {asArray(faqs).map((f) => (
            <details className="cd-faq" key={f.id || f.question}>
              <summary>{f.question}</summary>
              <div className="cd-faq-a">{f.answer}</div>
            </details>
          ))}
        </div>
      </Section>

      {/* About (optional repeat at bottom) */}
      {about ? (
        <Section icon="📝" title="About">
          <p className="cd-about">{about}</p>
        </Section>
      ) : null}
    </div>
  );
};

export default CourseDetails;
