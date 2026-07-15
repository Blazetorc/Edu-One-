/* ==============================================
   EDU ONE ERP DASHBOARD – APPLICATION JAVASCRIPT
   SPA Router, Data, Charts, Interactions
============================================== */

'use strict';

// ──────────────────────────────────────────────
// ROUTING
// ──────────────────────────────────────────────
function navigateTo(pageId, triggerEl) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show target
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');

  // Update nav
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  if (triggerEl) {
    const navEl = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (navEl) navEl.classList.add('active');
  }

  // Init page-specific code
  initPage(pageId);
  return false;
}

function initPage(pageId) {
  switch (pageId) {
    case 'dashboard':   initDashboard();   break;
    case 'students':    initStudents();    break;
    case 'attendance':  initAttendance();  break;
    case 'marks':       initMarks();       break;
    case 'staff':       initStaff();       break;
    case 'messaging':   initMessaging();   break;
    case 'reports':     initReports();     break;
    case 'promotion':   initPromotion();   break;
  }
}

// ──────────────────────────────────────────────
// SIDEBAR TOGGLE
// ──────────────────────────────────────────────
const sidebarToggle = document.getElementById('sidebarToggle');
sidebarToggle?.addEventListener('click', () => {
  const isMobile = window.innerWidth <= 900;
  if (isMobile) {
    document.body.classList.toggle('sidebar-open');
  } else {
    document.body.classList.toggle('sidebar-collapsed');
    // Reposition topbar & main
    const sbWidth = document.body.classList.contains('sidebar-collapsed') ? '72px' : '260px';
    document.querySelector('.topbar').style.left = sbWidth;
    document.querySelector('.main-content').style.marginLeft = sbWidth;
  }
});

// ──────────────────────────────────────────────
// COUNTER ANIMATION
// ──────────────────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  let current = 0;
  const step = Math.max(1, Math.floor(target / 60));
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current.toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 16);
}

// ──────────────────────────────────────────────
// TOAST NOTIFICATION
// ──────────────────────────────────────────────
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ──────────────────────────────────────────────
// CANVAS CHART HELPERS
// ──────────────────────────────────────────────
function drawLineChart(canvasId, data, labels) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;
  ctx.clearRect(0, 0, W, H);

  const max = Math.max(...data[0], ...data[1]) * 1.1;
  const min = Math.min(...data[0], ...data[1]) * 0.9;
  const range = max - min;
  const xStep = cw / (labels.length - 1);

  const toX = i => pad.left + i * xStep;
  const toY = v => pad.top + ch - ((v - min) / range) * ch;

  // Grid lines
  ctx.strokeStyle = '#e7e7f3';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (ch / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + cw, y);
    ctx.stroke();
    ctx.fillStyle = '#737686';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(max - (range / 4) * i) + '%', pad.left - 6, y + 4);
  }

  // X labels
  ctx.fillStyle = '#737686';
  ctx.font = '11px Inter';
  ctx.textAlign = 'center';
  labels.forEach((lbl, i) => {
    ctx.fillText(lbl, toX(i), H - 6);
  });

  const colors = [['#004ac6', 'rgba(0,74,198,.08)'], ['#b4c5ff', 'rgba(180,197,255,.15)']];

  data.forEach((series, si) => {
    const [stroke, fill] = colors[si];

    // Fill area
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(series[0]));
    series.forEach((v, i) => ctx.lineTo(toX(i), toY(v)));
    ctx.lineTo(toX(series.length - 1), pad.top + ch);
    ctx.lineTo(toX(0), pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(series[0]));
    series.forEach((v, i) => ctx.lineTo(toX(i), toY(v)));
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Dots
    series.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(toX(i), toY(v), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  });
}

function drawBarChart(canvasId, data, labels) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;
  ctx.clearRect(0, 0, W, H);

  const max = 100;
  const groupW = cw / labels.length;
  const barW = (groupW * 0.6) / data.length;
  const gap = barW * 0.2;

  const toY = v => pad.top + ch - (v / max) * ch;

  // Grid
  ctx.strokeStyle = '#e7e7f3';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (ch / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + cw, y);
    ctx.stroke();
    ctx.fillStyle = '#737686';
    ctx.font = '10px Inter';
    ctx.textAlign = 'right';
    ctx.fillText((100 - i * 25) + '%', pad.left - 6, y + 4);
  }

  const colors = ['#004ac6', '#d0e1fb'];

  data.forEach((series, si) => {
    labels.forEach((lbl, gi) => {
      const v = series[gi];
      const x = pad.left + gi * groupW + (groupW - (barW * data.length + gap * (data.length - 1))) / 2 + si * (barW + gap);
      const y = toY(v);
      const barH = (v / max) * ch;

      // Draw bar with rounded top
      const r = 3;
      ctx.beginPath();
      ctx.moveTo(x, pad.top + ch);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.lineTo(x + barW - r, y);
      ctx.arcTo(x + barW, y, x + barW, y + r, r);
      ctx.lineTo(x + barW, pad.top + ch);
      ctx.closePath();
      ctx.fillStyle = colors[si];
      ctx.fill();

      // X label (only once)
      if (si === 0) {
        ctx.fillStyle = '#737686';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, pad.left + gi * groupW + groupW / 2, H - 6);
      }
    });
  });
}

