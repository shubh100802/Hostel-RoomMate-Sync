// Add this at the very top of the file
const apiBaseUrl = window.location.origin + '/api';

// ============ STUDENT DASHBOARD SYSTEM ============
document.addEventListener("DOMContentLoaded", () => {
  // ============ INITIALIZATION ============
  const student = JSON.parse(localStorage.getItem("user"));
  if (student) {
    const nameEl = document.getElementById("studentName");
    const regnoEl = document.getElementById("studentRegno");
    const emailEl = document.getElementById("studentEmail");
    const bedTypeEl = document.getElementById("studentBedType");
    if (nameEl) nameEl.innerText = student.name || "-";
    if (regnoEl) regnoEl.innerText = student.regno || "-";
    if (emailEl) emailEl.innerText = student.email || "-";
    if (bedTypeEl) bedTypeEl.innerText = student.bedType || "-";
  }

  const welcome = document.querySelector("#home h1");
  if (welcome && student && student.name) {
    welcome.innerHTML = `Welcome, ${student.name} 👋`;
  }

  loadStudentStatus();
  loadRoommateRequests();
  loadMyRoommateGroup();

  // ============ BED TYPE UTILITIES ============
  function normalizeBedType(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\b1\b|one/g, '1')
      .replace(/\b2\b|two/g, '2')
      .replace(/\b3\b|three/g, '3')
      .replace(/\b4\b|four/g, '4')
      .replace(/\b5\b|five/g, '5')
      .replace(/\b6\b|six/g, '6')
      .replace(/\b7\b|seven/g, '7')
      .replace(/\b8\b|eight/g, '8')
      .replace(/bedded/g, 'bed')
      .replace(/\s*-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const bedTypeToSlots = {
    "single bed non a/c": 0,
    "1 bed non a/c": 0,
    "double bed a/c": 1,
    "2 bed a/c": 1,
    "double bed non a/c": 1,
    "2 bed non a/c": 1,
    "three bed a/c": 2,
    "3 bed a/c": 2,
    "three bed non a/c": 2,
    "3 bed non a/c": 2,
    "four bed a/c": 3,
    "4 bed a/c": 3,
    "four bed ac bunk": 3,
    "4 bed ac bunk": 3,
    "four bed non a/c bunker bed": 3,
    "4 bed non a/c bunker bed": 3,
    "four bed non a/c flat bed": 3,
    "4 bed non a/c flat bed": 3,
    "five bed non a/c": 4,
    "5 bed non a/c": 4,
    "six bed a/c": 5,
    "6 bed a/c": 5,
    "six bed non a/c": 5,
    "6 bed non a/c": 5,
    "eight bed non a/c": 7,
    "8 bed non a/c": 7
  };

  // ============ MUTUAL FORM LOGIC ============
  function generateMutualForm() {
    const container = document.getElementById("mutual");
    if (!container || !student) return;
    container.innerHTML = '';

    fetch(apiBaseUrl + '/students/has-active-incoming-request', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.ok ? res.json() : null)
    .then(activeReq => {
      if (activeReq && activeReq.hasActive) {
        container.innerHTML = `<h1>Mutual Form Section</h1><p style='color:#ff9800;font-weight:bold;'>You have already been preferred by <b>${activeReq.requester.name}</b> (${activeReq.requester.regno}).<br>Please respond to or decline the request before filling your own preferences.</p>`;
        return;
      }
      fetch(apiBaseUrl + '/students/get-time-window')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (!data || !data.start || !data.end) {
            container.innerHTML = `<h1>Mutual Form Section</h1><p>Mutual choice filling window is not set. Please contact your warden.</p>`;
            return;
          }
          const now = new Date();
          const start = new Date(data.start);
          const end = new Date(data.end);
          if (now < start) {
            container.innerHTML = `<h1>Mutual Form Section</h1><p>Mutual choice filling will open on <b>${start.toLocaleString()}</b>.</p>`;
            return;
          }
          if (now > end) {
            container.innerHTML = `<h1>Mutual Form Section</h1><p>Mutual choice filling is now closed.</p>`;
            return;
          }

          fetch(apiBaseUrl + '/students/status', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          .then(res => res.ok ? res.json() : null)
          .then(statusData => {
            if (statusData && (statusData.hasSubmittedMutualForm || statusData.isCommittedToRoommate)) {
              if (statusData.isCommittedToRoommate) {
                container.innerHTML = `<h1>Mutual Form Section</h1><p>You are committed to a roommate group. You cannot submit a new form.</p>`;
              } else {
                container.innerHTML = `<h1>Mutual Form Section</h1><p>You have already submitted your preferences. Please wait for responses from your requested roommates.</p>`;
              }
              return;
            }

            showMutualForm(container);
          })
          .catch(() => {
            container.innerHTML = `<h1>Mutual Form Section</h1><p>Error loading status. Please try again.</p>`;
          });
        });
    });
  }

  function showMutualForm(container) {
    const heading = document.createElement('h1');
    heading.textContent = 'Mutual Form Section';
    container.appendChild(heading);
    const instructions = document.createElement('p');
    instructions.textContent = 'Enter registration numbers of your desired roommates (same bed type required). Enter NA for random roommate.';
    container.appendChild(instructions);

    const formWrapper = document.createElement("div");
    formWrapper.className = "form-wrapper";
    formWrapper.id = "mutualFormContainer";

    const normalizedBedType = normalizeBedType(student.bedType);
    const slots = bedTypeToSlots[normalizedBedType] || 0;
    if (slots === 0) {
      container.innerHTML = `<h1>Mutual Form Section</h1><p>You have a single bed. No roommates to select.</p>`;
      return;
    }
    for (let i = 1; i <= slots; i++) {
      const row = document.createElement("div");
      row.className = "roommate-row";
      row.innerHTML = `
        <label for="reg${i}">Roommate ${i} Reg No:</label>
        <input type="text" id="reg${i}" placeholder="Ex: 22BCS12XX or NA">
        <label for="name${i}">Name:</label>
        <input type="text" id="name${i}" readonly>
        <label for="email${i}">Email:</label>
        <input type="email" id="email${i}" readonly>
      `;
      formWrapper.appendChild(row);
    }

    const submitBtn = document.createElement("button");
    submitBtn.className = "submit-btn";
    submitBtn.innerText = "Submit Mutual Preference";
    submitBtn.onclick = function(e) {
      e.preventDefault();
      const preferences = [];
      for (let i = 1; i <= slots; i++) {
        const regInput = document.getElementById(`reg${i}`);
        preferences.push(regInput ? regInput.value.trim() : "NA");
      }
      fetch(apiBaseUrl + '/students/mutual-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ preferences })
      })
      .then(res => res.json())
      .then(data => {
        if (data.msg) {
          alert(data.msg);
          generateMutualForm();
          loadStudentStatus();
        } else {
          alert('Error submitting preferences');
        }
      })
      .catch(() => {
        alert('Server error. Please try again.');
      });
    };

    formWrapper.appendChild(submitBtn);
    container.appendChild(formWrapper);

    // Add real-time name/email lookup
    for (let i = 1; i <= slots; i++) {
      const regInput = document.getElementById(`reg${i}`);
      const nameInput = document.getElementById(`name${i}`);
      const emailInput = document.getElementById(`email${i}`);
      
      if (regInput && nameInput && emailInput) {
        regInput.addEventListener('input', function() {
          const regno = this.value.trim();
          if (regno && regno.toUpperCase() === 'NA') {
            nameInput.value = 'NA';
            emailInput.value = 'NA';
          } else if (regno) {
            fetch(apiBaseUrl + `/students/by-regno/${regno}?bedType=${encodeURIComponent(student.bedType)}`)
              .then(res => res.ok ? res.json() : null)
              .then(data => {
                if (data && data.name) {
                  nameInput.value = data.name;
                  emailInput.value = data.email;
                } else {
                  nameInput.value = 'NA';
                  emailInput.value = 'NA';
                }
              })
              .catch(() => {
                nameInput.value = 'NA';
                emailInput.value = 'NA';
              });
          } else {
            nameInput.value = '';
            emailInput.value = '';
          }
        });
      }
    }
  }

  // ============ STUDENT STATUS & DATA LOADING ============
  function loadStudentStatus() {
    fetch(apiBaseUrl + '/students/status', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      const formStatusEl = document.getElementById('formStatus');
      const commitmentStatusEl = document.getElementById('commitmentStatus');
      
      if (formStatusEl) {
        if (data && data.hasSubmittedMutualForm) {
          formStatusEl.innerHTML = '<span style="color:#28a745;">✓ Mutual preferences submitted</span>';
        } else {
          formStatusEl.innerHTML = '<span style="color:#dc3545;">✗ Mutual preferences not submitted</span>';
        }
      }
      
      if (commitmentStatusEl) {
        if (data && data.isCommittedToRoommate) {
          commitmentStatusEl.innerHTML = '<span style="color:#28a745;">✓ Committed to roommate group</span>';
        } else {
          commitmentStatusEl.innerHTML = '<span style="color:#ffc107;">⚠ Not committed to any group</span>';
        }
      }
    })
    .catch(() => {
      console.error('Error loading student status');
    });
  }

  function loadMyRoommateGroup() {
    fetch(apiBaseUrl + '/students/my-roommate-group', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      const container = document.getElementById('myGroupContainer');
      if (!container) return;
      
      if (!data) {
        container.innerHTML = '<p>No roommate group found.</p>';
        return;
      }

      let label = '';
      if (student && data.requester.regno === student.regno) {
        label = '<h3 style="color:#007bff;margin-bottom:10px;">Your Mutual Group</h3>';
      } else {
        label = `<h3 style="color:#007bff;margin-bottom:10px;">You have been requested as a roommate by <b>${data.requester.name}</b></h3>`;
      }
      let html = label + '<ul>';
      data.group.forEach(s => {
        html += `<li><b>${s.name}</b> (${s.regno}) <span style='color:#888;'>${s.email}</span></li>`;
      });
      html += '</ul>';
      container.innerHTML = html;
    })
    .catch(() => {
      console.error('Error loading roommate group');
    });
  }

  // ============ ROOMMATE REQUESTS ============
  function loadRoommateRequests() {
    fetch(apiBaseUrl + '/students/pending-requests', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.ok ? res.json() : null)
    .then(requests => {
      const container = document.getElementById('requestsContainer');
      const countEl = document.getElementById('requestCount');
      
      if (!container) return;
      
      if (!requests || requests.length === 0) {
        container.innerHTML = '<div class="no-requests">No pending roommate requests</div>';
        if (countEl) {
          countEl.style.display = 'none';
        }
        return;
      }
      
      if (countEl) {
        countEl.textContent = requests.length;
        countEl.style.display = 'inline';
      }
      
      container.innerHTML = '';
      requests.forEach(request => {
        const requestCard = document.createElement('div');
        requestCard.className = 'request-card';
        let groupHtml = '<ul style="margin:10px 0 0 0;">';
        request.group.forEach(s => {
          groupHtml += `<li><b>${s.name}</b> (${s.regno}) <span style='color:#888;'>${s.email}</span></li>`;
        });
        groupHtml += '</ul>';
        requestCard.innerHTML = `
          <div class="request-header">
            <div class="requester-info">
              <div class="requester-name">${request.requester.name}</div>
              <div class="requester-details">
                Reg No: ${request.requester.regno} | Email: ${request.requester.email}<br>
                Bed Type: ${request.bedType}<br>
                Requested on: ${new Date(request.createdAt).toLocaleString()}
              </div>
              <div style="margin-top:10px;"><b>Full Group:</b>${groupHtml}</div>
            </div>
            <div class="request-actions">
              <button class="btn-accept" onclick="respondToRequest('${request.id}', 'accept')">Accept</button>
              <button class="btn-decline" onclick="respondToRequest('${request.id}', 'decline')">Decline</button>
            </div>
          </div>
        `;
        container.appendChild(requestCard);
      });
    })
    .catch(err => {
      console.error('Error loading requests:', err);
      const container = document.getElementById('requestsContainer');
      if (container) {
        container.innerHTML = '<div class="no-requests">Error loading requests. Please try again.</div>';
      }
    });
  }

  // ============ REQUEST RESPONSE HANDLERS ============
  window.respondToRequest = function(requestId, response) {
    fetch(apiBaseUrl + `/students/respond-to-request/${requestId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ response })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.msg || 'Response submitted successfully');
      loadStudentStatus();
      loadRoommateRequests();
      generateMutualForm();
    })
    .catch(() => {
      alert('Failed to submit response. Please try again.');
    });
  };

  // ============ SECTION EVENT LISTENERS ============
  const mutualBtn = document.getElementById("mutualBtn");
  if (mutualBtn) {
    mutualBtn.addEventListener("click", generateMutualForm);
  }

  const requestsBtn = document.getElementById("requestsBtn");
  if (requestsBtn) {
    requestsBtn.addEventListener("click", loadRoommateRequests);
  }

  // ============ FINAL ALLOTMENT ============
  function loadFinalAllotment() {
    const allotmentSection = document.getElementById('allotment');
    if (!allotmentSection) return;
    allotmentSection.innerHTML = '<h1>Final Allotment Section</h1><p>Here you can view your final room allotment.</p>';
    fetch(apiBaseUrl + '/students/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      console.log('Final allotment data:', data);
      console.log('Student object:', data?.student);
      console.log('finalRoomNo value:', data?.student?.finalRoomNo);
      console.log('finalRoomNo type:', typeof data?.student?.finalRoomNo);
      console.log('finalRoomNo length:', data?.student?.finalRoomNo?.length);
      
      if (data && data.student && data.student.finalRoomNo && data.student.finalRoomNo.trim() !== '') {
        const roomNo = data.student.finalRoomNo;
        console.log('Room number found:', roomNo);
        const html = `<div style="background:#e7f3ff;border:1px solid #b3d9ff;border-radius:8px;padding:20px 30px;margin-top:20px;max-width:400px;">
          <h2 style="color:#007bff;margin-bottom:10px;">Your Allotted Room</h2>
          <p style="font-size:1.2rem;"><strong>Room No:</strong> <span style="color:#222;font-weight:bold;">${roomNo}</span></p>
        </div>`;
        allotmentSection.innerHTML += html;
      } else {
        console.log('No room number found or empty');
        allotmentSection.innerHTML += `<div style='color:#dc3545;margin-top:20px;'>Room allotment not uploaded yet. Please check back later.</div>`;
      }
    })
    .catch((error) => {
      console.error('Error loading final allotment:', error);
      allotmentSection.innerHTML += `<div style='color:#dc3545;margin-top:20px;'>Error loading room allotment. Please try again.</div>`;
    });
  }

  // ============ SECTION NAVIGATION ============
  (function() {
    const origShowSection = window.showSection;
    window.showSection = function(id) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      const section = document.getElementById(id);
      if (section) section.classList.add('active');
      document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById(id + 'Btn');
      if (activeBtn) activeBtn.classList.add('active');
      if (typeof origShowSection === 'function') origShowSection(id);
      if (id === 'allotment') loadFinalAllotment();
    };
  })();

  document.addEventListener('DOMContentLoaded', function() {
    ['home', 'requests', 'mutual', 'allotment'].forEach(function(section) {
      const btn = document.getElementById(section + 'Btn');
      if (btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          showSection(section);
        });
      }
    });
    if (document.getElementById('allotment').classList.contains('active')) {
      loadFinalAllotment();
    }
  });

  // ============ INACTIVITY AUTO-LOGOUT ============
  let inactivityTimer;
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      localStorage.setItem('logoutReason', 'inactive');
      studentLogout();
    }, 5 * 60 * 1000); // 5 minutes
  }
  ['click','mousemove','keydown','scroll','touchstart'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, true);
  });
  resetInactivityTimer();

  // ============ PREVENT DASHBOARD ACCESS AFTER LOGOUT ============
  function checkStudentAuthOnLoad() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'student') {
      window.location.replace('../student_login.html');
    }
    // If redirected due to inactivity, show message
    if (localStorage.getItem('logoutReason') === 'inactive') {
      alert('You have been logged out due to inactivity.');
      localStorage.removeItem('logoutReason');
    }
  }
  if (window.location.pathname.includes('Student_dashboard.html')) {
    checkStudentAuthOnLoad();
  }

  // Patch logout to prevent back navigation
  function studentLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('logoutReason');
    window.location.replace('../student_login.html');
    setTimeout(() => {
      window.history.replaceState({}, document.title, '../student_login.html');
    }, 100);
  }
});
