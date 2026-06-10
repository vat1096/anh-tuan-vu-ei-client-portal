// Remplacez cette valeur par l'URL de votre Google Apps Script déployé en Web App.
// Elle doit se terminer par /exec, par exemple : https://script.google.com/macros/s/XXXX/exec
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwYxMXAjOh41PYniKpmWMiqJ3PYWwg09EH9BdsK1qN3F6LVkXvJtaEnYG5q3zAtvbKxVA/exec";

const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".form-section");
const statusBox = document.getElementById("status");
const form = document.getElementById("clientForm");

function showSection(id) {
  sections.forEach(section => section.classList.toggle("active", section.id === id));
  navButtons.forEach(button => button.classList.toggle("active", button.dataset.target === id));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach(button => button.addEventListener("click", () => showSection(button.dataset.target)));
document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click", () => showSection(button.dataset.next)));

function showStatus(message, type = "success") {
  statusBox.textContent = message;
  statusBox.className = `status show ${type}`;
  statusBox.scrollIntoView({ behavior: "smooth", block: "center" });
}

function collectFormData(formElement) {
  const formData = new FormData(formElement);
  const data = {};

  for (const [key, value] of formData.entries()) {
    if (data[key]) {
      data[key] = `${data[key]} | ${value}`;
    } else {
      data[key] = value;
    }
  }

  data.submitted_at = new Date().toISOString();
  data.source = window.location.href;
  data.company_owner = "Anh Tuan VU EI";
  data.owner_siret = "10015047300013";
  return data;
}

function validateBeforeSend() {
  const requiredFields = [
    { name: "societe", label: "Nom de la société" },
    { name: "contact_nom", label: "Nom du contact" },
    { name: "projet_nom", label: "Nom du projet" }
  ];

  for (const field of requiredFields) {
    const input = form.elements[field.name];
    if (!input || !String(input.value || "").trim()) {
      showSection("contact");
      input?.focus();
      showStatus(`Merci de renseigner le champ obligatoire : ${field.label}.`, "error");
      return false;
    }
  }

  const privacy = form.elements["privacy_acknowledgement"];
  if (privacy && !privacy.checked) {
    showSection("satisfaction");
    privacy.focus();
    showStatus("Merci de cocher la case de confirmation relative aux mentions de confidentialité avant l’envoi.", "error");
    return false;
  }

  return true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  showStatus("Vérification du formulaire...", "success");

  if (!validateBeforeSend()) return;

  const payload = collectFormData(form);

  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    localStorage.setItem(`vat_form_${Date.now()}`, JSON.stringify(payload));
    showStatus("Le lien Google Apps Script n’est pas configuré dans script.js. Le formulaire n’a pas été envoyé.", "error");
    return;
  }

  if (!GOOGLE_SCRIPT_URL.startsWith("https://script.google.com/macros/s/") || !GOOGLE_SCRIPT_URL.endsWith("/exec")) {
    showStatus("Le lien configuré dans script.js ne ressemble pas à une URL Google Apps Script Web App terminée par /exec.", "error");
    return;
  }

  try {
    showStatus("Envoi en cours...", "success");

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    localStorage.setItem(`vat_last_sent_${Date.now()}`, JSON.stringify(payload));
    form.reset();
    showSection("contact");
    showStatus("Merci, le formulaire a bien été envoyé. Une confirmation peut prendre quelques secondes côté Google Sheets / e-mail.", "success");
  } catch (error) {
    localStorage.setItem(`vat_form_backup_${Date.now()}`, JSON.stringify(payload));
    showStatus("L’envoi a échoué côté navigateur. Une copie locale a été conservée dans ce navigateur.", "error");
    console.error(error);
  }
});
