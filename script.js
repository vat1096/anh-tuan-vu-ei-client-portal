// Remplacez cette valeur par l'URL de votre Google Apps Script déployé en Web App.
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

function showStatus(message, type = "success") {
  statusBox.textContent = message;
  statusBox.className = `status show ${type}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = collectFormData(form);

  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("PASTE_YOUR")) {
    localStorage.setItem(`vat_form_${Date.now()}`, JSON.stringify(payload));
    showStatus("Formulaire enregistré localement dans ce navigateur. Pour centraliser les réponses, configurez l'URL Google Apps Script dans script.js.", "error");
    return;
  }

  try {
    showStatus("Envoi en cours...", "success");
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    form.reset();
    showSection("contact");
    showStatus("Merci, le formulaire a bien été envoyé.", "success");
  } catch (error) {
    localStorage.setItem(`vat_form_backup_${Date.now()}`, JSON.stringify(payload));
    showStatus("L'envoi a échoué. Une copie locale a été conservée dans ce navigateur.", "error");
  }
});
