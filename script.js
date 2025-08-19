// Ligação ao Supabase
const supabaseUrl = 'https://xapsmthrcdinxpaxppap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhcHNtdGhyY2RpbnhwYXhwcGFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NjQ2NjMsImV4cCI6MjA3MDQ0MDY2M30.k6QmIZzc4Ny8K4asiKPKGeV2Tc1v1eO1qLVqt_3Mm7g';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let jobs = [];
let sortDirection = 1;
let currentUser = null;

// Login
document.getElementById("loginBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Login failed: " + error.message);
    } else {
        currentUser = data.user;
        document.getElementById("auth-section").style.display = "none";
        document.getElementById("searchInput").style.display = "block";
        document.getElementById("main-section").style.display = "block";
        document.getElementById("logoutBtn").style.display = "inline-block";
        loadJobs();
    }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    location.reload();
});

// Load jobs from Supabase
async function loadJobs() {
    const { data, error } = await supabaseClient
        .from("vagas")
        .select("*")
        .eq("user_id", currentUser.id);

    if (error) {
        console.error(error);
        return;
    }
    jobs = data;
    renderTable(jobs);
}

// Render table
function renderTable(data) {
    const tbody = document.querySelector("#jobsTable tbody");
    tbody.innerHTML = "";

    data.forEach((job) => {
        const tr = document.createElement("tr");

        const statusDropdown = document.createElement("select");
        ["To send", "Sent", "Interview", "Rejected", "Offer"].forEach(s => {
            const opt = document.createElement("option");
            opt.value = s;
            opt.textContent = s;
            if (job.status === s) opt.selected = true;
            statusDropdown.appendChild(opt);
        });
        statusDropdown.addEventListener("change", () => updateStatus(job.id, statusDropdown.value));

        const notesArea = document.createElement("textarea");
        notesArea.value = job.notes || "";
        notesArea.addEventListener("input", () => updateNotes(job.id, notesArea.value));

        tr.innerHTML = `
            <td>${job.company}</td>
            <td>${job.position}</td>
            <td>${job.aiRisk}</td>
            <td>${job.fit}</td>
            <td>${job.sector}</td>
        `;
        const statusTd = document.createElement("td");
        statusTd.appendChild(statusDropdown);
        tr.appendChild(statusTd);

        const notesTd = document.createElement("td");
        notesTd.appendChild(notesArea);
        tr.appendChild(notesTd);

        const linkTd = document.createElement("td");
        linkTd.innerHTML = `<a class="link-btn" href="${job.link}" target="_blank">Open</a>`;
        tr.appendChild(linkTd);

        tbody.appendChild(tr);
    });
}

// Add job
document.getElementById("addJobBtn").addEventListener("click", async () => {
    const newJob = {
        company: document.getElementById("newCompany").value,
        position: document.getElementById("newPosition").value,
        aiRisk: document.getElementById("newAiRisk").value,
        fit: document.getElementById("newFit").value,
        sector: document.getElementById("newSector").value,
        link: document.getElementById("newLink").value,
        status: "To send",
        notes: "",
        user_id: currentUser.id
    };

    const { data, error } = await supabaseClient.from("vagas").insert([newJob]);
    if (error) {
        alert("Error adding job: " + error.message);
    } else {
        loadJobs();
        document.querySelectorAll("#new-job-form input").forEach(input => input.value = "");
    }
});

// Update status
async function updateStatus(id, status) {
    await supabaseClient.from("vagas").update({ status }).eq("id", id);
}

// Update notes
async function updateNotes(id, notes) {
    await supabaseClient.from("vagas").update({ notes }).eq("id", id);
}

// Search filter
document.getElementById("searchInput").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = jobs.filter(j =>
        j.company.toLowerCase().includes(term) ||
        j.position.toLowerCase().includes(term)
    );
    renderTable(filtered);
});


