// Konfigurasi Google Sheets
const SHEET_ID = '1YO1CmcaJhYUHSJJjqVqH811EkotWMgPiNxGb73QonNpRx8'; // Ganti dengan ID Sheet Anda
const SHEET_NAME = 'Sheet1'; // Ganti dengan nama sheet
const API_KEY = 'AIzaSyCgVPJNfeqPnbB1DWgsGitWeY3-0b4HsRA'; // Dapatkan dari Google Cloud Console
const SHEET_URL = `https://sheets.googleapis.com/v4/spreadsheets/1YO1CmcaJhYUHSJJjqVqH811EkotWMgPiNxGb73QonNpRx8/values/Sheet1?key=AIzaSyCgVPJNfeqPnbB1DWgsGitWeY3-0b4HsRA`;

// Variabel untuk menyimpan data dan chart
let jsonData = [];
let charts = {
  lineChart: null,
  progressChart: null,
  trendChart: null,
  regChart: null
};

// Fungsi utama untuk mengambil data
async function fetchData() {
  try {
    document.getElementById('sheetLink').href = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
    
    const response = await fetch(SHEET_URL);
    const data = await response.json();
    
    // Konversi dari array ke object
    const headers = data.values[0];
    jsonData = data.values.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });
    
    // Update UI
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
    renderTable();
    renderCharts();
    
  } catch (error) {
    console.error('Error fetching data:', error);
    alert('Gagal mengambil data. Cek console untuk detail.');
  }
}

// Fungsi render tabel
function renderTable() {
  const tableHead = document.querySelector('#dataTable thead');
  const tableBody = document.querySelector('#dataTable tbody');

  tableHead.innerHTML = '<tr></tr>';
  tableBody.innerHTML = '';

  // Header
  Object.keys(jsonData[0]).forEach(key => {
    tableHead.querySelector('tr').innerHTML += `<th>${key}</th>`;
  });

  // Isi tabel
  jsonData.forEach(row => {
    const tr = document.createElement('tr');
    Object.values(row).forEach(value => {
      tr.innerHTML += `<td>${value || '-'}</td>`;
    });
    tableBody.appendChild(tr);
  });
}

// Fungsi render grafik
function renderCharts() {
  // Hancurkan chart sebelumnya jika ada
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });

  // 1. Grafik Progress per Line
  const lineCtx = document.getElementById('lineChart').getContext('2d');
  charts.lineChart = new Chart(lineCtx, {
    type: 'bar',
    data: getLineChartData(),
    options: chartOptions('Rata-rata Progress per Line (%)')
  });

  // 2. Distribusi Progress
  const progressCtx = document.getElementById('progressChart').getContext('2d');
  charts.progressChart = new Chart(progressCtx, {
    type: 'pie',
    data: getProgressChartData(),
    options: { responsive: true }
  });

  // 3. Trend Harian
  const trendCtx = document.getElementById('trendChart').getContext('2d');
  charts.trendChart = new Chart(trendCtx, {
    type: 'line',
    data: getTrendChartData(),
    options: chartOptions('Trend Progress Harian (%)')
  });

  // 4. Perbandingan REG
  const regCtx = document.getElementById('regChart').getContext('2d');
  charts.regChart = new Chart(regCtx, {
    type: 'bar',
    data: getRegChartData(),
    options: chartOptions('Rata-rata Progress per REG (%)')
  });
}

// Fungsi pembantu untuk chart data
function getLineChartData() {
  const lines = ["REPAIR", "LINE 2", "Seatcover", "LINE 1"];
  return {
    labels: lines,
    datasets: [{
      label: 'Progress',
      data: lines.map(line => calculateAverageProgress(line)),
      backgroundColor: ['#4BBF73', '#1F9BCF', '#F0AD4E', '#D9534F']
    }]
  };
}

function getProgressChartData() {
  const progressLevels = ["100%", "75%", "50%", "25%", "0%"];
  return {
    labels: [...progressLevels, "Kosong"],
    datasets: [{
      data: [
        ...progressLevels.map(level => countProgress(level)),
        countEmptyProgress()
      ],
      backgroundColor: ['#4BBF73', '#1F9BCF', '#F0AD4E', '#FFC107', '#D9534F', '#999']
    }]
  };
}

function getTrendChartData() {
  const dates = [...new Set(jsonData.map(item => item.DATE))].sort();
  return {
    labels: dates,
    datasets: [{
      label: 'Progress',
      data: dates.map(date => calculateDailyAverage(date)),
      borderColor: '#4BBF73',
      borderWidth: 2,
      fill: false
    }]
  };
}

function getRegChartData() {
  const regs = [...new Set(jsonData.map(item => item.REG))].filter(Boolean);
  return {
    labels: regs,
    datasets: [{
      label: 'Progress',
      data: regs.map(reg => calculateRegAverage(reg)),
      backgroundColor: '#1F9BCF'
    }]
  };
}

// Fungsi utilitas
function chartOptions(title) {
  return {
    responsive: true,
    plugins: {
      title: { display: true, text: title }
    },
    scales: { y: { beginAtZero: true, max: 100 } }
  };
}

function parseProgress(progress) {
  return progress ? parseInt(progress) : 0;
}

function calculateAverageProgress(line) {
  const items = jsonData.filter(item => item.LINE === line);
  return (items.reduce((sum, item) => sum + parseProgress(item.PROGRESS), 0) / items.length || 0;
}

function calculateDailyAverage(date) {
  const dailyData = jsonData.filter(item => item.DATE === date);
  return (dailyData.reduce((sum, item) => sum + parseProgress(item.PROGRESS), 0) / dailyData.length || 0;
}

function calculateRegAverage(reg) {
  const regData = jsonData.filter(item => item.REG === reg);
  return (regData.reduce((sum, item) => sum + parseProgress(item.PROGRESS), 0) / regData.length || 0;
}

function countProgress(progress) {
  return jsonData.filter(item => item.PROGRESS === progress).length;
}

function countEmptyProgress() {
  return jsonData.filter(item => !item.PROGRESS).length;
}

// Event listener
document.getElementById('refreshBtn').addEventListener('click', fetchData);
document.getElementById('floatRefresh').addEventListener('click', fetchData);

// Jalankan pertama kali
fetchData();

// Auto-refresh setiap 5 menit
setInterval(fetchData, 300000);