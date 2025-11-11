const $ = (sel) => document.querySelector(sel);
const API = {
  items: "/api/items",
  people: "/api/people",
  services: "/api/services"
};

// ===== SESSION MANAGEMENT =====
let currentSession = localStorage.getItem('sessionId') || '';

const authHeaders = {
  'Content-Type': 'application/json',
  'Authorization': currentSession
};

// Helper function for authenticated fetch
const authFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers
    }
  });
};

// ===== LOGIN HANDLING =====
const loginForm = $("#loginForm");
const logoutBtn = $("#logoutBtn");
const loginMsg = $("#loginMsg");
const tabs = document.querySelector(".tabs");
const sections = document.querySelectorAll(".tab");

// Initialize UI state
tabs.style.display = "none";
sections.forEach(s => s.style.display = "none");

// Check if already logged in on page load
if (currentSession) {
  // Verify session is still valid
  authFetch("/api/items")
    .then(res => {
      if (res.ok) {
        // Session is valid, show app
        loginForm.style.display = "none";
        logoutBtn.style.display = "inline";
        tabs.style.display = "block";
        sections.forEach(s => s.style.display = "block");
        loadItems();
        loadPeople();
        loadServices();
        loginMsg.textContent = "✅ Welcome back!";
      } else {
        // Session invalid, clear it
        localStorage.removeItem('sessionId');
        currentSession = '';
        authHeaders.Authorization = '';
      }
    })
    .catch(() => {
      // Network error, clear session
      localStorage.removeItem('sessionId');
      currentSession = '';
      authHeaders.Authorization = '';
    });
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = $("#loginUser").value.trim();
  const password = $("#loginPass").value.trim();

  if (!username || !password) {
    loginMsg.textContent = "Please enter both username and password";
    return;
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (res.ok) {
      loginMsg.textContent = "✅ Logged in!";
      currentSession = data.sessionId;
      localStorage.setItem('sessionId', currentSession);
      authHeaders.Authorization = currentSession;
      
      loginForm.style.display = "none";
      logoutBtn.style.display = "inline";
      tabs.style.display = "block";
      sections.forEach(s => s.style.display = "block");
      loadItems();
      loadPeople();
      loadServices();
    } else {
      loginMsg.textContent = data.error || "Login failed";
    }
  } catch (error) {
    console.error("Login error:", error);
    loginMsg.textContent = "Network error - please try again";
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await authFetch("/api/logout", { method: "POST" });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    localStorage.removeItem('sessionId');
    currentSession = '';
    authHeaders.Authorization = '';
    
    loginMsg.textContent = "Logged out";
    loginForm.style.display = "block";
    logoutBtn.style.display = "none";
    tabs.style.display = "none";
    sections.forEach(s => s.style.display = "none");
    
    // Clear form fields
    $("#loginUser").value = "";
    $("#loginPass").value = "";
  }
});

// ===== TABS =====
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelector(`#${btn.dataset.tab}`).classList.add("active");
  });
});

/* ================= ITEMS ================= */
const tableBody = document.querySelector("#itemsTable tbody");
const itemForm = $("#itemForm");
const itemIdInput = $("#itemId");
const nameInput = $("#name");
const descInput = $("#description");

