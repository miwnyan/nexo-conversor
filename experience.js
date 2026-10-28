(() => {
  'use strict';
  const canvas = document.getElementById('instrument-dial');
  const amountInput = document.getElementById('amount');
  if (!canvas || !amountInput) return;
  const context = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ranges = {
    currency: [0, 1000],
    length: [0, 1000],
    mass: [0, 1000],
    temperature: [-100, 500]
  };
  let category = 'currency';
  let displayValue = Number(amountInput.value) || 0;
  let targetValue = displayValue;
  let ratio = 1;
  let size = 400;
  let dragging = false;
  let frame = 0;
  const startAngle = Math.PI * .75;
  const sweep = Math.PI * 1.5;

  function range() { return ranges[category] || ranges.currency; }
  function normalized(value) {
    const [min, max] = range();
    return Math.min(1, Math.max(0, (value - min) / (max - min)));
  }
  function angleFor(value) { return startAngle + normalized(value) * sweep; }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    size = Math.max(180, Math.min(rect.width, rect.height || rect.width));
    ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function draw() {
    const center = size / 2;
    const radius = size * .39;
    context.clearRect(0, 0, size, size);
    context.save();
    context.translate(center, center);

    const metal = context.createRadialGradient(-radius * .3, -radius * .35, radius * .08, 0, 0, radius * 1.05);
    metal.addColorStop(0, '#ffffff');
    metal.addColorStop(.46, '#e7e6df');
    metal.addColorStop(.78, '#c2c5bf');
    metal.addColorStop(1, '#777d78');
    context.fillStyle = metal;
    context.beginPath();
    context.arc(0, 0, radius * .78, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#171918';
    context.lineWidth = 1;
    context.stroke();

    for (let index = 0; index <= 60; index += 1) {
      const angle = startAngle + sweep * index / 60;
      const major = index % 5 === 0;
      const active = index / 60 <= normalized(displayValue);
      const outer = radius;
      const inner = radius - (major ? size * .035 : size * .018);
      context.beginPath();
      context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      context.strokeStyle = active ? '#e53b2f' : '#5f6560';
      context.lineWidth = major ? 2.2 : .8;
      context.stroke();
      if (major) {
        const [min, max] = range();
        const label = Math.round(min + (max - min) * index / 60);
        const labelRadius = radius - size * .064;
        context.save();
        context.translate(Math.cos(angle) * labelRadius, Math.sin(angle) * labelRadius);
        context.rotate(angle + Math.PI / 2);
        context.fillStyle = '#333834';
        context.font = `700 ${Math.max(7, size * .022)}px "Courier New", monospace`;
        context.textAlign = 'center';
        context.fillText(String(label), 0, 2);
        context.restore();
      }
    }

    const angle = angleFor(displayValue);
    context.save();
    context.rotate(angle);
    context.beginPath();
    context.moveTo(-size * .025, 0);
    context.lineTo(size * .025, -size * .018);
    context.lineTo(radius * .7, 0);
    context.lineTo(size * .025, size * .018);
    context.closePath();
    context.fillStyle = '#e53b2f';
    context.shadowColor = '#e53b2f66';
    context.shadowBlur = 10;
    context.fill();
    context.restore();
    context.shadowBlur = 0;

    context.fillStyle = '#171918';
    context.beginPath();
    context.arc(0, 0, size * .036, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#d6ef45';
    context.beginPath();
    context.arc(0, 0, size * .012, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#171918';
    context.font = `800 ${Math.max(8, size * .025)}px "Courier New", monospace`;
    context.textAlign = 'center';
    context.fillText(category.toUpperCase(), 0, size * .19);
    context.restore();
  }

  function animate() {
    frame = 0;
    const delta = targetValue - displayValue;
    displayValue += delta * (reduced ? 1 : .18);
    if (Math.abs(delta) < .005) displayValue = targetValue;
    draw();
    if (displayValue !== targetValue) frame = requestAnimationFrame(animate);
  }

  function moveTo(value) {
    targetValue = Number.isFinite(value) ? value : 0;
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(animate);
  }

  function updateAria(value) {
    const [min, max] = range();
    canvas.setAttribute('aria-valuemin', String(min));
    canvas.setAttribute('aria-valuemax', String(max));
    canvas.setAttribute('aria-valuenow', String(value));
    canvas.setAttribute('aria-valuetext', `${value.toLocaleString('pt-BR')} em ${category}`);
  }

  function setAmount(value) {
    const [min, max] = range();
    const clamped = Math.min(max, Math.max(min, value));
    const rounded = Math.round(clamped * 100) / 100;
    amountInput.value = String(rounded);
    updateAria(rounded);
    moveTo(rounded);
    amountInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function valueFromPointer(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    let angle = Math.atan2(y, x);
    while (angle < startAngle) angle += Math.PI * 2;
    if (angle > startAngle + sweep) {
      const distanceToStart = Math.abs(angle - Math.PI * 2 - startAngle);
      const distanceToEnd = Math.abs(angle - (startAngle + sweep));
      angle = distanceToStart < distanceToEnd ? startAngle : startAngle + sweep;
    }
    const [min, max] = range();
    return min + (max - min) * (angle - startAngle) / sweep;
  }

  canvas.addEventListener('pointerdown', event => {
    dragging = true;
    canvas.setPointerCapture(event.pointerId);
    setAmount(valueFromPointer(event));
  });
  canvas.addEventListener('pointermove', event => { if (dragging) setAmount(valueFromPointer(event)); });
  canvas.addEventListener('pointerup', event => { dragging = false; canvas.releasePointerCapture(event.pointerId); });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('keydown', event => {
    if (!['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const [min, max] = range();
    const step = event.shiftKey ? 10 : 1;
    let value = Number(amountInput.value) || 0;
    if (event.key === 'Home') value = min;
    else if (event.key === 'End') value = max;
    else value += ['ArrowUp','ArrowRight'].includes(event.key) ? step : -step;
    setAmount(value);
  });
  amountInput.addEventListener('input', () => {
    const value = Number(amountInput.value);
    if (Number.isFinite(value)) { updateAria(value); moveTo(value); }
  });
  window.addEventListener('nexo:data', event => {
    category = event.detail.category;
    updateAria(event.detail.amount);
    moveTo(event.detail.amount);
  });
  new ResizeObserver(resize).observe(canvas);
  if (window.NexoVisualData) category = window.NexoVisualData.category;
  updateAria(Number(amountInput.value) || 0);
  resize();
})();