function drawDonut(canvasId, values, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 10, innerR = r * 0.62;
  const total = values.reduce((a, b) => a + b, 0);
  let start = -Math.PI / 2;
  values.forEach((v, i) => {
    const sweep = (v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + sweep);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    start += sweep;
  });
  // Inner circle
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

// ──────────────────────────────────────────────
// DATA SEEDS
// ──────────────────────────────────────────────
const STUDENTS = [
  { id:'#AD-2024-001', name:'Julianne Moore', email:'julianne.m@school.edu', grade:'Grade 12', div:'Section A', att:94, status:'Active',
    img:'https://lh3.googleusercontent.com/aida-public/AB6AXuDEaitzm5pH9lAezrKlCMoAtjfWkNbftn6h_7V9oKovZwa3Lqc0LZboQnJoMVcwY-dhl6tno0S_qDMZy2z-4NaoGJD_mZ8VYdUZeztseIVpMlWmr5V55-3HHk1ksMQUFtKbmPNDc_eaPdkZmr41dGGBEaWkzT82dQl5uNh5I8vLJA7UXfuTWRWXFClENtJPZY7xXUGsmdfTZZNlzG1QaBYTk-YsSmLeirQgkFVxmFWu-7vh-R7EzWgi8w' },
  { id:'#AD-2024-002', name:'Marcus Sterling', email:'m.sterling@school.edu', grade:'Grade 12', div:'Section B', att:82, status:'Active',
    img:'https://lh3.googleusercontent.com/aida-public/AB6AXuAPqHVJ7v7STK1I6SogR4LtosYaPtLvsdOnnKkf6P5SJidPmZbwInqDyQFC2UQ0PeK5ZExI-wINMdIyAL-7fFMggr__JJA4PXHr-TKJ7rRlGKsQZ7EEnQ2tGDCkfmrynxENFpaeTvhAJHa4Y_ZCPD9ZMt81Ba32dRO-CMTizmtBOZuUhMCF7ujaam057QfoeFIKZ3HS_CcK6lErD2gMgUs5n5zXTtguo-XqcL0qBQtP7o9EIK1u2wjVoQ' },
  { id:'#AD-2023-459', name:'Sofia Rodriguez', email:'sofia.rod@school.edu', grade:'Grade 10', div:'Section A', att:45, status:'Inactive',
    img:'https://lh3.googleusercontent.com/aida-public/AB6AXuD4QxHR3tEA8HL52AC5zL-W3O68aG7gYYAEFQ1ZNIIF0KZ3v2yFkXsET7_xQPRSm5uAv3yuRXOCuBPqSivWOO3o1aaXXrb8YnctNFuekFYlSPFEATso4qlRtVkAWwCIg1lOhX6Gk7oayIXCywz7jGkqq55AJiicjkeBMM9RJoYtILyDK39-mbQKyTbZgacT3emMG2nsMCYF7G-relyfZVs_t9O_Q2I42kqWlprahfH9WVraJ9cgWmf2WQ' },
  { id:'#AD-2024-112', name:'Ethan Hunt', email:'ethan.hunt@school.edu', grade:'Grade 11', div:'Section C', att:98, status:'Active',
    img:'https://lh3.googleusercontent.com/aida-public/AB6AXuD2OlLO0UwGYsSsaM1fYBLn16k4pzZsJaMFE1PkDg4BLo1DVqAhGwauzSDrshD9tPO2xrOHVdpNeM22IHduyodqAFU9w6Rph0S7mDy1uMiwsGJfHgMCmbvosf1Z512v5sgVSUhPIQBms49E9HPMknpFQGR6CsA6zJEWnxKCvyZ4tbEfQTI2aTx8cB7Ie0-UpSq0O_HJHlcMZcnOw1psTtVzC7QUwk7bRHn-16E8AJIuzTdRtg6RAYl5jw' },
  { id:'#AD-2024-089', name:'Priya Nair', email:'priya.n@school.edu', grade:'Grade 11', div:'Section A', att:88, status:'Active',
    img:'https://lh3.googleusercontent.com/aida-public/AB6AXuAUjhhmeosMpjnnnBg03X08f5j9PA8AwYyswPVoivho5Elat-FPmvjPhlB9p8cyvukkFqXPEHnypHANNXmp4hv1OMlWODScQWjIPJObPymTKDt8CpgJQTHAZIeWaZancKVSUiMNUEFFYwWB0PeFER0nYQ4uJ4WLqwDnsWSMMFQpbEOoTqx-cJkM-oA2MgPmT1EIKe90HLkArmGi3IcDMOGt-_QSxD39GCAx30qMzKG-nVNCLbJarROA_g' },
  { id:'#AD-2023-302', name:'Arjun Krishnan', email:'arjun.k@school.edu', grade:'Grade 10', div:'Section B', att:72, status:'Active',
    img:'https://lh3.googleusercontent.com/aida-public/AB6AXuCfPYPEEF4S04036qwGu6TqIB0jz2D31YmrekcOdbz8m7xxBSvjTOpy32Hzc6-ZWXMhzlaErnb6cad8VG9ICxwtfx7CclNxI8HNFwk7VyaWYk8B5S-aboDGaqlLF2cXdwkIYnu-qUZd76qvKgeH9UsBqxE4tHxHodrekDpEcZs9haXIh_NBwS3JV2usCDjVOcYXI1RhB0gUYSVAAZpPu_GH89X-3-x1efVFy6Sd939WAiL89QNpe_TnYg' },
  { id:'#AD-2024-234', name:'Meera Thomas', email:'meera.t@school.edu', grade:'Grade 12', div:'Section A', att:91, status:'Active',
    img:'https://lh3.googleusercontent.com/aida-public/AB6AXuAUjhhmeosMpjnnnBg03X08f5j9PA8AwYyswPVoivho5Elat-FPmvjPhlB9p8cyvukkFqXPEHnypHANNXmp4hv1OMlWODScQWjIPJObPymTKDt8CpgJQTHAZIeWaZancKVSUiMNUEFFYwWB0PeFER0nYQ4uJ4WLqwDnsWSMMFQpbEOoTqx-cJkM-oA2MgPmT1EIKe90HLkArmGi3IcDMOGt-_QSxD39GCAx30qMzKG-nVNCLbJarROA_g' },
  { id:'#AD-2024-067', name:'Rohan Menon', email:'rohan.m@school.edu', grade:'Grade 9', div:'Section B', att:62, status:'Pending',
    img:'https://lh3.googleusercontent.com/aida-public/AB6AXuAPqHVJ7v7STK1I6SogR4LtosYaPtLvsdOnnKkf6P5SJidPmZbwInqDyQFC2UQ0PeK5ZExI-wINMdIyAL-7fFMggr__JJA4PXHr-TKJ7rRlGKsQZ7EEnQ2tGDCkfmrynxENFpaeTvhAJHa4Y_ZCPD9ZMt81Ba32dRO-CMTizmtBOZuUhMCF7ujaam057QfoeFIKZ3HS_CcK6lErD2gMgUs5n5zXTtguo-XqcL0qBQtP7o9EIK1u2wjVoQ' },
];

const STAFF_DATA = [
  { id:'STF-001', name:'Dr. Priya Sharma', dept:'Science', role:'Head of Department', subjects:'Physics, Chemistry', joined:'Jun 2019', status:'Active' },
  { id:'STF-002', name:'Mr. Rajiv Kumar', dept:'Mathematics', role:'Senior Teacher', subjects:'Maths, Statistics', joined:'Aug 2018', status:'Active' },
  { id:'STF-003', name:'Ms. Sarah Jenkins', dept:'Science', role:'Teacher', subjects:'Biology', joined:'Apr 2026', status:'Active' },
  { id:'STF-004', name:'Mrs. Anitha Nair', dept:'English', role:'Teacher', subjects:'English, Literature', joined:'Jan 2020', status:'Active' },
  { id:'STF-005', name:'Mr. Thomas George', dept:'Social Studies', role:'Senior Teacher', subjects:'History, Geography', joined:'Sep 2017', status:'On Leave' },
  { id:'STF-006', name:'Ms. Lakshmi Iyer', dept:'Hindi', role:'Teacher', subjects:'Hindi Language', joined:'Jul 2021', status:'Active' },
  { id:'STF-007', name:'Mr. James Wilson', dept:'Physical Education', role:'PE Coordinator', subjects:'Sports, NCC', joined:'Mar 2022', status:'Active' },
  { id:'STF-008', name:'Mrs. Fatima Ali', dept:'Mathematics', role:'Teacher', subjects:'Maths', joined:'Nov 2023', status:'Active' },
];

const ATT_STUDENTS = [
  { roll:'10A-01', name:'Aditya Raj', status:'present' },
  { roll:'10A-02', name:'Ananya Pillai', status:'present' },
  { roll:'10A-03', name:'Bashir Ahmed', status:'absent' },
  { roll:'10A-04', name:'Deepika Menon', status:'present' },
  { roll:'10A-05', name:'Faisal Khan', status:'late' },
  { roll:'10A-06', name:'Geetha Krishnan', status:'present' },
  { roll:'10A-07', name:'Hari Prasad', status:'present' },
  { roll:'10A-08', name:'Ishita Sharma', status:'absent' },
  { roll:'10A-09', name:'Javed Ali', status:'present' },
  { roll:'10A-10', name:'Keerthi Varma', status:'present' },
];

const MARKS_DATA = [
  { id:'#AD-2024-001', name:'Julianne Moore', internal:36, external:52 },
  { id:'#AD-2024-002', name:'Marcus Sterling', internal:32, external:44 },
  { id:'#AD-2023-459', name:'Sofia Rodriguez', internal:28, external:38 },
  { id:'#AD-2024-112', name:'Ethan Hunt', internal:39, external:57 },
  { id:'#AD-2024-089', name:'Priya Nair', internal:35, external:50 },
  { id:'#AD-2023-302', name:'Arjun Krishnan', internal:30, external:42 },
  { id:'#AD-2024-234', name:'Meera Thomas', internal:38, external:55 },
];

const MESSAGES = [
  { from:'Principal Office', subject:'Annual Day Celebration Reminder', preview:'Please note that the Annual Day...', time:'10:24 AM', unread:true,
    body:'Dear Students and Staff,\n\nThis is a reminder that our Annual Day Celebration is scheduled for this Friday, July 18th, 2025. All students are expected to attend in their respective house colors. Staff members are requested to coordinate their homerooms by Wednesday.\n\nBest regards,\nPrincipal Office' },
  { from:'Exam Committee', subject:'Final Term Schedule Published', preview:'The final examination timetable...', time:'9:02 AM', unread:true,
    body:'Dear All,\n\nThe Final Term Examination schedule has been published for Grades 8 through 12. Students can view their individual schedules on the notice board or through the student portal.\n\nExaminations commence on July 28th, 2025.\n\nRegards,\nExam Committee' },
  { from:'Finance Dept', subject:'Fee Collection – Q3 Reminder', preview:'This is a reminder that Q3 fees...', time:'Yesterday', unread:true,
    body:'Dear Parents/Guardians,\n\nThis is a friendly reminder that Q3 fee payment is due by July 31st, 2025. Please ensure timely payment to avoid any late fees. You can pay via the school portal, NEFT, or at the school finance office.\n\nThank you for your cooperation.\n\nFinance Department, Edu One' },
  { from:'Sports Dept', subject:'Inter-House Cricket Tournament', preview:'Registrations are now open for...', time:'Mon', unread:false,
    body:'Dear Students,\n\nRegistrations are now open for the Inter-House Cricket Tournament scheduled for August 2025. All interested students from Grades 8–12 can register through their PE teacher by Friday.\n\nGo for the gold!\n\nSports Department' },
  { from:'IT Department', subject:'Student Portal – New Features', preview:'We have launched new features...', time:'Last Week', unread:false,
    body:'Dear All,\n\nWe are pleased to announce that the student portal has been updated with new features including:\n- Real-time attendance viewing\n- Mark sheet downloads\n- Online assignment submissions\n\nLogin to explore!\n\nIT Department, Edu One' },
];

const PROMO_DATA = [
  { grade:'Grade 8',  total:185, promoted:178, pending:5,  held:2,  pct:96 },
  { grade:'Grade 9',  total:210, promoted:198, pending:8,  held:4,  pct:94 },
  { grade:'Grade 10', total:285, promoted:260, pending:15, held:10, pct:91 },
  { grade:'Grade 11', total:340, promoted:312, pending:18, held:10, pct:92 },
  { grade:'Grade 12', total:220, promoted:200, pending:10, held:10, pct:91 },
];

// ──────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────
let dashboardInited = false;
function initDashboard() {
  if (dashboardInited) return;
  dashboardInited = true;

  // Counters
  document.querySelectorAll('.counter').forEach(el => animateCounter(el));

  // Attendance Line Chart
  const attLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const attData   = [[92, 95, 91, 96, 94, 88, 87], [88, 90, 85, 91, 89, 83, 82]];
  setTimeout(() => drawLineChart('attendanceCanvas', attData, attLabels), 100);

  // Performance Bar Chart
  const perfLabels = ['Gr 8', 'Gr 9', 'Gr 10', 'Gr 11', 'Gr 12'];
  const perfData   = [[85, 92, 78, 65, 98], [70, 88, 95, 60, 90]];
  setTimeout(() => drawBarChart('performanceCanvas', perfData, perfLabels), 100);

  // Donut
  setTimeout(() => drawDonut('donutCanvas', [310, 285, 340, 305], ['#004ac6','#2563eb','#b4c5ff','#dbe1ff']), 100);
}

// ──────────────────────────────────────────────
// STUDENTS
// ──────────────────────────────────────────────
let studentsInited = false;
function initStudents() {
  if (studentsInited) return;
  studentsInited = true;
  renderStudentsTable(STUDENTS);
}

function renderStudentsTable(data) {
  const tbody = document.getElementById('studentsBody');
  if (!tbody) return;
  tbody.innerHTML = data.map(s => {
    const attColor = s.att >= 80 ? '#004ac6' : s.att >= 60 ? '#d97706' : '#ba1a1a';
    const badgeClass = s.status === 'Active' ? 'badge--active' : s.status === 'Pending' ? 'badge--pending' : 'badge--inactive';
    return `
      <tr onclick="showStudentToast('${s.name}')">
        <td style="color:var(--clr-primary);font-weight:600;font-size:12px;">${s.id}</td>
        <td>
          <div class="cell-student">
            <img class="student-avatar" src="${s.img}" alt="${s.name}" loading="lazy" />
            <div>
              <div class="student-name">${s.name}</div>
              <div class="student-email">${s.email}</div>
            </div>
          </div>
        </td>
        <td>${s.grade}</td>
        <td>${s.div}</td>
        <td>
          <div class="att-bar-wrap">
            <div class="att-bar-track"><div class="att-bar-fill" style="width:${s.att}%;background:${attColor};"></div></div>
            <span style="font-size:12px;font-weight:700;">${s.att}%</span>
          </div>
        </td>
        <td><span class="badge ${badgeClass}">${s.status}</span></td>
        <td class="text-right">
          <button class="icon-btn" title="Actions" onclick="event.stopPropagation();showToast('Action menu for ${s.name}')">
            <span class="material-symbols-outlined" style="font-size:18px;">more_vert</span>
          </button>
        </td>
      </tr>`;
  }).join('');
}

function filterStudents(q) {
  const filtered = STUDENTS.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    s.id.toLowerCase().includes(q.toLowerCase()) ||
    s.grade.toLowerCase().includes(q.toLowerCase())
  );
  renderStudentsTable(filtered);
}

