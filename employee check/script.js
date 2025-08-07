const API_URL = "http://localhost:3000";
let editingId = null;

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(section => section.classList.remove("active"));
  document.getElementById(sectionId).classList.add("active");

  if (sectionId === "employeeList") loadEmployees();
  if (sectionId === "verifyList") loadVerifications();
}

async function loadEmployees() {
  try {
    const res = await fetch(`${API_URL}/users`);
    const users = await res.json();

    const tableBody = document.querySelector("#employeeTable tbody");
    tableBody.innerHTML = "";

    users.forEach(user => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td class="action-buttons">
          <button onclick="editEmployee('${user.id}')">Edit</button>
          <button onclick="deleteEmployee('${user.id}')">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load employees:", err);
  }
}
async function addEmployee() {
  const name = document.getElementById("empName").value.trim();
  const email = document.getElementById("empEmail").value.trim();
  const password = document.getElementById("empPassword").value.trim();
  const error = document.getElementById("addUserError");
  error.style.display = "none";

  if (!name || !email || !password) {
    error.textContent = "All fields are required.";
    error.style.display = "block";
    return;
  }

  if (!isValidEmail(email)) {
    error.textContent = "Invalid email format.";
    error.style.display = "block";
    return;
  }

  try {
    const users = await (await fetch(`${API_URL}/users`)).json();
    const duplicate = users.some(user => user.email === email && user.id !== editingId);

    if (duplicate) {
      error.textContent = "Email already exists.";
      error.style.display = "block";
      return;
    }

    const userData = { name, email, password };

    if (editingId) {
      await fetch(`${API_URL}/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });
      alert("Employee updated successfully.");
      editingId = null;
    } else {
      await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });
      alert("Employee added successfully.");
    }

    resetForm();
    showSection("employeeList");
  } catch (err) {
    console.error("Error saving employee:", err);
  }
}

async function editEmployee(id) {
  try {
    const user = await (await fetch(`${API_URL}/users/${id}`)).json();
    document.getElementById("empName").value = user.name;
    document.getElementById("empEmail").value = user.email;
    document.getElementById("empPassword").value = user.password;
    document.getElementById("formTitle").textContent = "Edit Employee";
    editingId = id;
    showSection("addEmployee");
  } catch (err) {
    console.error("Error editing employee:", err);
  }
}

async function deleteEmployee(id) {
  if (confirm("Are you sure you want to delete this employee?")) {
    try {
      await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
      loadEmployees();
    } catch (err) {
      console.error("Error deleting employee:", err);
    }
  }
}

function resetForm() {
  editingId = null;
  document.getElementById("empName").value = "";
  document.getElementById("empEmail").value = "";
  document.getElementById("empPassword").value = "";
  document.getElementById("addUserError").style.display = "none";
  document.getElementById("formTitle").textContent = "Add New Employee";
}

async function loadVerifications() {
  try {
    const res = await fetch(`${API_URL}/verifications`);
    const verifications = await res.json();
    const tableBody = document.querySelector("#verificationTable tbody");
    tableBody.innerHTML = "";

    if (verifications.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No verification requests found.</td></tr>`;
      return;
    }

    verifications.forEach(v => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${v.name}</td>
        <td>${v.email}</td>
        <td>${v.dob}</td>
        <td>${v.aadhar}</td>
        <td>${v.pan}</td>
        <td>${v.education}</td>
        <td>${v.experience}</td>
        <td id="status-${v.id}">${v.status}</td>
        <td>
          <button onclick="updateStatus('${v.id}', 'Approved')">Approve</button>
          <button onclick="updateStatus('${v.id}', 'Rejected')" style="color:red;">Reject</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading verifications:", err);
  }
}
async function updateStatus(id, newStatus) {
  try {
    const res = await fetch(`${API_URL}/verifications/${id}`);
    if (!res.ok) throw new Error("Verification not found.");

    const verification = await res.json();

    const message = newStatus === "Approved"
      ? "Your verification request has been approved!"
      : "Sorry, your verification request was rejected.";

    const updatedData = {
      ...verification,
      status: newStatus,
      message: message
    };

    const updateRes = await fetch(`${API_URL}/verifications/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedData)
    });

    if (updateRes.ok) {
      document.getElementById(`status-${id}`).textContent = newStatus;
      alert(`Status updated to ${newStatus}`);
    } else {
      alert("Failed to update status.");
    }
  } catch (error) {
    console.error("Update failed:", error);
    alert("Server error. Please try again.");
  }
}

window.onload = () => {
  loadEmployees();
  loadVerifications();
};
