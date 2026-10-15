let pointCount = 0;
let myChart = null;

// ==========================================
// GESTIÓN DE PUNTOS
// ==========================================
function addPoint(x = '', y = '') {
  if (pointCount >= 10) {
    showMessage('Máximo 10 puntos permitidos', 'error');
    return;
  }

  const container = document.getElementById('pointsContainer');
  const pointDiv = document.createElement('div');
  pointDiv.className = 'point-group';
  pointDiv.id = `point_${pointCount}`;
  
  pointDiv.innerHTML = `
    <div class="point-header">
      <span class="point-label">PUNTO ${pointCount}</span>
      ${pointCount > 0 ? `<button class="btn-remove" onclick="removePoint(${pointCount})">✕</button>` : ''}
    </div>
    <div class="point-inputs-row">
      <div class="field">
        <label>X${pointCount}</label>
        <input type="number" id="x_${pointCount}" value="${x}" step="0.1">
      </div>
      <div class="field">
        <label>Y${pointCount}</label>
        <input type="number" id="y_${pointCount}" value="${y}" step="0.1">
      </div>
    </div>
  `;
  
  container.appendChild(pointDiv);
  pointCount++;
}

function removePoint(index) {
  if (pointCount <= 2) {
    showMessage('Se necesitan al menos 2 puntos', 'error');
    return;
  }
  const pointDiv = document.getElementById(`point_${index}`);
  if (pointDiv) {
    pointDiv.remove();
    renumberPoints();
  }
}

function renumberPoints() {
  const container = document.getElementById('pointsContainer');
  const points = container.querySelectorAll('.point-group');
  pointCount = 0;
  
  points.forEach((point, idx) => {
    point.id = `point_${idx}`;
    point.querySelector('.point-label').textContent = `PUNTO ${idx}`;
    
    const inputs = point.querySelectorAll('input');
    inputs[0].id = `x_${idx}`;
    inputs[1].id = `y_${idx}`;
    
    const removeBtn = point.querySelector('.btn-remove');
    if (removeBtn) {
      removeBtn.onclick = () => removePoint(idx);
    } else if (idx > 0) {
      const header = point.querySelector('.point-header');
      const btn = document.createElement('button');
      btn.className = 'btn-remove';
      btn.textContent = '✕';
      btn.onclick = () => removePoint(idx);
      header.appendChild(btn);
    }
    pointCount = idx + 1;
  });
}

function getPointsData() {
  const X = [];
  const Y = [];
  for (let i = 0; i < pointCount; i++) {
    const xInput = document.getElementById(`x_${i}`);
    const yInput = document.getElementById(`y_${i}`);
    if (xInput && yInput && xInput.value !== '' && yInput.value !== '') {
      X.push(parseFloat(xInput.value));
      Y.push(parseFloat(yInput.value));
    }
  }
  return { X, Y };
}

function showMessage(msg, type = 'success') {
  const box = document.getElementById('messageBox');
  box.innerHTML = `<div class="${type === 'error' ? 'error-msg' : 'success-msg'}">${msg}</div>`;
  setTimeout(() => { box.innerHTML = ''; }, 4000);
}

// ==========================================
// LÓGICA DE NEWTON
// ==========================================
function diferenciasDivididas(X, Y) {
  const n = X.length;
  const dd = Array.from({length: n}, () => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) dd[i][0] = Y[i];
  
  for (let j = 1; j < n; j++) {
    for (let i = 0; i < n - j; i++) {
      dd[i][j] = (dd[i+1][j-1] - dd[i][j-1]) / (X[i+j] - X[i]);
    }
  }
  
  const coeficientes = [];
  for (let j = 0; j < n; j++) coeficientes.push(dd[0][j]);
  
  return { dd, coeficientes };
}

function evaluarNewton(x, X, coeficientes) {
  let resultado = coeficientes[coeficientes.length - 1];
  for (let i = coeficientes.length - 2; i >= 0; i--) {
    resultado = resultado * (x - X[i]) + coeficientes[i];
  }
  return resultado;
}