function showStudentToast(name) { showToast(`Viewing profile: ${name}`); }

function setTab(btn, tabId) {
  btn.closest('.tab-group').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`Showing: ${btn.textContent.trim()}`);
}

// ──────────────────────────────────────────────
// ATTENDANCE
// ──────────────────────────────────────────────
let attInited = false;
function initAttendance() {
  if (!attInited) {
    attInited = true;
    document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    renderAttendanceTable();
    renderHeatmap();
  }
}

function renderAttendanceTable() {
  const tbody = document.getElementById('attendanceBody');
  if (!tbody) return;
  tbody.innerHTML = ATT_STUDENTS.map((s, i) => `
    <tr>
      <td style="color:var(--clr-secondary);font-size:12px;">${i + 1}</td>
      <td style="font-weight:600;">${s.name}</td>
      <td>${s.roll}</td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <button class="att-status-btn ${s.status === 'present' ? 'present' : ''}" onclick="setAtt(this,'present',${i})">Present</button>
          <button class="att-status-btn ${s.status === 'absent' ? 'absent' : ''}" onclick="setAtt(this,'absent',${i})">Absent</button>
          <button class="att-status-btn ${s.status === 'late' ? 'late' : ''}" onclick="setAtt(this,'late',${i})">Late</button>
        </div>
      </td>
      <td><input type="text" placeholder="Add remark..." style="border:none;background:var(--clr-surface-container-low);border-radius:4px;padding:4px 8px;font-size:12px;width:120px;outline:none;" /></td>
      <td class="text-right">
        <button class="icon-btn" onclick="showToast('${s.name} attendance saved')">
          <span class="material-symbols-outlined" style="font-size:16px;">save</span>
        </button>
      </td>
    </tr>`).join('');
}

