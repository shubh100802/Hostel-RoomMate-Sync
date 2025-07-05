// frontend/js/warden.js

// ============ WARDEN MANAGEMENT SYSTEM ============
class WardenManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
    }

    // ============ AUTHENTICATION ============
    async loginWarden(email, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    role: 'warden'
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('role', 'warden');
                
                window.location.href = 'warden/Warden_dashboard.html';
                return { success: true, data };
            } else {
                return { success: false, message: data.msg || 'Login failed' };
            }
        } catch (error) {
            console.error('Warden login error:', error);
            return { success: false, message: 'Server error. Please try again.' };
        }
    }

    isAuthenticated() {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        return token && role === 'warden';
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('logoutReason');
        window.location.replace('../index.html');
        setTimeout(() => {
            window.history.replaceState({}, document.title, '../index.html');
        }, 100);
    }

    getCurrentWarden() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // ============ WARDEN MANAGEMENT ============
    async addNewWarden(wardenData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/warden/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(wardenData)
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return { success: false, message: data.msg || 'Failed to add warden' };
            }
        } catch (error) {
            console.error('Add warden error:', error);
            return { success: false, message: 'Server error. Please try again.' };
        }
    }

    async getAllWardens() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/warden/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return { success: false, message: data.msg || 'Failed to fetch wardens' };
            }
        } catch (error) {
            console.error('Get wardens error:', error);
            return { success: false, message: 'Server error. Please try again.' };
        }
    }

    async updateWarden(wardenId, updateData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/warden/${wardenId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return { success: false, message: data.msg || 'Failed to update warden' };
            }
        } catch (error) {
            console.error('Update warden error:', error);
            return { success: false, message: 'Server error. Please try again.' };
        }
    }

    async deleteWarden(wardenId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/warden/${wardenId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return { success: false, message: data.msg || 'Failed to delete warden' };
            }
        } catch (error) {
            console.error('Delete warden error:', error);
            return { success: false, message: 'Server error. Please try again.' };
        }
    }

    // ============ REPORT GENERATION ============
    async downloadReport() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/warden/download-report`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'mutual_sharing_report.xlsx';
                
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                return { success: true, message: 'Report downloaded successfully!' };
            } else {
                const data = await response.json();
                return { success: false, message: data.msg || 'Failed to download report' };
            }
        } catch (error) {
            console.error('Download report error:', error);
            return { success: false, message: 'Server error. Please try again.' };
        }
    }

    // ============ ROOM ALLOCATION MANAGEMENT ============
    async deleteAllAllotments() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/students/delete-all-allocations`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, data };
            } else {
                return { success: false, message: data.msg || 'Failed to delete allocated rooms' };
            }
        } catch (error) {
            console.error('Delete allocations error:', error);
            return { success: false, message: 'Server error. Please try again.' };
        }
    }
}

// ============ INITIALIZATION ============
const wardenManager = new WardenManager();

// ============ LOGIN HANDLERS ============
function handleWardenLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }

    const loginBtn = document.getElementById('wardenLoginBtn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
    loginBtn.disabled = true;

    wardenManager.loginWarden(email, password)
        .then(result => {
            if (result.success) {
                showMessage('Login successful! Redirecting...', 'success');
            } else {
                showMessage(result.message, 'error');
            }
        })
        .catch(error => {
            showMessage('An unexpected error occurred.', 'error');
            console.error('Login error:', error);
        })
        .finally(() => {
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        });
}

// ============ UTILITY FUNCTIONS ============
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showMessage(message, type = 'info') {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    messageDiv.style.cssText = `
        padding: 10px 15px;
        margin: 10px 0;
        border-radius: 5px;
        text-align: center;
        font-weight: 500;
    `;

    switch (type) {
        case 'success':
            messageDiv.style.backgroundColor = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.style.border = '1px solid #c3e6cb';
            break;
        case 'error':
            messageDiv.style.backgroundColor = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            break;
        default:
            messageDiv.style.backgroundColor = '#d1ecf1';
            messageDiv.style.color = '#0c5460';
            messageDiv.style.border = '1px solid #bee5eb';
    }

    const form = document.querySelector('form');
    form.parentNode.insertBefore(messageDiv, form);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function togglePassword(inputId, iconEl) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        iconEl.classList.remove("fa-eye");
        iconEl.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        iconEl.classList.remove("fa-eye-slash");
        iconEl.classList.add("fa-eye");
    }
}