function expandirEstandar(X, coeficientes) {
  const n = coeficientes.length;
  
  let poly = [coeficientes[n - 1]];
  
  for (let k = n - 2; k >= 0; k--) {

    const newPoly = new Array(poly.length + 1).fill(0);
    for (let i = 0; i < poly.length; i++) {
      newPoly[i + 1] += poly[i];       
      newPoly[i] -= poly[i] * X[k];       
    }
    newPoly[0] += coeficientes[k];
    poly = newPoly;
  }
  
  return poly; 
}

function formatearEstandar(poly) {
  const grado = poly.length - 1;
  let resultado = `P${grado}(x) = `;
  let first = true;
  
  for (let i = grado; i >= 0; i--) {
    const coef = poly[i];
    if (Math.abs(coef) > 1e-10) {
      if (!first && coef > 0) resultado += '+ ';
      if (coef < 0) resultado += '- ';
      
      const absCoef = Math.abs(coef);
      if (i === 0) resultado += `${absCoef.toFixed(6)}`;
      else if (i === 1) resultado += `${absCoef.toFixed(6)}x `;
      else resultado += `${absCoef.toFixed(6)}x^${i} `;
      first = false;
    }
  }
  return { texto: resultado, poly };
}

// ==========================================
// CONTROLADOR PRINCIPAL
// ==========================================
function calcularNewton() {
  try {
    const { X, Y } = getPointsData();
    const xEval = parseFloat(document.getElementById('xEval').value);
    
    if (X.length < 2) return showMessage('Se necesitan al menos 2 puntos', 'error');
    if (isNaN(xEval)) return showMessage('El punto a evaluar debe ser válido', 'error');
    if (new Set(X).size !== X.length) return showMessage('Error: Hay valores de X duplicados', 'error');
    
    const { dd, coeficientes } = diferenciasDivididas(X, Y);
    const P_eval = evaluarNewton(xEval, X, coeficientes);
    const formateado = formatearEstandar(expandirEstandar(X, coeficientes));
    
    // 1. Tabla de datos
    const dataBody = document.getElementById('dataBody');
    dataBody.innerHTML = X.map((x, i) => `
      <tr>
        <td>${i}</td>
        <td style="color: var(--accent-primary); font-weight: bold;">${x}</td>
        <td style="color: var(--accent-success); font-weight: bold;">${Y[i]}</td>
      </tr>
    `).join('');

    // 2. Tabla de diferencias divididas
    const n = X.length;
    let ddHTML = '<table class="dd-table"><thead><tr><th>i</th><th>x</th><th>f[x]</th>';
    for (let j = 1; j < n; j++) ddHTML += `<th>${j}º Orden</th>`;
    ddHTML += '</tr></thead><tbody>';
    
    for (let i = 0; i < n; i++) {
      ddHTML += `<tr>
        <td style="color: var(--accent-primary);">${i}</td>
        <td style="color: var(--accent-primary); font-weight: bold;">${X[i]}</td>
        <td style="color: var(--accent-success); font-weight: bold;">${dd[i][0].toFixed(4)}</td>`;
      for (let j = 1; j < n; j++) {
        if (i < n - j) {
          ddHTML += `<td class="${i === 0 ? 'highlight-coef' : ''}">${dd[i][j].toFixed(6)}</td>`;
        } else {
          ddHTML += '<td></td>';
        }
      }
      ddHTML += '</tr>';
    }
    ddHTML += '</tbody></table>';
    document.getElementById('ddTableContainer').innerHTML = ddHTML;
    
    // 3. Coeficientes y Resultados
    document.getElementById('coeficientesDisplay').innerHTML = coeficientes.map((c, i) => `c${i} = ${c.toFixed(6)}`).join('<br>');
    document.getElementById('xEvalDisplay').textContent = xEval;
    document.getElementById('resultadoFinal').textContent = `${P_eval.toFixed(4)} ms`;
    
    // 4. Polinomio
    let newtonHTML = '<strong>Forma de Newton:</strong><br>P(x) = ';
    coeficientes.forEach((c, i) => {
      if (i === 0) newtonHTML += `${c.toFixed(4)}`;
      else {
        newtonHTML += ` + ${c.toFixed(6)}`;
        for (let j = 0; j < i; j++) newtonHTML += `(x-${X[j]})`;
      }
    });
    document.getElementById('polinomioNewton').innerHTML = newtonHTML;
    document.getElementById('polinomioEstandar').textContent = formateado.texto;
    
    // 5. Grid de coeficientes estándar
    const coefGrid = document.getElementById('coefGrid');
    coefGrid.innerHTML = '';
    for (let i = formateado.poly.length - 1; i >= 0; i--) {
      coefGrid.innerHTML += `<div class="coef-item"><span>a${i} =</span><span style="color: var(--accent-primary); font-weight: bold;">${formateado.poly[i].toFixed(6)}</span></div>`;
    }
    
    // 6. Validación
    document.getElementById('validacion').innerHTML = X.map((x, i) => {
      const val = evaluarNewton(x, X, coeficientes);
      const ok = Math.abs(val - Y[i]) < 1e-6;
      return `<div class="validation-item">P(${x}) = ${val.toFixed(4)} <span style="color: ${ok ? 'var(--accent-success)' : 'var(--accent-danger)'}">${ok ? '✓' : '✗'} (y=${Y[i]})</span></div>`;
    }).join('');
    
    // 7. Pasos
    let stepsHTML = '';
    for (let order = 1; order < n; order++) {
      stepsHTML += `<div style="margin-bottom: 0.5rem;"><strong>Diferencias de ${order}º orden:</strong> `;
      for (let i = 0; i < n - order; i++) stepsHTML += `f[x${i}...x${i+order}] = ${dd[i][order].toFixed(6)}  `;
      stepsHTML += `</div>`;
    }
    stepsHTML += `<div class="formula-box" style="margin-top: 1rem; text-align: center;">P(${xEval}) = <strong style="color: var(--accent-success); font-size: 1.2rem;">${P_eval.toFixed(4)} ms</strong></div>`;
    document.getElementById('stepsContent').innerHTML = stepsHTML;
    
    // Mostrar resultados y graficar
    document.getElementById('resultados').classList.remove('hidden');
    dibujarGrafica(X, Y, coeficientes, xEval, P_eval);
    showMessage('✅ Cálculo completado exitosamente', 'success');
    
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
    console.error(error);
  }
}