function setAtt(btn, status, idx) {
  const btns = btn.closest('td').querySelectorAll('.att-status-btn');
  btns.forEach(b => b.classList.remove('present', 'absent', 'late'));
  btn.classList.add(status);
  ATT_STUDENTS[idx].status = status;
  updateAttCounts();
}

function updateAttCounts() {
  const present = ATT_STUDENTS.filter(s => s.status === 'present').length;
  const absent  = ATT_STUDENTS.filter(s => s.status === 'absent').length;
  // Scale to full class (these are just samples)
  document.getElementById('presentCount').textContent = (1180 - (ATT_STUDENTS.length - present) * 15).toLocaleString();
  document.getElementById('absentCount').textContent  = (60 + absent * 3).toLocaleString();
}

function markAllPresent() {
  ATT_STUDENTS.forEach((s, i) => s.status = 'present');
  renderAttendanceTable();
  updateAttCounts();
  showToast('All students marked as Present ✓');
}

function renderHeatmap() {
  const container = document.getElementById('attendanceHeatmap');
  if (!container) return;
  const colors = ['#e7e7f3','#dbe1ff','#b4c5ff','#2563eb','#004ac6'];
  let html = '';
  for (let d = 1; d <= 31; d++) {
    const ci = Math.floor(Math.random() * 5);
    html += `<div class="hm-cell" style="background:${colors[ci]};" title="Jul ${d}: ${[92,88,94,96,90,85,78][ci % 7]}% attendance"></div>`;
  }
  container.innerHTML = html;
}

