import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addCourse } from "../services/courses.services";
import "./AddCourse.css";
import { categories } from "./data/categories";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
// (Optional) if you want PrimeReact buttons/icons later:
// import { Button } from "primereact/button";

import "primereact/resources/themes/lara-light-cyan/theme.css";

// import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
const numberFields = new Set([
  "durationHours",
  "durationMinutes",
  "price",
  "originalPrice",
  "rating",
  "enrollmentCount",
]);

const AddCourse = () => {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --- base fields ---
  const [course, setCourse] = useState({
    title: "",
    subtitle: "",
    about: "",
    categories: [],
    mode: "",
    level: "",
    status: "Draft",
    liveUrl: "",
    promoImage: "",
    thumbnailImage: "",
    durationHours: 0,
    durationMinutes: 0,
    price: 0,
    originalPrice: 0,
    rating: 0,
    enrollmentCount: 0,
  });

  // --- NEW HELPERS: format to backend shape ---
  const formatDuration = (totalMinutes) => {
    const mins = Math.max(0, Number(totalMinutes) || 0);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    return parts.length ? parts.join(" ") : "0m";
  };

  const formatScheduleTime = (date) => {
    if (!date) return "";
    // Local date formatting: "20 Aug - 7:00 PM"
    const d = new Date(date);
    const day = d.getDate();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const mon = months[d.getMonth()];
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12; // 12-hour clock
    return `${day} ${mon} - ${hours}:${minutes} ${ampm}`;
  };

  const [tools, setTools] = useState([]);
  // const [schedule, setSchedule] = useState([]);
  // // Add a fresh session row
  // const addScheduleItem = () => {
  //   setSchedule((prev) => [
  //     ...prev,
  //     { label: "", start: null, durationMinutes: 60 }, // default 1 hr
  //   ]);
  // };

  // const updateScheduleItem = (index, patch) => {
  //   setSchedule((prev) => {
  //     const next = [...prev];
  //     next[index] = { ...next[index], ...patch };
  //     return next;
  //   });
  // };

  // const removeScheduleItem = (index) => {
  //   setSchedule((prev) => prev.filter((_, i) => i !== index));
  // };

  // // Auto-calc total course duration from all sessions
  // useEffect(() => {
  //   if (!schedule || schedule.length === 0) return; // allow manual inputs when empty

  //   const totalMinutes = schedule.reduce((sum, s) => {
  //     const minutes = Number(s?.durationMinutes) || 0;
  //     return sum + Math.max(0, minutes);
  //   }, 0);

  //   setCourse((prev) => ({
  //     ...prev,
  //     durationHours: Math.floor(totalMinutes / 60),
  //     durationMinutes: totalMinutes % 60,
  //   }));
  // }, [schedule]);

  // Keep UI schedule in an internal shape (label/start/durationMinutes)
  const [schedule, setSchedule] = useState([]);

  // Add a fresh session row
  const addScheduleItem = () => {
    setSchedule((prev) => [
      ...prev,
      { label: "", start: null, durationMinutes: 60 }, // default 1 hr
    ]);
  };

  const updateScheduleItem = (index, patch) => {
    setSchedule((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const removeScheduleItem = (index) => {
    setSchedule((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-calc total course duration from all sessions
  useEffect(() => {
    if (!schedule || schedule.length === 0) return; // allow manual inputs when empty

    const totalMinutes = schedule.reduce((sum, s) => {
      const minutes = Number(s?.durationMinutes) || 0;
      return sum + Math.max(0, minutes);
    }, 0);

    setCourse((prev) => ({
      ...prev,
      durationHours: Math.floor(totalMinutes / 60),
      durationMinutes: totalMinutes % 60,
    }));
  }, [schedule]);

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
    return {
      ...course,
      tools,
      // schedule,

      schedule: schedule.map((s, idx) => ({
        id: `schedule-${idx + 1}`,
        label: s.label?.trim() || "",
        time: s.start ? formatScheduleTime(new Date(s.start)) : "",
        duration: formatDuration(Number(s.durationMinutes) || 0),
      })),

      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, [course, tools, schedule]);
  const validate = () => {
    if (!payload.title?.trim()) return "Title is required";
    if (
      typeof payload.price === "string" ||
      typeof payload.originalPrice === "string"
    )
      return "Price fields must be numbers";
    if (payload.durationMinutes > 59 || payload.durationMinutes < 0)
      return "Duration minutes must be between 0 and 59";
    if (payload.rating < 0 || payload.rating > 5)
      return "Rating must be between 0 and 5";

    if (!course.categories || course.categories.length === 0) {
      // show a message / mark invalid
      return "Category is required";
    }

    for (let i = 0; i < schedule.length; i++) {
      const s = schedule[i];
      if (!s.label?.trim())
        return `Schedule ${i + 1}: session label is required`;
      if (!s.start) return `Schedule ${i + 1}: pick a date & time`;
      if (!s.durationMinutes || s.durationMinutes <= 0)
        return `Schedule ${i + 1}: duration must be greater than 0`;
    }

    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    try {
      setSaving(true);
      setError("");
      await addCourse(payload);
      navigate("/admin/courses");
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to create course");
    } finally {
      setSaving(false);
    }
  };

  const onSaveAsPublished = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    try {
      setSaving(true);
      setError("");
      await addCourse({ ...payload, status: "Published" });
      navigate("/admin/courses");
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to create course");
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setCourse({
      title: "",
      subtitle: "",
      about: "",
      categories: [],
      mode: "",
      level: "",
      status: "Draft",
      liveUrl: "",
      promoImage: "",
      thumbnailImage: "",
      durationHours: 0,
      durationMinutes: 0,
      price: 0,
      originalPrice: 0,
      rating: 0,
      enrollmentCount: 0,
    });
    setTools([]);
    setSchedule([]);
    // setToolsJson("[]");
    // setScheduleJson("[]");
    setError("");
  };

  const categoryTemplate = (option) => (
    <div className="flex align-items-center">
      {/* you can add an icon here if you want */}
      <span>{option.label}</span>
    </div>
  );

  const footerTemplate = () => {
    const n = course.categories?.length ?? 0;
    return (
      <div className="py-2 px-3">
        <b>{n}</b> selected
      </div>
    );
  };

  return (
    <div className="addc-page">
      {/* Sticky header */}
      <div className="addc-sticky">
        <div className="addc-header">
          <h2 className="addc-title">Add Course</h2>
          <div className="addc-actions">
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
              type="button"
              className="btn btn-ok"
              onClick={onSaveAsPublished}
              disabled={saving}
              title="Save & Publish"
            >
              {saving ? "Saving…" : "Save & Publish"}
            </button>
            <button
              form="add-course-form"
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              title="Save as Draft"
            >
              {saving ? "Saving…" : "Save Draft"}
            </button>
          </div>
        </div>
      </div>

      {error ? <div className="banner error">⚠️ {error}</div> : null}

      <form id="add-course-form" onSubmit={onSubmit} className="addc-form">
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
                value={course.categories} // ['data','marketing']
                onChange={(e) => setCourse({ ...course, categories: e.value })}
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

          {/* Previews */}
          <div className="preview-row">
            <div>
              <div className="helper">Promo preview</div>
              <div className="preview-box">
                {course.promoImage ? (
                  <img
                    src={course.promoImage}
                    alt="Promo"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  "No promo image"
                )}
              </div>
            </div>
            <div>
              <div className="helper">Thumbnail preview</div>
              <div className="preview-box">
                {course.thumbnailImage ? (
                  <img
                    src={course.thumbnailImage}
                    alt="Thumbnail"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  "No thumbnail"
                )}
              </div>
            </div>
          </div>

          <div className="helper">
            If serving from <code>/public</code>, a leading slash path like{" "}
            <code>/images/…</code> works.
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
            {/* <div className="field">
              <label>Duration (Hours)</label>
              {course.durationHours} h {course.durationMinutes} m
              {schedule.length > 0 && (
                <div className="helper">
                  Auto-calculated from schedule. Clear schedule to edit
                  manually.
                </div>
              )}
            </div> */}

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

        {/* Advanced JSON */}
        <section className="card">
          <h3 className="card-title">Tools</h3>

          {tools.length === 0 && (
            <div className="empty-msg">No tools added yet.</div>
          )}

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
                placeholder="Image URL"
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

        <section className="card schedule-card">
          <h3 className="card-title">Schedule</h3>

          {schedule.length === 0 && (
            <div className="empty-msg">No schedule added yet.</div>
          )}

          {schedule.map((item, index) => {
            const start = item.start ? new Date(item.start) : null;
            const end =
              start && item.durationMinutes
                ? new Date(start.getTime() + item.durationMinutes * 60000)
                : null;

            const hours = Math.floor((item.durationMinutes || 0) / 60);
            const minutes = (item.durationMinutes || 0) % 60;

            return (
              <div key={index} className="schedule-block">
                {/* Title Row */}
                {/* <div className="schedule-row-header">
                  <span className="session-title">Session {index + 1}</span>
                  <button
                    type="button"
                    className="remove-session"
                    onClick={() => removeScheduleItem(index)}
                  >
                    ✕
                  </button>
                </div> */}

                <div className="schedule-row-header">
                  <span className="session-title">Session {index + 1}</span>

                  <div className="header-right">
                    {end && (
                      <span className="end-chip" title={end.toLocaleString()}>
                        Ends: {end.toLocaleString()}
                      </span>
                    )}
                    <button
                      type="button"
                      className="remove-session"
                      onClick={() => removeScheduleItem(index)}
                      aria-label={`Remove Session ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {/* Grid */}
                <div className="schedule-grid">
                  {/* Label */}
                  <div className="field">
                    <label>Session Label *</label>
                    <input
                      className="input"
                      placeholder="Kickoff / Module 1 / Live Q&A"
                      value={item.label}
                      onChange={(e) =>
                        updateScheduleItem(index, { label: e.target.value })
                      }
                    />
                  </div>

                  {/* Date Time */}
                  {/* Date & Time */}
                  <div className="field">
                    <label>Date &amp; Time *</label>
                    <Calendar
                      value={start}
                      onChange={(e) =>
                        updateScheduleItem(index, { start: e.value })
                      }
                      showTime
                      hourFormat="12"
                      showIcon
                      placeholder="Select date & time"
                      className="w-full schedule-calendar"
                      inputClassName="control-input" // NEW: makes height uniform
                    />
                  </div>

                  {/* Duration */}
                  {/* Duration */}
                  <div className="field">
                    <label>Duration *</label>
                    <div className="duration-group2">
                      <InputNumber
                        value={hours}
                        onValueChange={(e) => {
                          const newHours = Math.max(0, e.value || 0);
                          const newTotal =
                            newHours * 60 + ((item.durationMinutes || 0) % 60);
                          updateScheduleItem(index, {
                            durationMinutes: newTotal,
                          });
                        }}
                        min={0}
                        max={23}
                        step={1}
                        useGrouping={false}
                        showButtons={false} // <- IMPORTANT
                        suffix=" h"
                        inputClassName="duration-input"
                        className="duration-input-wrap"
                      />

                      <InputNumber
                        value={minutes}
                        onValueChange={(e) => {
                          let m = Math.max(0, e.value || 0);
                          if (m > 59) m = 59;
                          const newTotal =
                            Math.floor((item.durationMinutes || 0) / 60) * 60 +
                            m;
                          updateScheduleItem(index, {
                            durationMinutes: newTotal,
                          });
                        }}
                        min={0}
                        max={59}
                        step={5}
                        useGrouping={false}
                        showButtons={false} // <- IMPORTANT
                        suffix=" m"
                        inputClassName="duration-input"
                        className="duration-input-wrap"
                      />
                    </div>

                   
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            className="btn-add-session styled-add-btn"
            onClick={addScheduleItem}
          >
            + Add Session
          </button>

          <div className="total-duration">
            Total Duration:&nbsp;
            <strong>
              {course.durationHours}h {course.durationMinutes}m
            </strong>
          </div>
        </section>

        {/* Footer buttons */}
        <div className="footer-row">
          <button
            type="button"
            className="btn"
            onClick={onReset}
            disabled={saving}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/admin/courses")}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Draft"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCourse;
