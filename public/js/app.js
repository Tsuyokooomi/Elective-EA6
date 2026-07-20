(function () {
  "use strict";

  const form = document.getElementById("regForm");
  if (!form) return;

  const submitBtn = document.getElementById("submitBtn");
  const docketNumber = document.getElementById("docketNumber");

  // A stable-looking docket number derived from today's date, purely cosmetic.
  if (docketNumber) {
    const d = new Date();
    const seq = String(d.getHours() * 60 + d.getMinutes()).padStart(4, "0");
    docketNumber.textContent = "No. " + d.getFullYear() + "-" + seq;
  }

  const studentID = document.getElementById("studentID");
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const stepID = document.querySelector('.docket__steps li[data-step="id"]');
  const stepPhoto = document.querySelector('.docket__steps li[data-step="photo"]');
  const stepCert = document.querySelector('.docket__steps li[data-step="certificate"]');

  function markStep(el, done) {
    if (!el) return;
    el.classList.toggle("is-done", !!done);
  }

  function updateIdentityStep() {
    const ok =
      studentID.value.trim().length > 0 &&
      firstName.value.trim().length > 0 &&
      lastName.value.trim().length > 0;
    markStep(stepID, ok);
  }

  [studentID, firstName, lastName].forEach((el) => {
    el && el.addEventListener("input", updateIdentityStep);
  });

  function validateField(input) {
    const field = input.closest(".field");
    if (!field) return true;
    const valid = input.checkValidity();
    field.classList.toggle("is-invalid", !valid);
    return valid;
  }

  [studentID, firstName, lastName].forEach((el) => {
    el && el.addEventListener("blur", () => validateField(el));
  });

  // ---- Dropzones: preview, filename, drag & drop ----
  document.querySelectorAll(".dropzone").forEach((zone) => {
    const input = zone.querySelector("input[type=file]");
    const filenameEl = zone.querySelector(".dropzone__filename");
    const preview = zone.querySelector(".dropzone__preview");
    const target = zone.dataset.target;

    function showFile(file) {
      if (!file) {
        zone.classList.remove("has-file", "is-invalid");
        if (filenameEl) filenameEl.textContent = filenameEl.dataset.empty;
        if (preview) preview.hidden = true;
        markStep(target === "photo" ? stepPhoto : stepCert, false);
        return;
      }
      zone.classList.remove("is-invalid");
      zone.classList.add("has-file");
      if (filenameEl) filenameEl.textContent = file.name;
      markStep(target === "photo" ? stepPhoto : stepCert, true);

      if (preview && file.type && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.src = e.target.result;
          preview.hidden = false;
        };
        reader.readAsDataURL(file);
      }
    }

    input.addEventListener("change", () => {
      showFile(input.files && input.files[0]);
    });

    ["dragenter", "dragover"].forEach((evt) =>
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.add("is-dragover");
      })
    );
    ["dragleave", "drop"].forEach((evt) =>
      zone.addEventListener(evt, (e) => {
        e.preventDefault();
        zone.classList.remove("is-dragover");
      })
    );
    zone.addEventListener("drop", (e) => {
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) {
        input.files = e.dataTransfer.files;
        showFile(file);
      }
    });
  });

  // ---- Submit: validate everything, show loading state ----
  form.addEventListener("submit", (e) => {
    let valid = true;

    [studentID, firstName, lastName].forEach((el) => {
      if (el && !validateField(el)) valid = false;
    });

    document.querySelectorAll(".dropzone").forEach((zone) => {
      const input = zone.querySelector("input[type=file]");
      const ok = input.files && input.files.length > 0;
      zone.classList.toggle("is-invalid", !ok);
      if (!ok) valid = false;
    });

    if (!valid) {
      e.preventDefault();
      const firstInvalid = form.querySelector(".is-invalid input, .is-invalid");
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;
  });
})();