// ──────────────────────────────────────────────
// MARKS
// ──────────────────────────────────────────────
let marksInited = false;
function initMarks() {
  if (marksInited) return;
  marksInited = true;
  renderMarksTable();
  renderExamList();
}

function getGrade(total) {
  if (total >= 90) return 'A+';
  if (total >= 80) return 'A';
  if (total >= 70) return 'B+';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 40) return 'D';
  return 'F';
}

function renderMarksTable() {
  const tbody = document.getElementById('marksBody');
  if (!tbody) return;
  tbody.innerHTML = MARKS_DATA.map(m => {
    const total = m.internal + m.external;
    const grade = getGrade(total);
    const pass = total >= 40;
    const badgeClass = pass ? 'badge--active' : 'badge--inactive';
    return `
      <tr>
        <td style="color:var(--clr-primary);font-size:12px;font-weight:600;">${m.id}</td>
        <td style="font-weight:600;">${m.name}</td>
        <td>
          <input type="number" value="${m.internal}" min="0" max="40" style="width:64px;padding:4px 8px;border:1px solid var(--clr-outline-variant);border-radius:var(--r-md);font-size:13px;font-family:inherit;text-align:center;outline:none;" onchange="updateTotal(this, ${MARKS_DATA.indexOf(m)}, 'internal')" />
        </td>
        <td>
          <input type="number" value="${m.external}" min="0" max="60" style="width:64px;padding:4px 8px;border:1px solid var(--clr-outline-variant);border-radius:var(--r-md);font-size:13px;font-family:inherit;text-align:center;outline:none;" onchange="updateTotal(this, ${MARKS_DATA.indexOf(m)}, 'external')" />
        </td>
        <td style="font-weight:700;font-size:15px;">${total}</td>
        <td><span class="badge badge--blue badge--no-dot" style="font-size:13px;font-weight:700;">${grade}</span></td>
        <td><span class="badge ${badgeClass}">${pass ? 'Pass' : 'Fail'}</span></td>
      </tr>`;
  }).join('');
}

