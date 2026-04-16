(function() {
  'use strict';

  // Check if user already made a choice
  var consent = localStorage.getItem('cookie_consent');
  if (consent === 'accepted' || consent === 'refused') return;

  // Create banner
  var banner = document.createElement('div');
  banner.id = 'cookieBanner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Consentement cookies');

  banner.style.cssText = [
    'position:fixed',
    'bottom:0',
    'left:0',
    'right:0',
    'z-index:99999',
    'padding:0',
    'margin:0',
    'font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif',
    'transform:translateY(100%)',
    'transition:transform .5s cubic-bezier(.22,1,.36,1)',
    'pointer-events:none'
  ].join(';');

  var inner = document.createElement('div');
  inner.style.cssText = [
    'max-width:680px',
    'margin:0 auto 1.25rem',
    'padding:1.5rem 2rem',
    'background:#ffffff',
    'border-radius:16px',
    'box-shadow:0 8px 32px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06)',
    'display:flex',
    'flex-wrap:wrap',
    'align-items:center',
    'gap:1rem',
    'pointer-events:auto',
    'border:1px solid rgba(0,0,0,.06)'
  ].join(';');

  // Text
  var text = document.createElement('p');
  text.style.cssText = [
    'flex:1 1 300px',
    'margin:0',
    'font-size:.925rem',
    'line-height:1.6',
    'color:#1A1A2E'
  ].join(';');
  text.innerHTML = 'Ce site utilise des cookies pour am\u00e9liorer votre exp\u00e9rience. ' +
    'En savoir plus dans nos <a href="mentions-legales.html" style="color:#2563EB;text-decoration:underline;font-weight:500">mentions l\u00e9gales</a>.';

  // Buttons wrapper
  var btns = document.createElement('div');
  btns.style.cssText = [
    'display:flex',
    'gap:.625rem',
    'flex-shrink:0'
  ].join(';');

  // Accept button
  var acceptBtn = document.createElement('button');
  acceptBtn.textContent = 'Accepter';
  acceptBtn.style.cssText = [
    'padding:.625rem 1.5rem',
    'background:#2563EB',
    'color:#fff',
    'border:none',
    'border-radius:10px',
    'font-size:.875rem',
    'font-weight:600',
    'cursor:pointer',
    'transition:background .2s,transform .15s',
    'font-family:inherit',
    'line-height:1.4'
  ].join(';');
  acceptBtn.addEventListener('mouseenter', function() { this.style.background = '#1d4ed8'; });
  acceptBtn.addEventListener('mouseleave', function() { this.style.background = '#2563EB'; });
  acceptBtn.addEventListener('mousedown', function() { this.style.transform = 'scale(.97)'; });
  acceptBtn.addEventListener('mouseup', function() { this.style.transform = 'scale(1)'; });

  // Refuse button
  var refuseBtn = document.createElement('button');
  refuseBtn.textContent = 'Refuser';
  refuseBtn.style.cssText = [
    'padding:.625rem 1.5rem',
    'background:transparent',
    'color:#1A1A2E',
    'border:1.5px solid #d1d5db',
    'border-radius:10px',
    'font-size:.875rem',
    'font-weight:600',
    'cursor:pointer',
    'transition:border-color .2s,background .2s,transform .15s',
    'font-family:inherit',
    'line-height:1.4'
  ].join(';');
  refuseBtn.addEventListener('mouseenter', function() {
    this.style.borderColor = '#9ca3af';
    this.style.background = 'rgba(0,0,0,.03)';
  });
  refuseBtn.addEventListener('mouseleave', function() {
    this.style.borderColor = '#d1d5db';
    this.style.background = 'transparent';
  });
  refuseBtn.addEventListener('mousedown', function() { this.style.transform = 'scale(.97)'; });
  refuseBtn.addEventListener('mouseup', function() { this.style.transform = 'scale(1)'; });

  // Assemble
  btns.appendChild(acceptBtn);
  btns.appendChild(refuseBtn);
  inner.appendChild(text);
  inner.appendChild(btns);
  banner.appendChild(inner);
  document.body.appendChild(banner);

  // Slide up animation
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      banner.style.transform = 'translateY(0)';
    });
  });

  // Handle choices
  function closeBanner(choice) {
    localStorage.setItem('cookie_consent', choice);
    banner.style.transform = 'translateY(100%)';
    setTimeout(function() {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 500);
  }

  acceptBtn.addEventListener('click', function() { closeBanner('accepted'); });
  refuseBtn.addEventListener('click', function() { closeBanner('refused'); });

  // Responsive: stack buttons on mobile
  var mq = window.matchMedia('(max-width: 540px)');
  function applyMobile(e) {
    if (e.matches) {
      inner.style.flexDirection = 'column';
      inner.style.padding = '1.25rem 1.25rem';
      inner.style.margin = '0 .75rem 1rem';
      text.style.flex = '1 1 auto';
      text.style.fontSize = '.875rem';
      btns.style.width = '100%';
      acceptBtn.style.flex = '1';
      refuseBtn.style.flex = '1';
    } else {
      inner.style.flexDirection = '';
      inner.style.padding = '1.5rem 2rem';
      inner.style.margin = '0 auto 1.25rem';
      text.style.flex = '1 1 300px';
      text.style.fontSize = '.925rem';
      btns.style.width = '';
      acceptBtn.style.flex = '';
      refuseBtn.style.flex = '';
    }
  }
  applyMobile(mq);
  if (mq.addEventListener) {
    mq.addEventListener('change', applyMobile);
  } else if (mq.addListener) {
    mq.addListener(applyMobile);
  }
})();