// ============ EXPORTS ============
window.wardenManager = wardenManager;
window.handleWardenLogin = handleWardenLogin;
window.togglePassword = togglePassword;

// ============ STUDENT UPLOAD & TEMPLATE DOWNLOAD ============
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        const uploadBtn = document.getElementById('uploadStudentsBtn');
        const fileInput = document.getElementById('studentUploadFile');
        const resultDiv = document.getElementById('uploadResult');
        const templateBtn = document.getElementById('downloadTemplateBtn');
        const uploadSpinner = document.getElementById('uploadSpinner');

        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', async function() {
                if (!fileInput.files.length) {
                    resultDiv.innerHTML = '<div class="message error">Please select a file to upload.</div>';
                    return;
                }
                uploadSpinner.style.display = 'block';
                resultDiv.innerHTML = '';
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                try {
                    const response = await fetch('http://localhost:5000/api/students/upload', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: formData
                    });
                    const data = await response.json();
                    uploadSpinner.style.display = 'none';
                    if (response.ok) {
                        resultDiv.innerHTML = `<div class="message success">${data.msg}</div>`;
                    } else {
                        resultDiv.innerHTML = `<div class="message error">${data.msg || 'Upload failed.'}</div>`;
                    }
                } catch (err) {
                    uploadSpinner.style.display = 'none';
                    resultDiv.innerHTML = `<div class="message error">Server error. Try again.</div>`;
                }
            });
        }
        if (templateBtn) {
            templateBtn.addEventListener('click', function() {
                window.location.href = '../sample_students_template.xlsx';
            });
        }
        patchShowSectionForDeleteBtn();
        const uploadSection = document.getElementById('upload');
        if (uploadSection && uploadSection.classList.contains('active')) {
            showDeleteAllStudentsBtn(true);
        } else {
            showDeleteAllStudentsBtn(false);
        }
    });
}

// ============ DELETE BUTTONS MANAGEMENT ============
function showDeleteAllStudentsBtn(show) {
    let btn = document.getElementById('deleteAllStudentsBtnFixed');
    let prefBtn = document.getElementById('deleteAllPreferencesBtnFixed');
    if (show) {
        if (!btn) {
            btn = document.createElement('button');
            btn.className = 'submit-btn delete-fixed-btn';
            btn.id = 'deleteAllStudentsBtnFixed';
            btn.textContent = 'Delete All Students';
            document.body.appendChild(btn);
            btn.style.position = 'fixed';
            btn.style.right = '40px';
            btn.style.bottom = '70px';
            btn.style.zIndex = '1000';
            btn.style.background = '#1a73e8';
            btn.style.transition = 'background 0.3s';
            btn.onmouseover = function() { btn.style.background = '#dc3545'; };
            btn.onmouseout = function() { btn.style.background = '#1a73e8'; };
            btn.addEventListener('click', async function() {
                if (!confirm('Are you sure you want to delete ALL students? This action cannot be undone.')) return;
                try {
                    const response = await fetch('http://localhost:5000/api/students/delete-all', {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        showMessage(`${data.msg} (${data.deletedCount} students deleted)`, 'success');
                    } else {
                        showMessage(`${data.msg || 'Delete failed.'}`, 'error');
                    }
                } catch (err) {
                    showMessage('Server error. Try again.', 'error');
                }
            });
        } else {
            btn.style.display = 'block';
        }
        if (!prefBtn) {
            prefBtn = document.createElement('button');
            prefBtn.className = 'submit-btn delete-fixed-btn';
            prefBtn.id = 'deleteAllPreferencesBtnFixed';
            prefBtn.textContent = 'Delete All Preferences';
            document.body.appendChild(prefBtn);
            prefBtn.style.position = 'fixed';
            prefBtn.style.right = '220px';
            prefBtn.style.bottom = '70px';
            prefBtn.style.zIndex = '1000';
            prefBtn.style.background = '#1a73e8';
            prefBtn.style.transition = 'background 0.3s';
            prefBtn.style.marginRight = '20px';
            prefBtn.onmouseover = function() { prefBtn.style.background = '#dc3545'; };
            prefBtn.onmouseout = function() { prefBtn.style.background = '#1a73e8'; };
            prefBtn.addEventListener('click', async function() {
                if (!confirm('Are you sure you want to delete ALL mutual preferences and reset all students? This action cannot be undone.')) return;
                try {
                    const response = await fetch('http://localhost:5000/api/students/delete-all-preferences', {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        showMessage(`${data.msg} (${data.deletedPreferences} preferences deleted, ${data.updatedStudents} students reset)`, 'success');
                    } else {
                        showMessage(`${data.msg || 'Delete failed.'}`, 'error');
                    }
                } catch (err) {
                    showMessage('Server error. Try again.', 'error');
                }
            });
        } else {
            prefBtn.style.display = 'block';
        }
    } else {
        if (btn) btn.style.display = 'none';
        if (prefBtn) prefBtn.style.display = 'none';
    }
}

function patchShowSectionForDeleteBtn() {
    const origShowSection = window.showSection;
    window.showSection = function(id) {
        if (typeof origShowSection === 'function') origShowSection(id);
        showDeleteAllStudentsBtn(id === 'upload');
    };
}

// ============ TIME WINDOW MANAGEMENT ============
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        const setBtn = document.getElementById('setTimeWindowBtn');
        const startInput = document.getElementById('windowStart');
        const endInput = document.getElementById('windowEnd');
        const resultDiv = document.getElementById('setTimeResult');
        if (setBtn && startInput && endInput) {
            setBtn.addEventListener('click', function() {
                const start = startInput.value;
                const end = endInput.value;
                if (!start || !end) {
                    resultDiv.innerHTML = '<div class="message error">Please select both start and end date/time.</div>';
                    return;
                }
                fetch('http://localhost:5000/api/warden/set-time-window', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ start, end })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.window) {
                        resultDiv.innerHTML = '<div class="message success">Time window set successfully!</div>';
                    } else {
                        resultDiv.innerHTML = `<div class="message error">${data.msg || 'Failed to set window.'}</div>`;
                    }
                })
                .catch(() => {
                    resultDiv.innerHTML = '<div class="message error">Server error.</div>';
                });
            });
        }
    });
}