function updateTotal(input, idx, field) {
  MARKS_DATA[idx][field] = parseInt(input.value) || 0;
  renderMarksTable();
}

function renderExamList() {
  const container = document.getElementById('examList');
  if (!container) return;
  const exams = [
    { subject:'Mathematics', grade:'Grade 10', date:'Jul 28, 2025', type:'Final Term', color:'#dbe1ff', icon:'calculate', iconColor:'#004ac6' },
    { subject:'Science', grade:'Grade 10', date:'Jul 30, 2025', type:'Final Term', color:'#dcfce7', icon:'science', iconColor:'#16a34a' },
    { subject:'English', grade:'Grade 11', date:'Aug 1, 2025', type:'Final Term', color:'#fef3c7', icon:'menu_book', iconColor:'#d97706' },
    { subject:'Social Studies', grade:'Grade 12', date:'Aug 3, 2025', type:'Final Term', color:'#ede9fe', icon:'public', iconColor:'#7c3aed' },
  ];
  container.innerHTML = exams.map(e => `
    <div class="exam-row">
      <div class="exam-subject-icon" style="background:${e.color};color:${e.iconColor};">
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;">${e.icon}</span>
      </div>
      <div class="exam-info">
        <div class="exam-title">${e.subject}</div>
        <div class="exam-meta">${e.grade} · ${e.type}</div>
      </div>
      <span class="badge badge--blue badge--no-dot">${e.date}</span>
      <button class="btn-secondary" onclick="showToast('${e.subject} exam details opened')">View</button>
    </div>`).join('');
}

