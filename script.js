// Google Apps Script Deployment URL - REPLACE WITH YOUR DEPLOYMENT ID
const APPS_SCRIPT_URL = "https://script.google.com/macros/d/{YOUR_DEPLOYMENT_ID}/usercopy"

// State Management
const appState = {
  cursos: [],
  especialistas: [],
  calendario: [],
  habilidades: [],
  evaluaciones: [],
  documentacion: [],
  pte: [],
  currentUser: {
    nombre: "Usuario",
    email: "usuario@example.com",
    area: "Operación",
  },
}

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners()
  loadAllData()
  restoreUserProfile()
})

// Event Listeners Setup
function initializeEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const section = link.dataset.section
      navigateTo(section)
    })
  })

  // Mobile Menu
  const menuToggle = document.getElementById("menuToggle")
  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMobileMenu)
  }

  // Filters
  document.getElementById("cursosSearch")?.addEventListener("input", filterCursos)
  document.getElementById("nivelFilter")?.addEventListener("change", filterCursos)
  document.getElementById("modalidadFilter")?.addEventListener("change", filterCursos)
  document.getElementById("especialistasSearch")?.addEventListener("input", filterEspecialistas)
  document.getElementById("areaFilter")?.addEventListener("change", filterEspecialistas)
  document.getElementById("areaHabilidadesFilter")?.addEventListener("change", filterHabilidades)
  document.getElementById("docTypeFilter")?.addEventListener("change", filterDocumentacion)

  // Search
  document.getElementById("searchInput")?.addEventListener("input", globalSearch)

  // Profile
  document.getElementById("saveProfile")?.addEventListener("click", saveProfile)

  // Modal
  document.querySelector(".modal-close")?.addEventListener("click", closeModal)
  document.getElementById("detailsModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("detailsModal")) {
      closeModal()
    }
  })

  // Calendar Navigation
  document.getElementById("prevMonth")?.addEventListener("click", previousMonth)
  document.getElementById("nextMonth")?.addEventListener("click", nextMonth)
}

// Navigation
function navigateTo(section) {
  // Hide all sections
  document.querySelectorAll(".content-section").forEach((s) => s.classList.remove("active"))

  // Show selected section
  const selectedSection = document.getElementById(section)
  if (selectedSection) {
    selectedSection.classList.add("active")
  }

  // Update active nav link
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active")
    if (link.dataset.section === section) {
      link.classList.add("active")
    }
  })

  // Render section-specific content
  if (section === "cursos") renderCursos()
  if (section === "especialistas") renderEspecialistas()
  if (section === "calendario") renderCalendar()
  if (section === "habilidades") renderHabilidades()
  if (section === "evaluaciones") renderEvaluaciones()
  if (section === "documentacion") renderDocumentacion()
  if (section === "pte") renderPTE()
  if (section === "home") renderHome()

  // Close mobile menu
  document.querySelector(".nav-menu")?.classList.remove("active")

  // Scroll to top
  window.scrollTo(0, 0)
}

function toggleMobileMenu() {
  const navMenu = document.querySelector(".nav-menu")
  navMenu?.classList.toggle("active")
}

// Data Loading
async function loadAllData() {
  showLoading(true)
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ action: "getAllData" }),
    })

    if (!response.ok) throw new Error("Network error")

    const result = await response.json()
    if (result.success) {
      appState.cursos = result.data.cursos || []
      appState.especialistas = result.data.especialistas || []
      appState.calendario = result.data.calendario || []
      appState.habilidades = result.data.habilidades || []
      appState.evaluaciones = result.data.evaluaciones || []
      appState.documentacion = result.data.documentacion || []
      appState.pte = result.data.pte || []
      updateDashboardCounts()
      renderHome()
    }
  } catch (error) {
    console.error("Error loading data:", error)
    showError("Error al cargar datos. Por favor, verifica tu configuración.")
  } finally {
    showLoading(false)
  }
}

function showLoading(show) {
  const loading = document.getElementById("loading")
  if (loading) {
    loading.style.display = show ? "flex" : "none"
  }
}

function showError(message) {
  alert("❌ " + message)
}

// Home Section
function renderHome() {
  const container = document.getElementById("homeCoursesContainer")
  if (!container) return

  const topCoursos = appState.cursos.slice(0, 3)
  container.innerHTML = topCoursos.map((curso) => createCourseCard(curso)).join("")

  document.querySelectorAll(".course-card").forEach((card) => {
    card.addEventListener("click", () => {
      const cursoId = card.dataset.id
      const curso = appState.cursos.find((c) => c.id === cursoId)
      if (curso) showModal(curso, "curso")
    })
  })
}