function dibujarGrafica(X, Y, coeficientes, xEval, yEval) {
  const puntos = [];
  const minX = Math.min(...X) - 0.5;
  const maxX = Math.max(...X) + 0.5;
  for (let x = minX; x <= maxX; x += 0.05) {
    puntos.push({x: x, y: evaluarNewton(x, X, coeficientes)});
  }
  
  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#a855f7'];
  
  if (myChart) myChart.destroy();
  myChart = new Chart(document.getElementById('newtonChart'), {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Polinomio P(x)',
          data: puntos,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'Puntos Experimentales',
          data: X.map((x, i) => ({x, y: Y[i]})),
          borderColor: '#f59e0b',
          backgroundColor: colors.slice(0, X.length),
          borderWidth: 2,
          pointRadius: 8,
          showLine: false
        },
        {
          label: `Evaluado (${xEval}, ${yEval.toFixed(2)})`,
          data: [{x: xEval, y: yEval}],
          backgroundColor: '#ef4444',
          borderColor: '#fff',
          borderWidth: 3,
          pointRadius: 12,
          showLine: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#9ca3af' } },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: (${ctx.parsed.x.toFixed(2)}, ${ctx.parsed.y.toFixed(2)})` } }
      },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Carga x (100 req/s)', color: '#9ca3af' }, grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
        y: { title: { display: true, text: 'Latencia y (ms)', color: '#9ca3af' }, grid: { color: '#374151' }, ticks: { color: '#9ca3af' } }
      }
    }
  });
}

function resetear() {
  document.getElementById('pointsContainer').innerHTML = '';
  pointCount = 0;
  addPoint(1, 45);
  addPoint(2, 65);
  addPoint(4, 110);
  addPoint(7, 220);
  document.getElementById('xEval').value = '5';
  document.getElementById('resultados').classList.add('hidden');
  if (myChart) { myChart.destroy(); myChart = null; }
  showMessage('Valores restaurados a los datos del caso de estudio', 'success');
}

// Inicializar al cargar
window.onload = resetear;