// Disciplinary Management System JavaScript

// Data storage keys
const STORAGE_KEYS = {
    users: 'dms_users',
    incidents: 'dms_incidents',
    actions: 'dms_actions',
    settings: 'dms_settings'
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDashboard();
});

// Initialize application with sample data if empty
function initializeApp() {
    if (!localStorage.getItem(STORAGE_KEYS.users)) {
        const sampleUsers = [
            {
                id: 1,
                name: 'John Smith',
                email: 'john.smith@school.edu',
                role: 'Student',
                department: 'Computer Science',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Jane Doe',
                email: 'jane.doe@school.edu',
                role: 'Student',
                department: 'Mathematics',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Dr. Wilson',
                email: 'wilson@school.edu',
                role: 'Faculty',
                department: 'Administration',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(sampleUsers));
    }

    if (!localStorage.getItem(STORAGE_KEYS.incidents)) {
        localStorage.setItem(STORAGE_KEYS.incidents, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.actions)) {
        localStorage.setItem(STORAGE_KEYS.actions, JSON.stringify([]));
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            showSection(section);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// Show specific section
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');

    // Load section data
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'incidents':
            loadIncidents();
            break;
        case 'actions':
            loadActions();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// Dashboard functions
function loadDashboard() {
    const users = getUsers();
    const incidents = getIncidents();
    const actions = getActions();

    document.getElementById('total-users').textContent = users.length;
    document.getElementById('open-incidents').textContent = incidents.filter(i => i.status === 'open').length;
    document.getElementById('resolved-incidents').textContent = incidents.filter(i => i.status === 'resolved').length;
    document.getElementById('pending-actions').textContent = actions.filter(a => a.status === 'pending').length;

    loadRecentActivity();
}

function loadRecentActivity() {
    const incidents = getIncidents();
    const actions = getActions();
    const users = getUsers();
    
    let activities = [];
    
    // Add recent incidents
    incidents.slice(-5).forEach(incident => {
        const user = users.find(u => u.id === incident.userId);
        activities.push({
            type: 'incident',
            message: `New incident reported for ${user ? user.name : 'Unknown User'}: ${incident.type}`,
            timestamp: incident.createdAt
        });
    });
    
    // Add recent actions
    actions.slice(-5).forEach(action => {
        const user = users.find(u => u.id === action.userId);
        activities.push({
            type: 'action',
            message: `Disciplinary action assigned to ${user ? user.name : 'Unknown User'}: ${action.actionType}`,
            timestamp: action.createdAt
        });
    });
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const activityList = document.getElementById('recent-activity-list');
    activityList.innerHTML = '';
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p class="text-center">No recent activity</p>';
        return;
    }
    
    activities.slice(0, 10).forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div>${activity.message}</div>
            <div class="timestamp">${formatDate(activity.timestamp)}</div>
        `;
        activityList.appendChild(activityItem);
    });
}

// User management functions
function loadUsers() {
    const users = getUsers();
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.department}</td>
            <td>
                <button class="btn btn-secondary" onclick="editUser(${user.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteUser(${user.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddUserForm() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Add New User</h3>
        <form id="user-form" onsubmit="saveUser(event)">
            <div class="form-group">
                <label for="user-name">Name:</label>
                <input type="text" id="user-name" required>
            </div>
            <div class="form-group">
                <label for="user-email">Email:</label>
                <input type="email" id="user-email" required>
            </div>
            <div class="form-group">
                <label for="user-role">Role:</label>
                <select id="user-role" required>
                    <option value="">Select Role</option>
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Staff">Staff</option>
                    <option value="Administrator">Administrator</option>
                </select>
            </div>
            <div class="form-group">
                <label for="user-department">Department:</label>
                <input type="text" id="user-department" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save User</button>
            </div>
        </form>
    `;
    showModal();
}

function saveUser(event) {
    event.preventDefault();
    
    const users = getUsers();
    const newUser = {
        id: Date.now(),
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        role: document.getElementById('user-role').value,
        department: document.getElementById('user-department').value,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    closeModal();
    loadUsers();
    loadDashboard();
}

function editUser(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Edit User</h3>
        <form id="user-form" onsubmit="updateUser(event, ${userId})">
            <div class="form-group">
                <label for="user-name">Name:</label>
                <input type="text" id="user-name" value="${user.name}" required>
            </div>
            <div class="form-group">
                <label for="user-email">Email:</label>
                <input type="email" id="user-email" value="${user.email}" required>
            </div>
            <div class="form-group">
                <label for="user-role">Role:</label>
                <select id="user-role" required>
                    <option value="Student" ${user.role === 'Student' ? 'selected' : ''}>Student</option>
                    <option value="Faculty" ${user.role === 'Faculty' ? 'selected' : ''}>Faculty</option>
                    <option value="Staff" ${user.role === 'Staff' ? 'selected' : ''}>Staff</option>
                    <option value="Administrator" ${user.role === 'Administrator' ? 'selected' : ''}>Administrator</option>
                </select>
            </div>
            <div class="form-group">
                <label for="user-department">Department:</label>
                <input type="text" id="user-department" value="${user.department}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Update User</button>
            </div>
        </form>
    `;
    showModal();
}

function updateUser(event, userId) {
    event.preventDefault();
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) return;
    
    users[userIndex] = {
        ...users[userIndex],
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        role: document.getElementById('user-role').value,
        department: document.getElementById('user-department').value,
        updatedAt: new Date().toISOString()
    };
    
    saveUsers(users);
    closeModal();
    loadUsers();
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        const users = getUsers();
        const filteredUsers = users.filter(u => u.id !== userId);
        saveUsers(filteredUsers);
        loadUsers();
        loadDashboard();
    }
}

// Incident management functions
function loadIncidents() {
    const incidents = getIncidents();
    const users = getUsers();
    const tbody = document.getElementById('incidents-table-body');
    tbody.innerHTML = '';

    incidents.forEach(incident => {
        const user = users.find(u => u.id === incident.userId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${incident.id}</td>
            <td>${formatDate(incident.date)}</td>
            <td>${user ? user.name : 'Unknown User'}</td>
            <td>${incident.type}</td>
            <td><span class="status-badge severity-${incident.severity}">${incident.severity}</span></td>
            <td><span class="status-badge status-${incident.status}">${incident.status}</span></td>
            <td>
                <button class="btn btn-secondary" onclick="viewIncident(${incident.id})">View</button>
                <button class="btn btn-secondary" onclick="editIncident(${incident.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteIncident(${incident.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddIncidentForm() {
    const users = getUsers();
    const userOptions = users.map(user => 
        `<option value="${user.id}">${user.name} (${user.role})</option>`
    ).join('');
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Record New Incident</h3>
        <form id="incident-form" onsubmit="saveIncident(event)">
            <div class="form-group">
                <label for="incident-user">User:</label>
                <select id="incident-user" required>
                    <option value="">Select User</option>
                    ${userOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="incident-type">Incident Type:</label>
                <select id="incident-type" required>
                    <option value="">Select Type</option>
                    <option value="Academic Misconduct">Academic Misconduct</option>
                    <option value="Behavioral Issue">Behavioral Issue</option>
                    <option value="Attendance">Attendance</option>
                    <option value="Violence">Violence</option>
                    <option value="Harassment">Harassment</option>
                    <option value="Property Damage">Property Damage</option>
                    <option value="Substance Abuse">Substance Abuse</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label for="incident-severity">Severity:</label>
                <select id="incident-severity" required>
                    <option value="">Select Severity</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
            </div>
            <div class="form-group">
                <label for="incident-date">Date:</label>
                <input type="date" id="incident-date" required>
            </div>
            <div class="form-group">
                <label for="incident-description">Description:</label>
                <textarea id="incident-description" required placeholder="Provide detailed description of the incident..."></textarea>
            </div>
            <div class="form-group">
                <label for="incident-location">Location:</label>
                <input type="text" id="incident-location" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Incident</button>
            </div>
        </form>
    `;
    showModal();
}

function saveIncident(event) {
    event.preventDefault();
    
    const incidents = getIncidents();
    const newIncident = {
        id: Date.now(),
        userId: parseInt(document.getElementById('incident-user').value),
        type: document.getElementById('incident-type').value,
        severity: document.getElementById('incident-severity').value,
        date: document.getElementById('incident-date').value,
        description: document.getElementById('incident-description').value,
        location: document.getElementById('incident-location').value,
        status: 'open',
        createdAt: new Date().toISOString()
    };
    
    incidents.push(newIncident);
    saveIncidents(incidents);
    closeModal();
    loadIncidents();
    loadDashboard();
}

function viewIncident(incidentId) {
    const incidents = getIncidents();
    const users = getUsers();
    const incident = incidents.find(i => i.id === incidentId);
    const user = users.find(u => u.id === incident.userId);
    
    if (!incident) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Incident Details</h3>
        <div class="form-group">
            <label>ID:</label>
            <p>${incident.id}</p>
        </div>
        <div class="form-group">
            <label>User:</label>
            <p>${user ? user.name : 'Unknown User'}</p>
        </div>
        <div class="form-group">
            <label>Type:</label>
            <p>${incident.type}</p>
        </div>
        <div class="form-group">
            <label>Severity:</label>
            <p><span class="status-badge severity-${incident.severity}">${incident.severity}</span></p>
        </div>
        <div class="form-group">
            <label>Date:</label>
            <p>${formatDate(incident.date)}</p>
        </div>
        <div class="form-group">
            <label>Location:</label>
            <p>${incident.location}</p>
        </div>
        <div class="form-group">
            <label>Status:</label>
            <p><span class="status-badge status-${incident.status}">${incident.status}</span></p>
        </div>
        <div class="form-group">
            <label>Description:</label>
            <p>${incident.description}</p>
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>
            <button type="button" class="btn btn-primary" onclick="closeModal(); editIncident(${incidentId})">Edit</button>
        </div>
    `;
    showModal();
}

function editIncident(incidentId) {
    const incidents = getIncidents();
    const users = getUsers();
    const incident = incidents.find(i => i.id === incidentId);
    
    if (!incident) return;
    
    const userOptions = users.map(user => 
        `<option value="${user.id}" ${user.id === incident.userId ? 'selected' : ''}>${user.name} (${user.role})</option>`
    ).join('');
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Edit Incident</h3>
        <form id="incident-form" onsubmit="updateIncident(event, ${incidentId})">
            <div class="form-group">
                <label for="incident-user">User:</label>
                <select id="incident-user" required>
                    ${userOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="incident-type">Incident Type:</label>
                <select id="incident-type" required>
                    <option value="Academic Misconduct" ${incident.type === 'Academic Misconduct' ? 'selected' : ''}>Academic Misconduct</option>
                    <option value="Behavioral Issue" ${incident.type === 'Behavioral Issue' ? 'selected' : ''}>Behavioral Issue</option>
                    <option value="Attendance" ${incident.type === 'Attendance' ? 'selected' : ''}>Attendance</option>
                    <option value="Violence" ${incident.type === 'Violence' ? 'selected' : ''}>Violence</option>
                    <option value="Harassment" ${incident.type === 'Harassment' ? 'selected' : ''}>Harassment</option>
                    <option value="Property Damage" ${incident.type === 'Property Damage' ? 'selected' : ''}>Property Damage</option>
                    <option value="Substance Abuse" ${incident.type === 'Substance Abuse' ? 'selected' : ''}>Substance Abuse</option>
                    <option value="Other" ${incident.type === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label for="incident-severity">Severity:</label>
                <select id="incident-severity" required>
                    <option value="low" ${incident.severity === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${incident.severity === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${incident.severity === 'high' ? 'selected' : ''}>High</option>
                    <option value="critical" ${incident.severity === 'critical' ? 'selected' : ''}>Critical</option>
                </select>
            </div>
            <div class="form-group">
                <label for="incident-status">Status:</label>
                <select id="incident-status" required>
                    <option value="open" ${incident.status === 'open' ? 'selected' : ''}>Open</option>
                    <option value="resolved" ${incident.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                </select>
            </div>
            <div class="form-group">
                <label for="incident-date">Date:</label>
                <input type="date" id="incident-date" value="${incident.date}" required>
            </div>
            <div class="form-group">
                <label for="incident-description">Description:</label>
                <textarea id="incident-description" required>${incident.description}</textarea>
            </div>
            <div class="form-group">
                <label for="incident-location">Location:</label>
                <input type="text" id="incident-location" value="${incident.location}" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Incident</button>
            </div>
        </form>
    `;
    showModal();
}

function updateIncident(event, incidentId) {
    event.preventDefault();
    
    const incidents = getIncidents();
    const incidentIndex = incidents.findIndex(i => i.id === incidentId);
    
    if (incidentIndex === -1) return;
    
    incidents[incidentIndex] = {
        ...incidents[incidentIndex],
        userId: parseInt(document.getElementById('incident-user').value),
        type: document.getElementById('incident-type').value,
        severity: document.getElementById('incident-severity').value,
        status: document.getElementById('incident-status').value,
        date: document.getElementById('incident-date').value,
        description: document.getElementById('incident-description').value,
        location: document.getElementById('incident-location').value,
        updatedAt: new Date().toISOString()
    };
    
    saveIncidents(incidents);
    closeModal();
    loadIncidents();
    loadDashboard();
}

function deleteIncident(incidentId) {
    if (confirm('Are you sure you want to delete this incident?')) {
        const incidents = getIncidents();
        const filteredIncidents = incidents.filter(i => i.id !== incidentId);
        saveIncidents(filteredIncidents);
        loadIncidents();
        loadDashboard();
    }
}

// Action management functions
function loadActions() {
    const actions = getActions();
    const users = getUsers();
    const tbody = document.getElementById('actions-table-body');
    tbody.innerHTML = '';

    actions.forEach(action => {
        const user = users.find(u => u.id === action.userId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${action.id}</td>
            <td>${action.incidentId}</td>
            <td>${user ? user.name : 'Unknown User'}</td>
            <td>${action.actionType}</td>
            <td>${formatDate(action.startDate)}</td>
            <td>${action.endDate ? formatDate(action.endDate) : 'N/A'}</td>
            <td><span class="status-badge status-${action.status}">${action.status}</span></td>
            <td>
                <button class="btn btn-secondary" onclick="viewAction(${action.id})">View</button>
                <button class="btn btn-secondary" onclick="editAction(${action.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteAction(${action.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddActionForm() {
    const users = getUsers();
    const incidents = getIncidents();
    
    const userOptions = users.map(user => 
        `<option value="${user.id}">${user.name} (${user.role})</option>`
    ).join('');
    
    const incidentOptions = incidents.map(incident => 
        `<option value="${incident.id}">Incident #${incident.id} - ${incident.type}</option>`
    ).join('');
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Add Disciplinary Action</h3>
        <form id="action-form" onsubmit="saveAction(event)">
            <div class="form-group">
                <label for="action-incident">Related Incident:</label>
                <select id="action-incident" required>
                    <option value="">Select Incident</option>
                    ${incidentOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="action-user">User:</label>
                <select id="action-user" required>
                    <option value="">Select User</option>
                    ${userOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="action-type">Action Type:</label>
                <select id="action-type" required>
                    <option value="">Select Action</option>
                    <option value="Warning">Warning</option>
                    <option value="Suspension">Suspension</option>
                    <option value="Probation">Probation</option>
                    <option value="Community Service">Community Service</option>
                    <option value="Counseling">Counseling</option>
                    <option value="Expulsion">Expulsion</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label for="action-start-date">Start Date:</label>
                <input type="date" id="action-start-date" required>
            </div>
            <div class="form-group">
                <label for="action-end-date">End Date (if applicable):</label>
                <input type="date" id="action-end-date">
            </div>
            <div class="form-group">
                <label for="action-description">Description:</label>
                <textarea id="action-description" required placeholder="Provide details about the disciplinary action..."></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Action</button>
            </div>
        </form>
    `;
    showModal();
}

function saveAction(event) {
    event.preventDefault();
    
    const actions = getActions();
    const newAction = {
        id: Date.now(),
        incidentId: parseInt(document.getElementById('action-incident').value),
        userId: parseInt(document.getElementById('action-user').value),
        actionType: document.getElementById('action-type').value,
        startDate: document.getElementById('action-start-date').value,
        endDate: document.getElementById('action-end-date').value || null,
        description: document.getElementById('action-description').value,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    actions.push(newAction);
    saveActions(actions);
    closeModal();
    loadActions();
    loadDashboard();
}

function viewAction(actionId) {
    const actions = getActions();
    const users = getUsers();
    const incidents = getIncidents();
    const action = actions.find(a => a.id === actionId);
    const user = users.find(u => u.id === action.userId);
    const incident = incidents.find(i => i.id === action.incidentId);
    
    if (!action) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Action Details</h3>
        <div class="form-group">
            <label>ID:</label>
            <p>${action.id}</p>
        </div>
        <div class="form-group">
            <label>Related Incident:</label>
            <p>Incident #${action.incidentId} - ${incident ? incident.type : 'Unknown'}</p>
        </div>
        <div class="form-group">
            <label>User:</label>
            <p>${user ? user.name : 'Unknown User'}</p>
        </div>
        <div class="form-group">
            <label>Action Type:</label>
            <p>${action.actionType}</p>
        </div>
        <div class="form-group">
            <label>Start Date:</label>
            <p>${formatDate(action.startDate)}</p>
        </div>
        <div class="form-group">
            <label>End Date:</label>
            <p>${action.endDate ? formatDate(action.endDate) : 'N/A'}</p>
        </div>
        <div class="form-group">
            <label>Status:</label>
            <p><span class="status-badge status-${action.status}">${action.status}</span></p>
        </div>
        <div class="form-group">
            <label>Description:</label>
            <p>${action.description}</p>
        </div>
        <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">Close</button>
            <button type="button" class="btn btn-primary" onclick="closeModal(); editAction(${actionId})">Edit</button>
        </div>
    `;
    showModal();
}

function editAction(actionId) {
    const actions = getActions();
    const users = getUsers();
    const incidents = getIncidents();
    const action = actions.find(a => a.id === actionId);
    
    if (!action) return;
    
    const userOptions = users.map(user => 
        `<option value="${user.id}" ${user.id === action.userId ? 'selected' : ''}>${user.name} (${user.role})</option>`
    ).join('');
    
    const incidentOptions = incidents.map(incident => 
        `<option value="${incident.id}" ${incident.id === action.incidentId ? 'selected' : ''}>Incident #${incident.id} - ${incident.type}</option>`
    ).join('');
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Edit Disciplinary Action</h3>
        <form id="action-form" onsubmit="updateAction(event, ${actionId})">
            <div class="form-group">
                <label for="action-incident">Related Incident:</label>
                <select id="action-incident" required>
                    ${incidentOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="action-user">User:</label>
                <select id="action-user" required>
                    ${userOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="action-type">Action Type:</label>
                <select id="action-type" required>
                    <option value="Warning" ${action.actionType === 'Warning' ? 'selected' : ''}>Warning</option>
                    <option value="Suspension" ${action.actionType === 'Suspension' ? 'selected' : ''}>Suspension</option>
                    <option value="Probation" ${action.actionType === 'Probation' ? 'selected' : ''}>Probation</option>
                    <option value="Community Service" ${action.actionType === 'Community Service' ? 'selected' : ''}>Community Service</option>
                    <option value="Counseling" ${action.actionType === 'Counseling' ? 'selected' : ''}>Counseling</option>
                    <option value="Expulsion" ${action.actionType === 'Expulsion' ? 'selected' : ''}>Expulsion</option>
                    <option value="Other" ${action.actionType === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label for="action-status">Status:</label>
                <select id="action-status" required>
                    <option value="pending" ${action.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="active" ${action.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="completed" ${action.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
            <div class="form-group">
                <label for="action-start-date">Start Date:</label>
                <input type="date" id="action-start-date" value="${action.startDate}" required>
            </div>
            <div class="form-group">
                <label for="action-end-date">End Date (if applicable):</label>
                <input type="date" id="action-end-date" value="${action.endDate || ''}">
            </div>
            <div class="form-group">
                <label for="action-description">Description:</label>
                <textarea id="action-description" required>${action.description}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Action</button>
            </div>
        </form>
    `;
    showModal();
}

function updateAction(event, actionId) {
    event.preventDefault();
    
    const actions = getActions();
    const actionIndex = actions.findIndex(a => a.id === actionId);
    
    if (actionIndex === -1) return;
    
    actions[actionIndex] = {
        ...actions[actionIndex],
        incidentId: parseInt(document.getElementById('action-incident').value),
        userId: parseInt(document.getElementById('action-user').value),
        actionType: document.getElementById('action-type').value,
        status: document.getElementById('action-status').value,
        startDate: document.getElementById('action-start-date').value,
        endDate: document.getElementById('action-end-date').value || null,
        description: document.getElementById('action-description').value,
        updatedAt: new Date().toISOString()
    };
    
    saveActions(actions);
    closeModal();
    loadActions();
    loadDashboard();
}

function deleteAction(actionId) {
    if (confirm('Are you sure you want to delete this action?')) {
        const actions = getActions();
        const filteredActions = actions.filter(a => a.id !== actionId);
        saveActions(filteredActions);
        loadActions();
        loadDashboard();
    }
}

// Reports functions
function loadReports() {
    generateIncidentsByTypeChart();
    generateMonthlyTrendChart();
}

function generateIncidentsByTypeChart() {
    const incidents = getIncidents();
    const typeCount = {};
    
    incidents.forEach(incident => {
        typeCount[incident.type] = (typeCount[incident.type] || 0) + 1;
    });
    
    const chartContainer = document.getElementById('incidents-by-type');
    
    if (Object.keys(typeCount).length === 0) {
        chartContainer.innerHTML = '<p class="text-center">No incidents recorded yet</p>';
        return;
    }
    
    let chartHTML = '<div class="simple-chart">';
    Object.entries(typeCount).forEach(([type, count]) => {
        const percentage = (count / incidents.length) * 100;
        chartHTML += `
            <div class="chart-item">
                <div class="chart-label">${type}: ${count}</div>
                <div class="chart-bar">
                    <div class="chart-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    chartHTML += '</div>';
    
    chartContainer.innerHTML = chartHTML;
}

function generateMonthlyTrendChart() {
    const incidents = getIncidents();
    const monthlyCount = {};
    
    incidents.forEach(incident => {
        const month = new Date(incident.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthlyCount[month] = (monthlyCount[month] || 0) + 1;
    });
    
    const chartContainer = document.getElementById('monthly-trend');
    
    if (Object.keys(monthlyCount).length === 0) {
        chartContainer.innerHTML = '<p class="text-center">No incidents recorded yet</p>';
        return;
    }
    
    const maxCount = Math.max(...Object.values(monthlyCount));
    
    let chartHTML = '<div class="simple-chart">';
    Object.entries(monthlyCount).forEach(([month, count]) => {
        const percentage = (count / maxCount) * 100;
        chartHTML += `
            <div class="chart-item">
                <div class="chart-label">${month}: ${count}</div>
                <div class="chart-bar">
                    <div class="chart-fill" style="width: ${percentage}%; background-color: #3498db;"></div>
                </div>
            </div>
        `;
    });
    chartHTML += '</div>';
    
    chartContainer.innerHTML = chartHTML;
}

// Modal functions
function showModal() {
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Data storage functions
function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function getIncidents() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.incidents) || '[]');
}

function saveIncidents(incidents) {
    localStorage.setItem(STORAGE_KEYS.incidents, JSON.stringify(incidents));
}

function getActions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.actions) || '[]');
}

function saveActions(actions) {
    localStorage.setItem(STORAGE_KEYS.actions, JSON.stringify(actions));
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}