// Dashboard Counts
function updateDashboardCounts() {
  document.getElementById("cursosCount").textContent = appState.cursos.length
  document.getElementById("especialistasCount").textContent = appState.especialistas.length
  document.getElementById("certificacionesCount").textContent = appState.evaluaciones.filter(
    (e) => e.estado === "Completado",
  ).length
}

// Cursos Section
function renderCursos() {
  filterCursos()
}

function filterCursos() {
  const searchTerm = document.getElementById("cursosSearch")?.value.toLowerCase() || ""
  const nivel = document.getElementById("nivelFilter")?.value || ""
  const modalidad = document.getElementById("modalidadFilter")?.value || ""

  const filtered = appState.cursos.filter((curso) => {
    const matchSearch =
      !searchTerm ||
      curso.titulo.toLowerCase().includes(searchTerm) ||
      curso.descripcion.toLowerCase().includes(searchTerm)
    const matchNivel = !nivel || curso.nivel === nivel
    const matchModalidad = !modalidad || curso.modalidad === modalidad
    return matchSearch && matchNivel && matchModalidad
  })

  const container = document.getElementById("cursosContainer")
  if (!container) return

  container.innerHTML = filtered.map((curso) => createCourseCard(curso)).join("")

  document.querySelectorAll(".course-card").forEach((card) => {
    card.addEventListener("click", () => {
      const cursoId = card.dataset.id
      const curso = appState.cursos.find((c) => c.id === cursoId)
      if (curso) showModal(curso, "curso")
    })
  })
}

function createCourseCard(curso) {
  return `
        <div class="course-card" data-id="${curso.id}">
            <div class="card-header">
                <h3>${curso.titulo}</h3>
            </div>
            <div class="card-body">
                <p class="card-subtitle">${curso.descripcion}</p>
                <div>
                    <span class="card-badge">${curso.nivel}</span>
                    <span class="card-badge">${curso.modalidad}</span>
                </div>
                <p style="font-size: 12px; color: #718096;">📚 ${curso.duracion || "N/A"}</p>
            </div>
        </div>
    `
}

// Especialistas Section
function renderEspecialistas() {
  filterEspecialistas()
}

function filterEspecialistas() {
  const searchTerm = document.getElementById("especialistasSearch")?.value.toLowerCase() || ""
  const area = document.getElementById("areaFilter")?.value || ""

  const filtered = appState.especialistas.filter((esp) => {
    const matchSearch =
      !searchTerm ||
      esp.nombre.toLowerCase().includes(searchTerm) ||
      esp.especialidad.toLowerCase().includes(searchTerm)
    const matchArea = !area || esp.area === area
    return matchSearch && matchArea
  })

  const container = document.getElementById("especialistasContainer")
  if (!container) return

  container.innerHTML = filtered.map((esp) => createSpecialistCard(esp)).join("")

  document.querySelectorAll(".specialist-card").forEach((card) => {
    card.addEventListener("click", () => {
      const espId = card.dataset.id
      const esp = appState.especialistas.find((e) => e.id === espId)
      if (esp) showModal(esp, "especialista")
    })
  })
}

function createSpecialistCard(esp) {
  return `
        <div class="specialist-card" data-id="${esp.id}">
            <div class="card-header">
                <h3>${esp.especialidad}</h3>
            </div>
            <div class="card-body">
                <p class="card-title">${esp.nombre}</p>
                <p class="card-subtitle">${esp.area}</p>
                <p style="font-size: 12px; color: #718096;">🎓 ${esp.certificaciones || "N/A"}</p>
            </div>
        </div>
    `
}

// Habilidades Section
function renderHabilidades() {
  filterHabilidades()
}