// ============ FINAL ALLOTMENT UPLOAD ============
const finalUploadBtn = document.getElementById('finalAllotmentUploadBtn');
const finalFileInput = document.getElementById('finalAllotmentFile');
const finalUploadSpinner = document.getElementById('finalUploadSpinner');
const finalUploadResult = document.getElementById('finalUploadResult');
if (finalUploadBtn && finalFileInput) {
    finalUploadBtn.addEventListener('click', async function() {
        if (!finalFileInput.files.length) {
            finalUploadResult.innerHTML = '<div class="message error">Please select a file to upload.</div>';
            return;
        }
        finalUploadSpinner.style.display = 'block';
        finalUploadResult.innerHTML = '';
        const formData = new FormData();
        formData.append('file', finalFileInput.files[0]);
        try {
            const response = await fetch('http://localhost:5000/api/students/upload-final-allotment', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            const data = await response.json();
            finalUploadSpinner.style.display = 'none';
            if (response.ok) {
                finalUploadResult.innerHTML = `<div class="message success">${data.msg}</div>`;
            } else {
                finalUploadResult.innerHTML = `<div class="message error">${data.msg || 'Upload failed.'}</div>`;
            }
        } catch (err) {
            finalUploadSpinner.style.display = 'none';
            finalUploadResult.innerHTML = `<div class="message error">Server error. Try again.</div>`;
        }
    });
}

// ============ INACTIVITY AUTO-LOGOUT ============
let inactivityTimer;
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        localStorage.setItem('logoutReason', 'inactive');
        wardenManager.logout();
    }, 5 * 60 * 1000); // 5 minutes
}
['click','mousemove','keydown','scroll','touchstart'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, true);
});
resetInactivityTimer();

// ============ PREVENT DASHBOARD ACCESS AFTER LOGOUT ============
function checkWardenAuthOnLoad() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'warden') {
        window.location.replace('../index.html');
    }
    // If redirected due to inactivity, show message
    if (localStorage.getItem('logoutReason') === 'inactive') {
        alert('You have been logged out due to inactivity.');
        localStorage.removeItem('logoutReason');
    }
}
if (window.location.pathname.includes('Warden_dashboard.html')) {
    checkWardenAuthOnLoad();
}
