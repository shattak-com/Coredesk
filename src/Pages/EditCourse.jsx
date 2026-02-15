import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourseById, updateCourse } from "../services/courses.services";
import "./EditCourse.css";
import { categories } from "./data/categories";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import { MultiSelect } from "primereact/multiselect";
import { storage } from "../firebase/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// (Optional) if you want PrimeReact buttons/icons later:
// import { Button } from "primereact/button";

const numberFields = new Set([
  "durationHours",
  "durationMinutes",
  "price",
  "originalPrice",
  "rating",
  "enrollmentCount",
]);
const DEFAULT_OUTCOMES = [
  { id: "outcome-1", text: "Build a responsive website from scratch" },
  { id: "outcome-2", text: "Publish a project to your GitHub portfolio" },
  { id: "outcome-3", text: "Master HTML, CSS, and layout systems" },
  { id: "outcome-4", text: "Showcase a live project to recruiters" },
];

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
  const [errors, setErrors] = useState([]);
  const [course, setCourse] = useState(null);

  // --- NEW HELPERS: format to backend shape ---

  const [tools, setTools] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [prerequisitesJson, setPrerequisitesJson] = useState("");
  const [liveSessionsJson, setLiveSessionsJson] = useState("");
  const [postSessionMaterialsJson, setPostSessionMaterialsJson] = useState("");
  const [projectGallery, setProjectGallery] = useState([
    { id: 'project-1', image: '', alt: '' },
  ]);
  const [reviews, setReviews] = useState([]);
  const [requirementsJson, setRequirementsJson] = useState("");

  const [reviewsJson, setReviewsJson] = useState("");
  const [faqsJson, setFaqsJson] = useState("");
  const [instructors, setInstructors] = useState([]);
  const [outcomesJson, setOutcomesJson] = useState(
    JSON.stringify(DEFAULT_OUTCOMES, null, 2)
  );
  const [projectsJson, setProjectsJson] = useState("");

  useEffect(() => {
    if (!course) return;

    if (
      Array.isArray(course.prerequisites) &&
      course.prerequisites.length > 0
    ) {
      setPrerequisitesJson(
        JSON.stringify(course.prerequisites, null, 2)
      );
    } else {
      setPrerequisitesJson("");
    }

    if (
      Array.isArray(course.liveSessions) &&
      course.liveSessions.length > 0
    ) {
      setLiveSessionsJson(
        JSON.stringify(course.liveSessions, null, 2)
      );
    } else {
      setLiveSessionsJson(""); // show placeholder
    }

    if (
      Array.isArray(course.postSessionMaterials) &&
      course.postSessionMaterials.length > 0
    ) {
      setPostSessionMaterialsJson(
        JSON.stringify(course.postSessionMaterials, null, 2)
      );
    } else {
      setPostSessionMaterialsJson("");
    }
    setProjectGallery(course.projectGallery ?? [
      { id: 'project-1', image: '', alt: '' },
      { id: 'project-2', image: '', alt: '' },
      { id: 'project-3', image: '', alt: '' },
    ]);
    if (Array.isArray(course.reviews) && course.reviews.length > 0) {
      setReviewsJson(JSON.stringify(course.reviews, null, 2));
    } else {
      setReviewsJson(""); // empty so placeholder shows
    }

    if (Array.isArray(course.faqs) && course.faqs.length > 0) {
      setFaqsJson(JSON.stringify(course.faqs, null, 2));
    } else {
      setFaqsJson(""); // empty if no FAQs
    }
    if (Array.isArray(course.requirements) && course.requirements.length > 0) {
      setRequirementsJson(JSON.stringify(course.requirements, null, 2));
    } else {
      setRequirementsJson("");
    }
    if (Array.isArray(course.outcomes) && course.outcomes.length > 0) {
      setOutcomesJson(JSON.stringify(course.outcomes, null, 2));
    } else {
      setOutcomesJson(JSON.stringify(DEFAULT_OUTCOMES, null, 2));
    }
    if (Array.isArray(course.projects) && course.projects.length > 0) {
      setProjectsJson(JSON.stringify(course.projects, null, 2));
    } else {
      setProjectsJson("");
    }


  }, [course]);

  const addGalleryItem = () => {
    setProjectGallery((prev) => [
      ...prev,
      { id: `project-${prev.length + 1}`, image: '', alt: '' },
    ]);
  };

  const removeGalleryItem = (index) => {
    setProjectGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGalleryItem = (index, patch) => {
    setProjectGallery((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleGalleryFileUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const previewURL = URL.createObjectURL(file);
      updateGalleryItem(index, { image: previewURL });

      const filePath = `courses/${id}/gallery-${Date.now()}-${file.name}`;
      const storageRef = ref(storage, filePath);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      updateGalleryItem(index, { image: downloadURL });
    } catch (err) {
      console.error("Gallery upload error:", err);
    }
  };


  const addScheduleItem = () => {
    setSchedule((prev) => [
      ...prev,
      {
        id: `schedule-${prev.length + 1}`,
        label: `Session ${prev.length + 1}`,
        time: "",
        duration: "",
      },
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
    let mounted = true;
    (async () => {
      setErrors([]);
      try {
        const data = await getCourseById(id);
        if (!mounted) return;

        setCourse({
          title: data.title ?? "",
          subtitle: data.subtitle ?? "",
          about: data.about ?? data.summary ?? "",
          // category: data.category ?? "",

          categories: toCategoryArray(data.categories), // <-- normalize to array

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
          prerequisites: data.prerequisites ?? [], // ← add this
          liveSessions: data.liveSessions ?? [], // ✅ ADD THIS
          postSessionMaterials: data.postSessionMaterials ?? [], // ✅ ADD THIS
          reviews: data.reviews ?? [], // ✅ ADD THIS LINE
          faqs: data.faqs ?? [],   // ✅ IMPORTANT
          requirements: data.requirements ?? [],
          instructors: data.instructors ?? [],
          projects: data.projects ?? [],
        });
        setTools(data.tools ?? []);
        setSchedule(data.schedule ?? []);
        setInstructors(data.instructors ?? []);

      } catch (e) {
        console.error(e);
        setErrors(e.message || "Failed to load course");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);
  const MAX_INSTRUCTORS = 5;

  const addInstructor = () => {
    if (instructors.length >= MAX_INSTRUCTORS) {
      setErrors(`Maximum ${MAX_INSTRUCTORS} instructors allowed`);
      return;
    }

    setInstructors((prev) => [
      ...prev,
      {
        id: `instructor-${Date.now()}`,
        name: "",
        role: "",
        photo: "",
        bio: "",
        linkedInUrl: "",
      },
    ]);
  };

  const removeInstructor = (index) => {
    setInstructors((prev) => prev.filter((_, i) => i !== index));
  };

  const updateInstructor = (index, field, value) => {
    setInstructors((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Show preview instantly
      const previewURL = URL.createObjectURL(file);
      setCourse((prev) => ({
        ...prev,
        [fieldName]: previewURL,
      }));

      // Create structured path
      const filePath = `courses/${id}/${fieldName}-${Date.now()}-${file.name}`;
      const storageRef = ref(storage, filePath);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get final URL
      const downloadURL = await getDownloadURL(storageRef);

      // Save final URL in state
      setCourse((prev) => ({
        ...prev,
        [fieldName]: downloadURL,
      }));

    } catch (error) {
      console.error("Upload error:", error);
    }
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

  const parseDuration = (durationStr) => {
    let h = 0, m = 0;
    if (!durationStr) return { h: 0, m: 0 };
    const hMatch = durationStr.match(/(\d+)h/);
    const mMatch = durationStr.match(/(\d+)m/);
    if (hMatch) h = parseInt(hMatch[1], 10);
    if (mMatch) m = parseInt(mMatch[1], 10);
    return { h, m };
  };

  const formatDuration = (h, m) => {
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    return parts.length ? parts.join(" ") : "0m";
  };

  const payload = useMemo(() => {
    if (!course) return null;
    return {
      ...course,
      tools,
      // schedule,

      schedule: schedule.map((s, idx) => ({
        id: s.id || `schedule-${idx + 1}`,
        label: s.label?.trim() || `Session ${idx + 1}`,
        time: s.time?.trim() || "",
        duration: s.duration?.trim() || "",
      })),
      projectGallery, // ✅ add here
      updatedAt: Date.now(),
    };
  }, [course, tools, schedule, projectGallery]);
  // Recalculate total course duration whenever schedule changes
  useEffect(() => {
    let totalHours = 0;
    let totalMinutes = 0;

    schedule.forEach((s) => {
      const { h, m } = parseDuration(s.duration);
      totalHours += h;
      totalMinutes += m;
    });

    // Convert minutes > 59 into hours
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;

    setCourse((prev) => ({
      ...prev,
      durationHours: totalHours,
      durationMinutes: totalMinutes,
    }));
  }, [schedule]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!payload) return;
    const validationErrors = [];

    // TITLE
    if (!payload.title?.trim()) {
      validationErrors.push("Title is required");
    }

    // PRICE
    if (typeof payload.price === "string") {
      validationErrors.push("Price must be a number");
    }

    if (typeof payload.originalPrice === "string") {
      validationErrors.push("Original price must be a number");
    }

    let parsedPrerequisites = [];
    let parsedLiveSessions = [];
    let parsedPostSessionMaterials = [];

    // Parse prerequisites JSON safely
    if (prerequisitesJson?.trim()) {
      try {
        parsedPrerequisites = JSON.parse(prerequisitesJson);

        if (!Array.isArray(parsedPrerequisites)) {
          validationErrors.push("Prerequisites JSON must be an array");
        }
      } catch (err) {
        validationErrors.push("Invalid Prerequisites JSON: " + err.message);
      }
    }

    // ✅ Parse live sessions
    if (liveSessionsJson?.trim()) {
      try {
        parsedLiveSessions = JSON.parse(liveSessionsJson);
        if (!Array.isArray(parsedLiveSessions)) {
          validationErrors.push("Live Sessions must be an array");
        }
      } catch (err) {
        validationErrors.push("Invalid Live Sessions JSON: " + err.message);
      }
    }

    if (postSessionMaterialsJson?.trim()) {
      try {
        parsedPostSessionMaterials = JSON.parse(postSessionMaterialsJson);
        if (!Array.isArray(parsedPostSessionMaterials)) {
          validationErrors.push("Post Session Materials must be an array");
        }
      } catch (err) {
        validationErrors.push("Invalid Post Session Materials JSON: " + err.message);
      }
    }
    let parsedReviews = [];
    if (reviewsJson?.trim()) {
      try {
        parsedReviews = JSON.parse(reviewsJson);
        if (!Array.isArray(parsedReviews)) {
          validationErrors.push("Reviews JSON must be an array");
        }
      } catch (err) {
        validationErrors.push("Invalid Reviews JSON: " + err.message);
      }
    }
    let parsedFaqs = [];

    if (faqsJson?.trim()) {
      try {
        parsedFaqs = JSON.parse(faqsJson);

        if (!Array.isArray(parsedFaqs)) {
          validationErrors.push("FAQs JSON must be an array");
        }
      } catch (err) {
        validationErrors.push("Invalid FAQs JSON: " + err.message);
      }
    }
    let parsedRequirements = [];

    if (requirementsJson?.trim()) {
      try {
        parsedRequirements = JSON.parse(requirementsJson);

        // Must be array
        if (!Array.isArray(parsedRequirements)) {
          validationErrors.push("Requirements must be an array");
        }

        // Max 6 validation
        if (parsedRequirements.length > 6) {
          validationErrors.push("Maximum 6 requirements allowed");
        }

        // Ensure all are strings
        const invalid = parsedRequirements.some(
          (item) => typeof item !== "string"
        );

        if (invalid) {
          validationErrors.push("All requirements must be strings");
        }

      } catch (err) {
        validationErrors.push("Invalid Requirements JSON: " + err.message);
      }
    }

    let parsedOutcomes = [];

    if (outcomesJson?.trim()) {
      try {
        parsedOutcomes = JSON.parse(outcomesJson);

        // Must be array
        if (!Array.isArray(parsedOutcomes)) {
          validationErrors.push("Outcomes must be an array");
        }

        // Max 4 only
        if (parsedOutcomes.length > 4) {
          validationErrors.push("Maximum 4 outcomes allowed");
        }

        // Validate structure
        for (const outcome of parsedOutcomes) {
          if (
            typeof outcome !== "object" ||
            !outcome.id ||
            !outcome.text ||
            typeof outcome.text !== "string"
          ) {
            validationErrors.push("Each outcome must have id and text (string)");
          }
        }

      } catch (err) {
        validationErrors.push("Invalid Outcomes JSON: " + err.message);
      }
    } else {
      // If empty → fallback to default
      parsedOutcomes = DEFAULT_OUTCOMES;
    }
    let parsedProjects = [];

    if (projectsJson?.trim()) {
      try {
        parsedProjects = JSON.parse(projectsJson);

        // Must be array
        if (!Array.isArray(parsedProjects)) {
          validationErrors.push("Projects must be an array");
        }

        for (const project of parsedProjects) {
          if (typeof project !== "object") {
            validationErrors.push("Each project must be an object");
          }

          if (!project.id || typeof project.id !== "string") {
            validationErrors.push("Each project must have a valid id");
          }

          if (!project.title || typeof project.title !== "string") {
            validationErrors.push("Each project must have a valid title");
          }

          if (!project.author || typeof project.author !== "string") {
            validationErrors.push("Each project must have a valid author");
          }

          if (
            project.likes !== undefined &&
            typeof project.likes !== "number"
          ) {
            validationErrors.push("Project likes must be a number");
          }

          if (
            project.liveUrl &&
            typeof project.liveUrl !== "string"
          ) {
            validationErrors.push("Project liveUrl must be a string");
          }
        }

      } catch (err) {
        validationErrors.push("Invalid Projects JSON: " + err.message);
      }
    }
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return; // 🚫 DO NOT SAVE
    }

    // If no errors → clear
    setErrors([]);

    try {
      setSaving(true);
      validationErrors.push("");
      // await updateCourse(id, payload);
      await updateCourse(id, {
        ...payload,
        prerequisites: parsedPrerequisites,
        liveSessions: parsedLiveSessions,
        postSessionMaterials: parsedPostSessionMaterials,
        reviews: parsedReviews,
        faqs: parsedFaqs,
        requirements: parsedRequirements,
        instructors: instructors,
        outcomes: parsedOutcomes,
        projects: parsedProjects,

        updatedAt: Date.now(),
      });
      navigate(`/admin/courses/${id}`); // keep admin route
      // http://localhost:3000/admin/courses/wwwsss
    } catch (e) {
      console.error(e);
      setErrors(["Failed to save course: " + e.message]);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="editc-loading">Loading…</div>;
  if (errors && !course)
    return <div className="editc-error-top">⚠️ {errors}</div>;
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

      {/* {error ? <div className="banner error">⚠️ {error}</div> : null} */}
      {errors.length > 0 && (
        <div className="form-errors">
          <h4>Please fix the following errors:</h4>
          <ul>
            {errors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}

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
          </div>
        </section>
        {/* Timeline & Metrics */}
        <section className="card">
          <h3 className="card-title">Timeline &amp; Metrics</h3>
          <div className="grid-2">
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
          <div>

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


          </div>
        </section>


        <section className="card">
          <h3 className="card-title">Media</h3>

          <div className="grid-2">
            {/* PROMO IMAGE */}
            <div className="field">
              <label>Promo Image</label>

              {/* File Upload */}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "promoImage")}
              />

              <div className="or-divider">OR</div>

              {/* Direct URL */}
              <input
                type="text"
                className="input"
                placeholder="Paste image URL here"
                value={course.promoImage}
                onChange={(e) =>
                  setCourse((prev) => ({
                    ...prev,
                    promoImage: e.target.value,
                  }))
                }
              />

              {course.promoImage && (
                <img src={course.promoImage} alt="Promo Preview" width="120" />
              )}
            </div>

            {/* THUMBNAIL IMAGE */}
            <div className="field">
              <label>Thumbnail Image</label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "thumbnailImage")}
              />

              <div className="or-divider">OR</div>

              <input
                type="text"
                className="input"
                placeholder="Paste image URL here"
                value={course.thumbnailImage}
                onChange={(e) =>
                  setCourse((prev) => ({
                    ...prev,
                    thumbnailImage: e.target.value,
                  }))
                }
              />

              {course.thumbnailImage && (
                <img src={course.thumbnailImage} alt="Thumb Preview" width="120" />
              )}
            </div>
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

        <section className="card">
          <h3 className="card-title">Instructors</h3>

          {instructors.length === 0 && (
            <div className="empty-msg">No instructors added yet.</div>
          )}

          {instructors.map((inst, index) => (
            <div key={inst.id} className="instructor-block">

              <div className="instructor-header">
                <h4>Instructor {index + 1}</h4>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeInstructor(index)}
                >
                  ✕
                </button>
              </div>

              <div className="grid-2">

                <div className="field">
                  <label>Name *</label>
                  <input
                    className="input"
                    value={inst.name}
                    onChange={(e) =>
                      updateInstructor(index, "name", e.target.value)
                    }
                    placeholder="e.g., Aarav Sharma"
                  />
                </div>

                <div className="field">
                  <label>Role *</label>
                  <input
                    className="input"
                    value={inst.role}
                    onChange={(e) =>
                      updateInstructor(index, "role", e.target.value)
                    }
                    placeholder="Senior Frontend Engineer"
                  />
                </div>

                <div className="field">
                  <label>Photo URL</label>
                  <input
                    className="input"
                    value={inst.photo}
                    onChange={(e) =>
                      updateInstructor(index, "photo", e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="field">
                  <label>LinkedIn URL</label>
                  <input
                    className="input"
                    value={inst.linkedInUrl}
                    onChange={(e) =>
                      updateInstructor(index, "linkedInUrl", e.target.value)
                    }
                    placeholder="https://linkedin.com/..."
                  />
                </div>

              </div>

              <div className="field full">
                <label>Bio</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={inst.bio}
                  onChange={(e) =>
                    updateInstructor(index, "bio", e.target.value)
                  }
                  placeholder="Short instructor bio..."
                />
              </div>

              {inst.photo && (
                <img
                  src={inst.photo}
                  alt={inst.name}
                  width="120"
                  style={{ marginTop: "10px", borderRadius: "8px" }}
                />
              )}

              <hr />
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addInstructor}
          >
            + Add Instructor
          </button>

          <small className="helper">
            Maximum {MAX_INSTRUCTORS} instructors allowed.
          </small>
        </section>

        <section className="card schedule-card">
          <h3 className="card-title">Schedule</h3>

          {schedule.length === 0 && (
            <div className="empty-msg">No schedule added yet.</div>
          )}

          {schedule.map((item, index) => (
            <div key={index} className="schedule-block">
              <div className="schedule-row-header">
                <span className="session-title">
                  Session {index + 1}
                </span>

                <button
                  type="button"
                  className="remove-session"
                  onClick={() => removeScheduleItem(index)}
                >
                  ✕
                </button>
              </div>

              <div className="schedule-grid">
                {/* Label */}
                <div className="field">
                  <label>Session Label *</label>
                  <input
                    className="input"
                    placeholder="Session 1"
                    value={item.label}
                    onChange={(e) =>
                      updateScheduleItem(index, { label: e.target.value })
                    }
                  />
                </div>

                {/* Time */}
                <div className="field">
                  <label>Time *</label>
                  <input
                    className="input"
                    placeholder="16 Feb - 8:30 PM"
                    value={item.time}
                    onChange={(e) =>
                      updateScheduleItem(index, { time: e.target.value })
                    }
                  />
                </div>

                <div className="field">
                  <label>Duration *</label>
                  <div className="duration-group">
                    <input
                      type="number"
                      min="0"
                      value={parseDuration(item.duration).h}
                      onChange={(e) => {
                        const hours = Math.max(0, Number(e.target.value) || 0);
                        const mins = parseDuration(item.duration).m;
                        updateScheduleItem(index, { duration: formatDuration(hours, mins) });
                      }}
                      placeholder="Hours"
                      className="input duration-input"
                    /> H
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={parseDuration(item.duration).m}
                      onChange={(e) => {
                        let mins = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                        const hours = parseDuration(item.duration).h;
                        updateScheduleItem(index, { duration: formatDuration(hours, mins) });
                      }}
                      placeholder="Minutes"
                      className="input duration-input"
                    /> M
                  </div>
                </div>

              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn-add-session styled-add-btn"
            onClick={addScheduleItem}
          >
            + Add Session
          </button>
        </section>

        <div className="field full">
          <label>Project Summary</label>
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
        <br />
        <section className="card">
          <h3 className="card-title">Project Gallery</h3>

          <div className="project-gallery">
            {projectGallery.map((item, index) => (
              <div key={item.id} className="gallery-item">
                {/* Preview */}
                {item.image && <img src={item.image} alt={item.alt || "preview"} />}

                {/* Inputs */}
                <div className="gallery-inputs">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleGalleryFileUpload(e, index)}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Image URL"
                    value={item.image}
                    onChange={(e) => updateGalleryItem(index, { image: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Alt text"
                    value={item.alt}
                    onChange={(e) => updateGalleryItem(index, { alt: e.target.value })}
                  />
                </div>

                {/* Actions */}
                <div className="gallery-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeGalleryItem(index)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn-add-gallery"
            onClick={addGalleryItem}
          >
            + Add Project Image
          </button>
          <br />
          <br />
          <div className="field"> <label>Project Live URL</label> <input className="input" name="liveUrl" value={course.liveUrl} onChange={handleChange} placeholder="https://…" /> </div>
        </section>

        <section className="card">
          <h3 className="card-title">Course Outcomes (JSON)</h3>

          <textarea
            className="textarea"
            rows={10}
            value={outcomesJson}
            onChange={(e) => setOutcomesJson(e.target.value)}
          />

          <small className="helper">
            Must be a valid JSON array of objects with "id" and "text".
            Maximum 4 outcomes allowed.
          </small>
        </section>

        <section className="card">
          <h3 className="card-title">Prerequisites (JSON)</h3>
          <div className="field full">
            <textarea
              className="textarea"
              rows={10}
              value={prerequisitesJson}
              onChange={(e) => setPrerequisitesJson(e.target.value)}
              placeholder={`Paste prerequisites JSON here:
[
  {
    "sectionName": "Setting up the Development Environment",
    "subsections": [
      { "title": "Install VS Code (Windows/Mac)", "time": "20 min" },
      { "title": "Install Google Chrome", "time": "10 min" }
    ]
  }
]`}
            />
            <div className="helper">
              Enter valid JSON for course prerequisites.
            </div>
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">Live Sessions (JSON)</h3>
          <div className="field full">
            <textarea
              className="textarea"
              rows={12}
              value={liveSessionsJson}
              onChange={(e) => setLiveSessionsJson(e.target.value)}
              placeholder={`Paste live sessions JSON here:
[
  {
    "sectionName": "Session 1: Project Planning & HTML Foundation",
    "subsections": [
      { "title": "Project walkthrough & assets", "time": "20 min" },
      { "title": "HTML layout structure", "time": "40 min" }
    ]
  }
]`}
            />
            <div className="helper">
              Enter valid JSON array for live sessions.
            </div>
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">Post Session Materials (JSON)</h3>
          <div className="field full">
            <textarea
              className="textarea"
              rows={12}
              value={postSessionMaterialsJson}
              onChange={(e) => setPostSessionMaterialsJson(e.target.value)}
              placeholder={`Paste post session materials JSON here:
[
  {
    "sectionName": "Real-World Examples",
    "subsections": [
      { "title": "Reference layouts", "time": "30 min" },
      { "title": "Component checklist", "time": "20 min" }
    ]
  }
]`}
            />
            <div className="helper">
              Must be a valid JSON array.
            </div>
          </div>
        </section>
        <section className="card">
          <h3 className="card-title">Requirements (JSON)</h3>

          <textarea
            className="textarea"
            rows={8}
            value={requirementsJson}
            onChange={(e) => setRequirementsJson(e.target.value)}
            placeholder={`Paste requirements JSON here:
[
  "Laptop or desktop with internet access",
  "Basic understanding of HTML and CSS",
  "Modern browser (Chrome, Edge, or Firefox)",
  "VS Code installed"
]`}
          />

          <small className="helper">
            Must be a valid JSON array of strings. Maximum 6 requirements allowed.
          </small>
        </section>

        <section className="card">
          <h3 className="card-title">Reviews (JSON)</h3>

          <textarea
            className="textarea"
            rows={10}
            value={reviewsJson}
            onChange={(e) => setReviewsJson(e.target.value)}
            placeholder='Paste reviews JSON here, e.g. 
            [
             {
            "id":"review-1",
            "name":"Riya Jain",
            "affiliation":"B.Tech",
            "rating":4.8,
            "body":"Great course",
            "avatar":"/images/testimonials/avatar-2.svg",
            "likes":24,
            "show":true
             }
            ]'
          />

          <small className="helper">
            Modify the JSON directly. Must be a valid array of review objects.
          </small>
        </section>
        <section className="card">
          <h3 className="card-title">Student Projects (JSON)</h3>

          <textarea
            className="textarea"
            rows={12}
            value={projectsJson}
            onChange={(e) => setProjectsJson(e.target.value)}
            placeholder={`[
  {
    "id": "project-1",
    "title": "Portfolio Landing Page",
    "author": "Zainab Shaikh",
    "previewImage": "/images/courses/course-1.svg",
    "likes": 300,
    "liveUrl": "https://example.com"
  }
]`}
          />

          <small className="helper">
            Must be a valid JSON array of project objects.
          </small>
        </section>

        <section className="card">
          <h3 className="card-title">FAQs (JSON)</h3>

          <textarea
            className="textarea"
            rows={10}
            value={faqsJson}
            onChange={(e) => setFaqsJson(e.target.value)}
            placeholder={`[
  {
    "id": "faq-1",
    "question": "Who is this course for?",
    "answer": "Students, working professionals..."
  }
]`}
          />

          <small className="helper">
            Must be a valid JSON array.
          </small>
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