function filterHabilidades() {
  const area = document.getElementById("areaHabilidadesFilter")?.value || ""

  const filtered = appState.habilidades.filter((hab) => {
    return !area || hab.area === area
  })

  const container = document.getElementById("habilidadesContainer")
  if (!container) return

  if (filtered.length === 0) {
    container.innerHTML = '<p style="padding: 40px; text-align: center;">Sin habilidades registradas</p>'
    return
  }

  let html = `
        <table>
            <thead>
                <tr>
                    <th>Empleado</th>
                    <th>Habilidad</th>
                    <th>Nivel</th>
                    <th>Progreso</th>
                </tr>
            </thead>
            <tbody>
    `

  filtered.forEach((hab) => {
    const nivelNum = Number.parseInt(hab.nivel) || 0
    html += `
            <tr>
                <td>${hab.empleado}</td>
                <td>${hab.habilidad}</td>
                <td>N${hab.nivel}</td>
                <td>
                    <div class="skill-level">
                        ${[1, 2, 3, 4].map((n, i) => `<div class="level-indicator ${i < nivelNum ? "filled" : ""}"></div>`).join("")}
                    </div>
                </td>
            </tr>
        `
  })

  html += `</tbody></table>`
  container.innerHTML = html
}

// Evaluaciones Section
function renderEvaluaciones() {
  const container = document.getElementById("evaluacionesContainer")
  if (!container) return

  container.innerHTML = appState.evaluaciones
    .map(
      (evaluation) => `
        <div class="eval-card">
            <h4 class="eval-title">${evaluation.nombre}</h4>
            <p style="font-size: 12px; color: #718096; margin-bottom: 15px;">${evaluation.tipo}</p>
            <div class="eval-progress">
                <div class="eval-label">Progreso: ${evaluation.progreso}%</div>
                <div class="eval-bar">
                    <div class="eval-bar-fill" style="width: ${evaluation.progreso}%"></div>
                </div>
            </div>
            <p style="font-size: 12px;">Estado: <span class="card-badge ${evaluation.estado === "Completado" ? "success" : evaluation.estado === "En Proceso" ? "warning" : ""}">${evaluation.estado}</span></p>
        </div>
    `,
    )
    .join("")
}

// Documentación Section
function renderDocumentacion() {
  filterDocumentacion()
}

function filterDocumentacion() {
  const tipo = document.getElementById("docTypeFilter")?.value || ""

  const filtered = appState.documentacion.filter((doc) => {
    return !tipo || doc.tipo === tipo
  })

  const container = document.getElementById("documentacionContainer")
  if (!container) return

  container.innerHTML = filtered
    .map(
      (doc) => `
        <div class="doc-card">
            <div class="doc-header">${doc.tipo}</div>
            <div class="card-body">
                <h4 class="card-title">${doc.titulo}</h4>
                <p class="card-subtitle">${doc.descripcion}</p>
                <a href="${doc.url || "#"}" target="_blank" class="btn-primary" style="font-size: 12px; padding: 8px 12px;">Ver Documento</a>
            </div>
        </div>
    `,
    )
    .join("")
}

// PTE Section
function renderPTE() {
  const container = document.getElementById("pteContainer")
  if (!container) return

  container.innerHTML = appState.pte
    .map(
      (task) => `
        <div class="pte-task">
            <div class="pte-header">
                <input type="checkbox" class="pte-checkbox" ${task.completado ? "checked" : ""}>
                <h4 class="pte-title">${task.titulo}</h4>
            </div>
            <p style="font-size: 12px; color: #718096; margin-bottom: 15px;">${task.descripcion}</p>
            ${
              task.subtareas
                ? `
                <ul class="pte-checklist">
                    ${task.subtareas
                      .split(",")
                      .map((st) => `<li><input type="checkbox"> ${st.trim()}</li>`)
                      .join("")}
                </ul>
            `
                : ""
            }
        </div>
    `,
    )
    .join("")
}

// Calendar Functions
const currentDate = new Date()

function renderCalendar() {
  renderCalendarDays()
  renderCalendarEvents()
}

function renderCalendarDays() {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const calendar = document.getElementById("calendar")
  const monthDisplay = document.getElementById("currentMonth")
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  monthDisplay.textContent = `${monthNames[month]} ${year}`

  calendar.innerHTML = ""

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const dayEl = document.createElement("div")
    dayEl.className = "calendar-day other-month"
    dayEl.textContent = day
    calendar.appendChild(dayEl)
  }

  // Current month days
  const today = new Date()
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEl = document.createElement("div")
    dayEl.className = "calendar-day"
    dayEl.textContent = day

    if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
      dayEl.classList.add("today")
    }

    const dayEvents = appState.calendario.filter((e) => {
      const eDate = new Date(e.fecha)
      return eDate.getFullYear() === year && eDate.getMonth() === month && eDate.getDate() === day
    })

    if (dayEvents.length > 0) {
      dayEl.classList.add("has-events")
    }

    dayEl.addEventListener("click", () => renderCalendarEvents(day, month, year))
    calendar.appendChild(dayEl)
  }

  // Next month days
  const totalCells = calendar.children.length
  const remainingCells = 42 - totalCells
  for (let day = 1; day <= remainingCells; day++) {
    const dayEl = document.createElement("div")
    dayEl.className = "calendar-day other-month"
    dayEl.textContent = day
    calendar.appendChild(dayEl)
  }
}

