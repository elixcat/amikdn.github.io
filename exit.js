(function() {
  'use strict';

  function exitLamp() {
    if (Lampa.Platform.is('android')) {
      Lampa.Android.exit();
    } else {
      window.close();
    }
  }

  function reloadLamp() {
    window.location.reload();
  }
  
  function addListener(element, callback) {
    element.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      callback();
    });
  }

  function addButtons() {
    // Шукаємо шторку більш надійно
    var headerActions = document.querySelector('.head__actions');
    if (!headerActions) return;
    
    // Перевірка, чи ми вже додали кнопки
    if (document.getElementById('RELOAD')) return;

    var buttonsHTML =
      '<div id="RELOAD" class="head__action selector" tabindex="0" style="padding:10px; cursor:pointer;">' +
        '<svg width="24" height="24" fill="#ffffff" viewBox="0 0 24 24"><path d="M4,12a1,1,0,0,1-2,0A9.983,9.983,0,0,1,18.242,4.206V2.758a1,1,0,1,1,2,0v4a1,1,0,0,1-1,1h-4a1,1,0,0,1,0-2h1.743A7.986,7.986,0,0,0,4,12Zm17-1a1,1,0,0,0-1,1A7.986,7.986,0,0,1,7.015,18.242H8.757a1,1,0,1,0,0-2h-4a1,1,0,0,0-1,1v4a1,1,0,0,0,2,0V19.794A9.984,9.984,0,0,0,22,12,1,1,0,0,0,21,11Z"></path></svg>' +
      '</div>' +
      '<div id="EXIT" class="head__action selector" tabindex="0" style="padding:10px; cursor:pointer;">' +
        '<svg width="24" height="24" fill="none" stroke="#ffffff" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="8" y1="8" x2="16" y2="16" stroke-width="2"/><line x1="16" y1="8" x2="8" y2="16" stroke-width="2"/></svg>' +
      '</div>';

    headerActions.insertAdjacentHTML('afterbegin', buttonsHTML);

    addListener(document.getElementById('RELOAD'), reloadLamp);
    addListener(document.getElementById('EXIT'), exitLamp);
  }

  // Чекаємо готовності додатку
  if (window.appready) {
    addButtons();
  } else {
    Lampa.Listener.follow('app', function(e) {
      if (e.type === 'ready') setTimeout(addButtons, 1000); // Затримка 1 сек
    });
  }
})();