async function loadItems() {
  try {
    const res = await authFetch(API.items);
    if (!res.ok) {
      if (res.status === 401) {
        // Not authenticated, redirect to login
        localStorage.removeItem('sessionId');
        currentSession = '';
        window.location.reload();
      }
      return;
    }
    const items = await res.json();
    tableBody.innerHTML = "";
    items.forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.description ?? ""}</td>
        <td>
          <button data-edit="${item.id}">✏️</button>
          <button data-del="${item.id}">🗑️</button>
        </td>`;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading items:", error);
  }
}

itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = itemIdInput.value;
  const payload = { 
    name: nameInput.value.trim(), 
    description: descInput.value.trim() 
  };
  
  if (!payload.name) {
    alert("Name is required");
    return;
  }

  try {
    const method = id ? "PUT" : "POST";
    const url = id ? `${API.items}/${id}` : API.items;
    const res = await authFetch(url, { 
      method, 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(payload) 
    });
    
    if (res.ok) {
      itemForm.reset();
      itemIdInput.value = "";
      loadItems();
    } else {
      const error = await res.json();
      alert(error.error || "Operation failed");
    }
  } catch (error) {
    console.error("Error saving item:", error);
    alert("Error saving item");
  }
});

tableBody.addEventListener("click", async (e) => {
  const editId = e.target.getAttribute("data-edit");
  const delId = e.target.getAttribute("data-del");
  
  if (editId) {
    try {
      const res = await authFetch(`${API.items}/${editId}`);
      if (res.ok) {
        const item = await res.json();
        itemIdInput.value = item.id;
        nameInput.value = item.name;
        descInput.value = item.description || "";
      }
    } catch (error) {
      console.error("Error loading item:", error);
    }
  } else if (delId) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const res = await authFetch(`${API.items}/${delId}`, { method: "DELETE" });
      if (res.ok) {
        loadItems();
      } else {
        alert("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item");
    }
  }
});

/* ================= PEOPLE ================= */
const peopleBody = $("#peopleTable tbody");
const personForm = $("#personForm");

async function loadPeople() {
  try {
    const res = await authFetch(API.people);
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('sessionId');
        currentSession = '';
        window.location.reload();
      }
      return;
    }
    const people = await res.json();
    peopleBody.innerHTML = "";
    people.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.name}</td>
        <td>${p.email}</td>
        <td>${p.services || ""}</td>`;
      peopleBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading people:", error);
  }
}

personForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = { 
    name: $("#personName").value.trim(), 
    email: $("#personEmail").value.trim() 
  };
  
  if (!payload.name || !payload.email) {
    alert("Name and Email are required");
    return;
  }

  try {
    const res = await authFetch(API.people, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(payload) 
    });
    
    if (res.ok) {
      personForm.reset();
      loadPeople();
    } else {
      const error = await res.json();
      alert(error.error || "Failed to add person");
    }
  } catch (error) {
    console.error("Error adding person:", error);
    alert("Error adding person");
  }
});

/* ================= SERVICES ================= */
const svcBody = $("#servicesTable tbody");
const svcForm = $("#serviceForm");
const assignForm = $("#assignForm");

async function loadServices() {
  try {
    const res = await authFetch(API.services);
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('sessionId');
        currentSession = '';
        window.location.reload();
      }
      return;
    }
    const svcs = await res.json();
    svcBody.innerHTML = "";
    svcs.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.id}</td>
        <td>${s.title}</td>
        <td>${s.description || ""}</td>`;
      svcBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading services:", error);
  }
}

svcForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = { 
    title: $("#serviceTitle").value.trim(), 
    description: $("#serviceDesc").value.trim() 
  };
  
  if (!payload.title) {
    alert("Title is required");
    return;
  }

  try {
    const res = await authFetch(API.services, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(payload) 
    });
    
    if (res.ok) {
      svcForm.reset();
      loadServices();
    } else {
      const error = await res.json();
      alert(error.error || "Failed to add service");
    }
  } catch (error) {
    console.error("Error adding service:", error);
    alert("Error adding service");
  }
});

assignForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pid = $("#assignPersonId").value.trim();
  const sid = $("#assignServiceId").value.trim();
  
  if (!pid || !sid) {
    alert("Both Person ID and Service ID are required");
    return;
  }

  try {
    const res = await authFetch(`/api/people/${pid}/services/${sid}`, { 
      method: "POST" 
    });
    
    if (res.ok) {
      assignForm.reset();
      loadPeople();
      alert("Service assigned successfully!");
    } else {
      const error = await res.json();
      alert(error.error || "Failed to assign service");
    }
  } catch (error) {
    console.error("Error assigning service:", error);
    alert("Error assigning service");
  }
});

// Initialize the app
if (currentSession) {
  // Already handled in the session check above
} else {
  // Ensure login form is visible
  loginForm.style.display = "block";
}
