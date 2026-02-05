import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourseById, updateCourse } from "../services/courses.services";
import "./EditCourse.css";
import { categories } from "./data/categories";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import { MultiSelect } from "primereact/multiselect";
const numberFields = new Set([
  "durationHours",
  "durationMinutes",
  "price",
  "originalPrice",
  "rating",
  "enrollmentCount",
]);
const toCategoryArray = (raw) => {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") return raw.trim() ? [raw.trim()] : [];
  return [];
};
const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [course, setCourse] = useState(null);

  const [tools, setTools] = useState([]);
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setError("");
      try {
        const data = await getCourseById(id);
        if (!mounted) return;

        setCourse({
          title: data.title ?? "",
          subtitle: data.subtitle ?? "",
          about: data.about ?? data.summary ?? "",
          // category: data.category ?? "",

          category: toCategoryArray(data.category), // <-- normalize to array

          mode: data.mode ?? "",
          level: data.level ?? "",
          status: data.status ?? "Draft",
          liveUrl: data.liveUrl ?? "",
          promoImage: data.promoImage ?? "",
          thumbnailImage: data.thumbnailImage ?? "",
          durationHours: data.durationHours ?? 0,
          durationMinutes: data.durationMinutes ?? 0,
          price: data.price ?? 0,
          originalPrice: data.originalPrice ?? 0,
          rating: data.rating ?? 0,
          enrollmentCount: data.enrollmentCount ?? 0,
        });
        setTools(data.tools ?? []);
        setSchedule(data.schedule ?? []);
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load course");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);
  const categoryTemplate = (option) => (
    <div className="flex align-items-center">
      {/* you can add an icon here if you want */}
      <span>{option.label}</span>
    </div>
  );

  const footerTemplate = () => {
    const n = course.category?.length ?? 0;
    return (
      <div className="py-2 px-3">
        <b>{n}</b> selected
      </div>
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourse((prev) => {
      if (numberFields.has(name)) {
        const numeric = value === "" ? "" : Number(value);
        return { ...prev, [name]: isNaN(numeric) ? prev[name] : numeric };
      }
      return { ...prev, [name]: value };
    });
  };

  const parseJson = (text, fallback = []) => {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const payload = useMemo(() => {
    if (!course) return null;
    return {
      ...course,
      tools,
      schedule,
      updatedAt: Date.now(),
    };
  }, [course, tools, schedule]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!payload) return;

    if (!payload.title?.trim()) {
      setError("Title is required");
      return;
    }
    if (
      typeof payload.price === "string" ||
      typeof payload.originalPrice === "string"
    ) {
      setError("Price fields must be numbers");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await updateCourse(id, payload);
      navigate("/admin/courses"); // keep admin route
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="editc-loading">Loading…</div>;
  if (error && !course)
    return <div className="editc-error-top">⚠️ {error}</div>;
  if (!course) return null;

  return (
    <div className="editc-page">
      {/* Sticky header */}
      <div className="editc-sticky">
        <div className="editc-header">
          <h2 className="editc-title">Edit Course</h2>
          <div className="editc-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(-1)}
              disabled={saving}
              title="Back"
            >
              ← Back
            </button>
            {/* <button
              type="button"
              className="btn"
              onClick={() => navigate("/admin/courses")}
              disabled={saving}
              title="Go to list"
            >
              Courses list
            </button> */}
            <button
              form="edit-course-form"
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              title="Save changes"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {error ? <div className="banner error">⚠️ {error}</div> : null}

      <form id="edit-course-form" onSubmit={onSubmit} className="editc-form">
        {/* Basics */}
        <section className="card">
          <h3 className="card-title">Basics</h3>
          <div className="grid-2">
            <div className="field">
              <label>Title *</label>
              <input
                className="input"
                name="title"
                value={course.title}
                onChange={handleChange}
                required
                placeholder="e.g., Build Responsive Real-World Websites"
              />
            </div>

            <div className="field">
              <label>Subtitle</label>
              <input
                className="input"
                name="subtitle"
                value={course.subtitle}
                onChange={handleChange}
                placeholder="Short supporting line"
              />
            </div>

            <div className="field full">
              <label>About / Summary</label>
              <textarea
                className="textarea"
                name="about"
                rows={4}
                value={course.about}
                onChange={handleChange}
                placeholder="Short summary of the course"
              />
              <div className="helper">
                Tip: Keep it concise (1–3 lines) for list views.
              </div>
            </div>

            {/* <div className="field">
              <label>Category</label>

              <select
                className="input"
                name="category"
                value={course.category}
                onChange={handleChange}
              >
                <option value="">Select Category</option>

                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div> */}
            <div className="field">
              <label>Category</label>
              <MultiSelect
                value={course.category} // ['data','marketing']
                onChange={(e) => setCourse({ ...course, category: e.value })}
                options={categories} // [{id,label}]
                optionLabel="label" // user sees label
                optionValue="id" // e.value = array of ids
                display="chip"
                placeholder="Select Categories"
                maxSelectedLabels={3}
                filter // searchable
                itemTemplate={categoryTemplate} // optional
                panelFooterTemplate={footerTemplate} // optional
                className="w-full md:w-20rem"
              />
            </div>

            <div className="field">
              <label>Mode</label>
              <select
                className="select"
                name="mode"
                value={course.mode}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="Live">Live</option>
                <option value="Self-paced">Self-paced</option>
                <option value="Cohort">Cohort</option>
              </select>
            </div>

            <div className="field">
              <label>Level</label>
              <select
                className="select"
                name="level"
                value={course.level}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="field">
              <label>Status</label>
              <select
                className="select"
                name="status"
                value={course.status}
                onChange={handleChange}
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </select>
            </div>

            <div className="field">
              <label>Live URL</label>
              <input
                className="input"
                name="liveUrl"
                value={course.liveUrl}
                onChange={handleChange}
                placeholder="https://…"
              />
            </div>
          </div>
        </section>

        {/* Media */}
        <section className="card">
          <h3 className="card-title">Media</h3>
          <div className="grid-2">
            <div className="field">
              <label>Promo Image (path or URL)</label>
              <input
                className="input"
                name="promoImage"
                value={course.promoImage}
                onChange={handleChange}
                placeholder="/images/courses/promo.svg or https://…"
              />
            </div>

            <div className="field">
              <label>Thumbnail Image (path or URL)</label>
              <input
                className="input"
                name="thumbnailImage"
                value={course.thumbnailImage}
                onChange={handleChange}
                placeholder="/images/courses/thumb.svg or https://…"
              />
            </div>
          </div>
          <div className="helper">
            If you’re serving from <code>/public</code>, leading slash paths
            like <code>/images/…</code> will work in production.
          </div>
        </section>

        {/* Pricing */}
        <section className="card">
          <h3 className="card-title">Pricing</h3>
          <div className="grid-2">
            <div className="field">
              <label>Price (INR)</label>
              <input
                className="input"
                name="price"
                type="number"
                min="0"
                value={course.price}
                onChange={handleChange}
                placeholder="e.g., 200"
              />
            </div>

            <div className="field">
              <label>Original Price (INR)</label>
              <input
                className="input"
                name="originalPrice"
                type="number"
                min="0"
                value={course.originalPrice}
                onChange={handleChange}
                placeholder="e.g., 349"
              />
            </div>
          </div>
        </section>

        {/* Timeline & Metrics */}
        <section className="card">
          <h3 className="card-title">Timeline &amp; Metrics</h3>
          <div className="grid-2">
            <div className="field">
              <label>Duration (Hours)</label>
              <input
                className="input"
                name="durationHours"
                type="number"
                min="0"
                value={course.durationHours}
                onChange={handleChange}
                placeholder="e.g., 4"
              />
            </div>

            <div className="field">
              <label>Duration (Minutes)</label>
              <input
                className="input"
                name="durationMinutes"
                type="number"
                min="0"
                max="59"
                value={course.durationMinutes}
                onChange={handleChange}
                placeholder="e.g., 30"
              />
            </div>

            <div className="field">
              <label>Rating (0–5)</label>
              <input
                className="input"
                name="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={course.rating}
                onChange={handleChange}
                placeholder="e.g., 4.7"
              />
            </div>

            <div className="field">
              <label>Enrollment Count</label>
              <input
                className="input"
                name="enrollmentCount"
                type="number"
                min="0"
                value={course.enrollmentCount}
                onChange={handleChange}
                placeholder="e.g., 3200"
              />
            </div>
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">Tools</h3>

          {tools.map((tool, index) => (
            <div key={index} className="tool-row">
              <input
                className="input"
                placeholder="Tool Name"
                value={tool.name}
                onChange={(e) => {
                  const list = [...tools];
                  list[index].name = e.target.value;
                  setTools(list);
                }}
              />

              <input
                className="input"
                placeholder="Image URL / Path"
                value={tool.image}
                onChange={(e) => {
                  const list = [...tools];
                  list[index].image = e.target.value;
                  setTools(list);
                }}
              />

              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setTools(tools.filter((_, i) => i !== index))}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setTools([...tools, { name: "", image: "" }])}
          >
            + Add Tool
          </button>
        </section>

        {/* Schedule Section */}
        <section className="card">
          <h3 className="card-title">Schedule</h3>

          {schedule.map((item, index) => (
            <div key={index} className="schedule-row">
              <input
                className="input"
                placeholder="Label"
                value={item.label}
                onChange={(e) => {
                  const list = [...schedule];
                  list[index].label = e.target.value;
                  setSchedule(list);
                }}
              />

              <input
                className="input"
                placeholder="Date & Time"
                value={item.time}
                onChange={(e) => {
                  const list = [...schedule];
                  list[index].time = e.target.value;
                  setSchedule(list);
                }}
              />

              <input
                className="input"
                placeholder="Duration"
                value={item.duration}
                onChange={(e) => {
                  const list = [...schedule];
                  list[index].duration = e.target.value;
                  setSchedule(list);
                }}
              />

              <button
                type="button"
                className="btn btn-danger"
                onClick={() =>
                  setSchedule(schedule.filter((_, i) => i !== index))
                }
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setSchedule([...schedule, { label: "", time: "", duration: "" }])
            }
          >
            + Add Schedule Item
          </button>
        </section>

        {/* Footer buttons */}
        <div className="footer-row">
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/admin/courses")}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCourse;