// ──────────────────────────────────────────────
// STAFF
// ──────────────────────────────────────────────
let staffInited = false;
function initStaff() {
  if (staffInited) return;
  staffInited = true;
  const tbody = document.getElementById('staffBody');
  if (!tbody) return;
  const imgs = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAUjhhmeosMpjnnnBg03X08f5j9PA8AwYyswPVoivho5Elat-FPmvjPhlB9p8cyvukkFqXPEHnypHANNXmp4hv1OMlWODScQWjIPJObPymTKDt8CpgJQTHAZIeWaZancKVSUiMNUEFFYwWB0PeFER0nYQ4uJ4WLqwDnsWSMMFQpbEOoTqx-cJkM-oA2MgPmT1EIKe90HLkArmGi3IcDMOGt-_QSxD39GCAx30qMzKG-nVNCLbJarROA_g',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAPqHVJ7v7STK1I6SogR4LtosYaPtLvsdOnnKkf6P5SJidPmZbwInqDyQFC2UQ0PeK5ZExI-wINMdIyAL-7fFMggr__JJA4PXHr-TKJ7rRlGKsQZ7EEnQ2tGDCkfmrynxENFpaeTvhAJHa4Y_ZCPD9ZMt81Ba32dRO-CMTizmtBOZuUhMCF7ujaam057QfoeFIKZ3HS_CcK6lErD2gMgUs5n5zXTtguo-XqcL0qBQtP7o9EIK1u2wjVoQ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDEaitzm5pH9lAezrKlCMoAtjfWkNbftn6h_7V9oKovZwa3Lqc0LZboQnJoMVcwY-dhl6tno0S_qDMZy2z-4NaoGJD_mZ8VYdUZeztseIVpMlWmr5V55-3HHk1ksMQUFtKbmPNDc_eaPdkZmr41dGGBEaWkzT82dQl5uNh5I8vLJA7UXfuTWRWXFClENtJPZY7xXUGsmdfTZZNlzG1QaBYTk-YsSmLeirQgkFVxmFWu-7vh-R7EzWgi8w',
  ];
  tbody.innerHTML = STAFF_DATA.map((s, i) => {
    const bclass = s.status === 'Active' ? 'badge--active' : 'badge--pending';
    return `
      <tr onclick="showToast('Viewing ${s.name} profile')">
        <td style="color:var(--clr-primary);font-size:12px;font-weight:600;">${s.id}</td>
        <td>
          <div class="cell-student">
            <img class="staff-avatar" src="${imgs[i % 3]}" alt="${s.name}" loading="lazy" />
            <span style="font-weight:600;">${s.name}</span>
          </div>
        </td>
        <td>${s.dept}</td>
        <td>${s.role}</td>
        <td style="font-size:12px;color:var(--clr-secondary);">${s.subjects}</td>
        <td style="font-size:12px;">${s.joined}</td>
        <td><span class="badge ${bclass}">${s.status}</span></td>
        <td class="text-right">
          <div style="display:flex;gap:4px;justify-content:flex-end;">
            <button class="icon-btn" title="Edit" onclick="event.stopPropagation();showToast('Editing ${s.name}')">
              <span class="material-symbols-outlined" style="font-size:17px;">edit</span>
            </button>
            <button class="icon-btn" title="More" onclick="event.stopPropagation();">
              <span class="material-symbols-outlined" style="font-size:17px;">more_vert</span>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ──────────────────────────────────────────────
// MESSAGING
// ──────────────────────────────────────────────
let msgInited = false;
let activeMsg = null;
function initMessaging() {
  if (msgInited) return;
  msgInited = true;
  renderMsgList();
}

function renderMsgList() {
  const list = document.getElementById('msgList');
  if (!list) return;
  list.innerHTML = MESSAGES.map((m, i) => `
    <div class="msg-item ${i === 0 ? 'active' : ''}" onclick="openMsg(${i}, this)">
      <div class="msg-item-header">
        <span class="msg-from">${m.from}</span>
        <span class="msg-time">${m.time}</span>
        ${m.unread ? '<span class="msg-unread-dot"></span>' : ''}
      </div>
      <div class="msg-subject">${m.subject}</div>
      <div class="msg-preview">${m.preview}</div>
    </div>`).join('');
  if (MESSAGES.length) openMsg(0, list.querySelector('.msg-item'));
}

function openMsg(idx, el) {
  document.querySelectorAll('.msg-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  // Mark as read
  MESSAGES[idx].unread = false;
  el.querySelector('.msg-unread-dot')?.remove();

  const m = MESSAGES[idx];
  const view = document.getElementById('msgView');
  view.innerHTML = `
    <div class="msg-view-header">
      <h3 class="msg-view-title">${m.subject}</h3>
      <p class="msg-view-meta">From: <strong>${m.from}</strong> · ${m.time}</p>
    </div>
    <div class="msg-content">
      <div class="msg-view-body">${m.body.replace(/\n/g, '<br>')}</div>
    </div>
    <div style="padding:var(--sp-md) var(--sp-xl);border-top:1px solid var(--clr-outline-variant);display:flex;gap:var(--sp-sm);">
      <button class="btn-primary" onclick="showToast('Reply sent!')">
        <span class="material-symbols-outlined" style="font-size:16px;">reply</span>Reply
      </button>
      <button class="btn-secondary" onclick="showToast('Message forwarded')">Forward</button>
      <button class="icon-btn" style="margin-left:auto;" title="Delete" onclick="showToast('Message deleted')">
        <span class="material-symbols-outlined" style="color:var(--clr-error);">delete</span>
      </button>
    </div>`;
}

// ──────────────────────────────────────────────
// REPORTS
// ──────────────────────────────────────────────
let reportsInited = false;
function initReports() {
  if (reportsInited) return;
  reportsInited = true;

  // YoY Line Chart
  const yoyLabels = ['2020-21','2021-22','2022-23','2023-24','2024-25'];
  const yoyData   = [[72, 76, 80, 84, 88], [68, 72, 75, 79, 84]];
  setTimeout(() => drawLineChart('yoyCanvas', yoyData, yoyLabels), 100);

  // Fee Donut
  setTimeout(() => drawDonut('feeCanvas', [84, 12, 4], ['#004ac6','#ffdad6','#dbe1ff']), 100);
}

function downloadReport(type) {
  showToast(`Generating ${type} report... Download will start shortly.`);
}

// ──────────────────────────────────────────────
// PROMOTION
// ──────────────────────────────────────────────
let promoInited = false;
function initPromotion() {
  if (promoInited) return;
  promoInited = true;
  const tbody = document.getElementById('promotionBody');
  if (!tbody) return;
  tbody.innerHTML = PROMO_DATA.map(p => `
    <tr>
      <td style="font-weight:700;">${p.grade}</td>
      <td>${p.total}</td>
      <td style="color:#15803d;font-weight:600;">${p.promoted}</td>
      <td style="color:#b45309;font-weight:600;">${p.pending}</td>
      <td style="color:var(--clr-error);font-weight:600;">${p.held}</td>
      <td>
        <div class="promo-bar-wrap">
          <div class="promo-bar"><div class="promo-bar-fill" style="width:${p.pct}%;"></div></div>
          <span style="font-size:12px;font-weight:700;min-width:36px;">${p.pct}%</span>
        </div>
      </td>
      <td>
        <button class="btn-secondary" onclick="showToast('${p.grade} promotion confirmed!')">Confirm</button>
      </td>
    </tr>`).join('');
}

// ──────────────────────────────────────────────
// SETTINGS
// ──────────────────────────────────────────────
function showSettingsSection(id, btn) {
  document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.settings-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('settings-' + id)?.classList.add('active');
  btn.classList.add('active');
}

// ──────────────────────────────────────────────
// MODAL
// ──────────────────────────────────────────────
function openComposeModal() {
  document.getElementById('composeModal').style.display = 'flex';
}
function closeComposeModal() {
  document.getElementById('composeModal').style.display = 'none';
}
function closeModalOnBg(e) {
  if (e.target === document.getElementById('composeModal')) closeComposeModal();
}

// ──────────────────────────────────────────────
// GLOBAL SEARCH
// ──────────────────────────────────────────────
document.getElementById('globalSearch')?.addEventListener('input', function(e) {
  const q = e.target.value.toLowerCase();
  if (q.includes('student')) navigateTo('students', document.querySelector('[data-page="students"]'));
  else if (q.includes('staff')) navigateTo('staff', document.querySelector('[data-page="staff"]'));
  else if (q.includes('attend')) navigateTo('attendance', document.querySelector('[data-page="attendance"]'));
  else if (q.includes('report')) navigateTo('reports', document.querySelector('[data-page="reports"]'));
  else if (q.includes('exam') || q.includes('mark')) navigateTo('marks', document.querySelector('[data-page="marks"]'));
});

// Keyboard shortcut: Cmd/Ctrl+K
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('globalSearch')?.focus();
  }
  if (e.key === 'Escape') {
    closeComposeModal();
    document.getElementById('globalSearch')?.blur();
  }
});

// ──────────────────────────────────────────────
// NEW ENTRY BUTTON
// ──────────────────────────────────────────────
document.getElementById('newEntryBtn')?.addEventListener('click', () => {
  showToast('New Entry form opening...');
});

// ──────────────────────────────────────────────
// INIT ON LOAD
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initPage('dashboard');
});
