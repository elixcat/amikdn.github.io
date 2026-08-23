(function() {
  'use strict';

  function addButtons() {
    // Якщо кнопки вже є, нічого не робимо
    if ($('#RELOAD').length > 0) return;

    var my_reload = '<div id="RELOAD" class="head__action selector" tabindex="0">' +
        '<svg fill="#ffffff" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M4,12a1,1,0,0,1-2,0A9.983,9.983,0,0,1,18.242,4.206V2.758a1,1,0,1,1,2,0v4a1,1,0,0,1-1,1h-4a1,1,0,0,1,0-2h1.743A7.986,7.986,0,0,0,4,12Zm17-1a1,1,0,0,0-1,1A7.986,7.986,0,0,1,7.015,18.242H8.757a1,1,0,1,0,0-2h-4a1,1,0,0,0-1,1v4a1,1,0,0,0,2,0V19.794A9.984,9.984,0,0,0,22,12,1,1,0,0,0,21,11Z" fill="currentColor"></path>' +
        '</svg></div>';

    var my_exit = '<div id="EXIT" class="head__action selector" tabindex="0">' +
        '<svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>' +
        '<line x1="8" y1="8" x2="16" y2="16" stroke="currentColor" stroke-width="2"/>' +
        '<line x1="16" y1="8" x2="8" y2="16" stroke="currentColor" stroke-width="2"/>' +
        '</svg></div>';

    var container = $('#app > div.head > div > div.head__actions');
    if (container.length > 0) {
        container.append(my_reload).append(my_exit);

        $('#RELOAD').on('hover:enter hover:click hover:touch', function() {
            if (window.Lampa && window.Lampa.App && typeof window.Lampa.App.reload === 'function') {
                window.Lampa.App.reload();
            } else {
                window.location.reload();
            }
        });

        $('#EXIT').on('hover:enter hover:click hover:touch', function() {
            if (Lampa.Platform.is('android')) Lampa.Android.exit();
            else if (Lampa.Platform.is('tizen')) tizen.application.getCurrentApplication().exit();
            else if (Lampa.Platform.is('webos')) window.close();
            else if (Lampa.Platform.is('orsay')) Lampa.Orsay.exit();
            else Lampa.Activity.out();
        });
    }
  }

  // Спостерігач за змінами в DOM
  var observer = new MutationObserver(function(mutations) {
    if ($('.head__actions').length > 0 && $('#RELOAD').length === 0) {
        addButtons();
    }
  });

  // Запуск спостереження
  if (window.appready) {
    addButtons();
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    Lampa.Listener.follow('app', function(e) {
      if (e.type === 'ready') {
        addButtons();
        observer.observe(document.body, { childList: true, subtree: true });
      }
    });
  }
})();