function renderCalendarEvents(day, month, year) {
  const selectedDate = new Date(year || currentDate.getFullYear(), month || currentDate.getMonth(), day || 1)
  const dayEvents = appState.calendario.filter((e) => {
    const eDate = new Date(e.fecha)
    return eDate.toDateString() === selectedDate.toDateString()
  })

  const eventsList = document.getElementById("eventsList")
  if (!eventsList) return

  if (dayEvents.length === 0) {
    eventsList.innerHTML =
      '<p style="color: #718096; padding: 20px; text-align: center;">No hay eventos programados</p>'
    return
  }

  eventsList.innerHTML = dayEvents
    .map(
      (event) => `
        <div class="event-item">
            <div class="event-title">${event.titulo}</div>
            <div class="event-time">🕐 ${event.hora || "Hora no especificada"}</div>
            <p style="font-size: 12px; margin-top: 5px;">${event.descripcion || ""}</p>
        </div>
    `,
    )
    .join("")
}

function previousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1)
  renderCalendarDays()
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1)
  renderCalendarDays()
}

// Modal Functions
function showModal(data, type) {
  const modal = document.getElementById("detailsModal")
  const modalBody = document.getElementById("modalBody")

  let html = ""

  if (type === "curso") {
    html = `
            <h2>${data.titulo}</h2>
            <p><strong>Descripción:</strong> ${data.descripcion}</p>
            <p><strong>Nivel:</strong> ${data.nivel}</p>
            <p><strong>Modalidad:</strong> ${data.modalidad}</p>
            <p><strong>Duración:</strong> ${data.duracion}</p>
            <p><strong>Instructor:</strong> ${data.instructor || "N/A"}</p>
            <button class="btn-primary" onclick="enrollCourse('${data.id}')">Inscribirse</button>
        `
  } else if (type === "especialista") {
    html = `
            <h2>${data.nombre}</h2>
            <p><strong>Especialidad:</strong> ${data.especialidad}</p>
            <p><strong>Área:</strong> ${data.area}</p>
            <p><strong>Certificaciones:</strong> ${data.certificaciones}</p>
            <p><strong>Experiencia:</strong> ${data.experiencia || "N/A"}</p>
        `
  }

  modalBody.innerHTML = html
  modal.classList.add("active")
}

function closeModal() {
  document.getElementById("detailsModal").classList.remove("active")
}

function enrollCourse(cursoId) {
  alert("✓ ¡Te has inscrito al curso! Se enviará un email de confirmación.")
  closeModal()
}

// Profile Functions
function saveProfile() {
  const nombre = document.getElementById("userName")?.value || appState.currentUser.nombre
  const email = document.getElementById("userEmail")?.value || appState.currentUser.email
  const area = document.getElementById("userArea")?.value || appState.currentUser.area

  appState.currentUser = { nombre, email, area }
  localStorage.setItem("userProfile", JSON.stringify(appState.currentUser))
  alert("✓ Perfil guardado correctamente")
}

function restoreUserProfile() {
  const saved = localStorage.getItem("userProfile")
  if (saved) {
    appState.currentUser = JSON.parse(saved)
    document.getElementById("userName").value = appState.currentUser.nombre
    document.getElementById("userEmail").value = appState.currentUser.email
    document.getElementById("userArea").value = appState.currentUser.area
  }
}

// Global Search
function globalSearch() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase()
  if (!searchTerm) return

  const results = []

  appState.cursos.forEach((c) => {
    if (c.titulo.toLowerCase().includes(searchTerm) || c.descripcion.toLowerCase().includes(searchTerm)) {
      results.push({ type: "Curso", title: c.titulo, section: "cursos", id: c.id })
    }
  })

  appState.especialistas.forEach((e) => {
    if (e.nombre.toLowerCase().includes(searchTerm) || e.especialidad.toLowerCase().includes(searchTerm)) {
      results.push({ type: "Especialista", title: e.nombre, section: "especialistas", id: e.id })
    }
  })

  if (results.length > 0) {
    console.log("Search results:", results)
    navigateTo(results[0].section)
  } else {
    alert("No se encontraron resultados")
  }
}
