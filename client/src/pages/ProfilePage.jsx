import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Github,
  Globe,
  Linkedin,
  MapPin,
  Pencil,
  Plus,
  Save,
  Upload,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { api } from "../lib/api.js";

const EMPTY_PROFILE = {
  username: "",
  email: "",
  displayName: "",
  bio: "",
  profileImage: "",
  location: "",
  jobTitle: "",
  website: "",
  portfolioUrl: "",
  githubUrl: "",
  linkedinUrl: "",
  skills: [],
  experienceLevel: "",
};

const EXPERIENCE_OPTIONS = [
  ["", "Select experience level"],
  ["beginner", "Beginner"],
  ["intermediate", "Intermediate"],
  ["advanced", "Advanced"],
  ["professional", "Professional"],
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/10 dark:border-slate-700 dark:bg-[#0B1220] dark:text-slate-100 dark:placeholder:text-slate-500";

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
      {label}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={inputClass}
      />
    </label>
  );
}

function SectionHeading({ title, description }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}

export default function ProfilePage({ onBack, onProfileUpdated, onToast }) {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    let active = true;

    api
      .get("/profile/me")
      .then((result) => {
        if (!active) return;
        setProfile({ ...EMPTY_PROFILE, ...(result.profile || {}) });
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || "Could not load your profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  }

  function handleImageSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  async function uploadProfileImage() {
    if (!selectedImage) {
      setError("Choose an image from your device first.");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", selectedImage);

    setUploadingImage(true);
    setError("");

    try {
      const result = await api.post("/profile/image", formData);
      const imageUrl = result.profileImage || result.profile?.profileImage;

      if (!imageUrl) {
        throw new Error("The server did not return the uploaded image URL.");
      }

      setProfile((current) => ({ ...current, profileImage: imageUrl }));
      setSelectedImage(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      onProfileUpdated?.({ profileImage: imageUrl });
      onToast?.("Profile picture uploaded successfully.", "success");
    } catch (uploadError) {
      setError(uploadError.message || "Could not upload your profile picture.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function removeProfileImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview("");

    try {
      await api.put("/profile/me", { profileImage: "" });
      setProfile((current) => ({ ...current, profileImage: "" }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      onProfileUpdated?.({ profileImage: "" });
      onToast?.("Profile picture removed.", "success");
    } catch (removeError) {
      setError(removeError.message || "Could not remove profile picture.");
    }
  }

  function addSkill(event) {
    event.preventDefault();
    const skill = skillInput.trim();

    if (!skill) return;
    if (profile.skills.length >= 20) {
      setError("You can add up to 20 skills.");
      return;
    }
    if (skill.length > 40) {
      setError("Each skill must be 40 characters or fewer.");
      return;
    }
    if (
      profile.skills.some((item) => item.toLowerCase() === skill.toLowerCase())
    ) {
      setSkillInput("");
      return;
    }

    setProfile((current) => ({
      ...current,
      skills: [...current.skills, skill],
    }));
    setSkillInput("");
    setError("");
  }

  function removeSkill(skillToRemove) {
    setProfile((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillToRemove),
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const result = await api.put("/profile/me", {
        displayName: profile.displayName,
        bio: profile.bio,
        profileImage: profile.profileImage,
        location: profile.location,
        jobTitle: profile.jobTitle,
        website: profile.website,
        portfolioUrl: profile.portfolioUrl,
        githubUrl: profile.githubUrl,
        linkedinUrl: profile.linkedinUrl,
        skills: profile.skills,
        experienceLevel: profile.experienceLevel,
      });

      const updatedProfile = { ...EMPTY_PROFILE, ...(result.profile || {}) };
      setProfile(updatedProfile);
      setEditing(false);
      onProfileUpdated?.(updatedProfile);
      onToast?.("Your profile has been saved.", "success");
    } catch (requestError) {
      setError(requestError.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827]" />
      </main>
    );
  }

  const initials = (profile.displayName || profile.username || "U")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-500 transition hover:text-orange-500"
      >
        <ArrowLeft size={16} /> Back to StackRoast
      </button>

      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 font-label text-[10px] uppercase tracking-[0.18em] text-orange-500">
            Your account
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            My Profile
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Tell the StackRoast community a little about yourself.
          </p>
        </div>

        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            <Pencil size={15} /> Edit Profile
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setError("");
              setSelectedImage(null);
              if (imagePreview) URL.revokeObjectURL(imagePreview);
              setImagePreview("");
              if (fileInputRef.current) fileInputRef.current.value = "";
              api
                .get("/profile/me")
                .then((result) => {
                  setProfile({ ...EMPTY_PROFILE, ...(result.profile || {}) });
                })
                .catch(() => {});
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <X size={15} /> Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </div>
      )}

      <form
        onSubmit={saveProfile}
        className="grid gap-5 lg:grid-cols-[300px_1fr]"
      >
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-orange-100 bg-orange-50 text-3xl font-extrabold text-orange-600 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400">
              {imagePreview || profile.profileImage ? (
                <img
                  src={imagePreview || profile.profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                initials
              )}
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-white">
              {profile.displayName || profile.username}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              @{profile.username}
            </p>
            {profile.jobTitle && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {profile.jobTitle}
              </p>
            )}
          </div>

          <div className="my-5 border-t border-slate-100 dark:border-slate-800" />

          <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
            {profile.location && (
              <p className="flex items-center gap-2">
                <MapPin size={14} /> {profile.location}
              </p>
            )}
            <p className="flex items-center gap-2 break-all">
              <UserRound size={14} /> {profile.email}
            </p>
          </div>

          {editing && (
            <div className="mt-5 w-full">
              <label className="block text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
                Profile picture
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="mt-2 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-orange-700 hover:file:bg-orange-100 dark:file:bg-orange-500/10 dark:file:text-orange-300"
                />
              </label>
              <p className="mt-1.5 text-[11px] text-slate-400">
                JPG, PNG or WebP. Maximum size: 5 MB.
              </p>

              {selectedImage && (
                <button
                  type="button"
                  onClick={uploadProfileImage}
                  disabled={uploadingImage}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  <Upload size={14} />
                  {uploadingImage ? "Uploading..." : "Upload picture"}
                </button>
              )}

              {(profile.profileImage || imagePreview) && (
                <button
                  type="button"
                  onClick={removeProfileImage}
                  disabled={uploadingImage}
                  className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Trash2 size={14} /> Remove picture
                </button>
              )}
            </div>
          )}
        </aside>

        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#111827]">
            <SectionHeading
              title="About you"
              description="Your public introduction to the StackRoast community."
            />
            {editing ? (
              <div className="space-y-4">
                <Field
                  label="Display name"
                  name="displayName"
                  value={profile.displayName}
                  onChange={handleChange}
                  placeholder="Your name"
                  maxLength={60}
                />
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Bio
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                    placeholder="Write a short introduction about yourself..."
                    className={inputClass}
                  />
                  <span className="mt-1 block text-right text-[11px] font-normal text-slate-400">
                    {profile.bio.length}/500
                  </span>
                </label>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                {profile.bio || "You haven't added a bio yet."}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#111827]">
            <SectionHeading
              title="Developer information"
              description="Share your role, location and experience."
            />
            {editing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Job title"
                  name="jobTitle"
                  value={profile.jobTitle}
                  onChange={handleChange}
                  placeholder="e.g. Full-Stack Developer"
                  maxLength={100}
                />
                <Field
                  label="Location"
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                  maxLength={100}
                />
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
                  Experience level
                  <select
                    name="experienceLevel"
                    value={profile.experienceLevel}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {EXPERIENCE_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <BriefcaseBusiness size={17} className="text-orange-500" />
                  {profile.jobTitle || "Job title not added"}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin size={17} className="text-orange-500" />
                  {profile.location || "Location not added"}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Experience:{" "}
                  <span className="font-semibold capitalize">
                    {profile.experienceLevel || "Not specified"}
                  </span>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#111827]">
            <SectionHeading
              title="Skills & technologies"
              description="Add up to 20 technologies you work with."
            />
            {editing && (
              <div className="mb-4 flex gap-2">
                <input
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addSkill(event);
                  }}
                  maxLength={40}
                  placeholder="e.g. JavaScript"
                  className={inputClass + " mt-0"}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {profile.skills.length ? (
                profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300"
                  >
                    {skill}
                    {editing && (
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        aria-label={`Remove ${skill}`}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-400">No skills added yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-[#111827]">
            <SectionHeading
              title="Links & social profiles"
              description="Help people find your work around the web."
            />
            {editing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Website"
                  name="website"
                  value={profile.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
                <Field
                  label="Portfolio"
                  name="portfolioUrl"
                  value={profile.portfolioUrl}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                />
                <Field
                  label="GitHub"
                  name="githubUrl"
                  value={profile.githubUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/username"
                />
                <Field
                  label="LinkedIn"
                  name="linkedinUrl"
                  value={profile.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {[
                  [profile.website, "Website", Globe],
                  [profile.portfolioUrl, "Portfolio", Globe],
                  [profile.githubUrl, "GitHub", Github],
                  [profile.linkedinUrl, "LinkedIn", Linkedin],
                ]
                  .filter(([url]) => url)
                  .map(([url, label, Icon]) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-orange-400"
                    >
                      <Icon size={14} /> {label}
                    </a>
                  ))}
                {!profile.website &&
                  !profile.portfolioUrl &&
                  !profile.githubUrl &&
                  !profile.linkedinUrl && (
                    <p className="text-sm text-slate-400">
                      No links added yet.
                    </p>
                  )}
              </div>
            )}
          </section>

          {editing && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </form>
    </main>
  );
}
