(function () {
  'use strict';

  var Storage = Lampa.Storage;
  var Lang = Lampa.Lang;
  var Platform = Lampa.Platform;

  Lang.add({
    nav_ext_settings_title: { en: 'Navigation Bar', ru: 'Навигационная панель' },
    nav_ext_scale: { en: 'Scale', ru: 'Масштаб панели' }
  });

  var config = {
    version: '1.1.0',
    plugin_name: 'navigation_bar',
    menuButtons: []
  };

  function t(key) { return Lang.translate(key) || key; }

  // --- Функції логіки (як у вас) ---
  function extractMenuButtons() {
    var menuItems = [];
    var menuElement = document.querySelector('.menu__list');
    if (!menuElement) return menuItems;
    var items = menuElement.querySelectorAll('.menu__item[data-action]');
    items.forEach(function (item, index) {
      var action = item.getAttribute('data-action');
      var textElement = item.querySelector('.menu__text');
      var iconElement = item.querySelector('.menu__ico svg use');
      if (action && textElement) {
        var iconHref = iconElement ? iconElement.getAttribute('xlink:href') : null;
        var sprite = iconHref ? iconHref.replace('#sprite-', '') : 'home';
        menuItems.push({ action: action, title: textElement.textContent.trim(), sprite: sprite, order: index, setting_key: 'nav_ext_enable_' + action });
      }
    });
    return menuItems;
  }

  function isButtonEnabled(buttonConfig) { return Storage.get(buttonConfig.setting_key, false); }

  function createButton(buttonConfig) {
    return '<div class="navigation-bar__item nav-ext-item" data-action="' + buttonConfig.action + '">' +
           '<div class="navigation-bar__icon"><svg><use xlink:href="#sprite-' + buttonConfig.sprite + '"></use></svg></div>' +
           '<div class="navigation-bar__label">' + buttonConfig.title + '</div></div>';
  }

  function handleAction(action) {
    var menuItem = document.querySelector('.menu__item[data-action="' + action + '"]');
    if (menuItem) { $(menuItem).trigger('hover:enter'); if (Lampa.Menu && Lampa.Menu.close) Lampa.Menu.close(); }
  }

  function removeButtons() { document.querySelectorAll('.nav-ext-item').forEach(function (btn) { btn.remove(); }); }

  function updateScale() {
    var navBar = document.querySelector('.navigation-bar');
    var scale = Storage.get('nav_ext_scale', '100');
    
    if (navBar) {
      if (scale === '0') {
        navBar.style.display = 'none';
      } else {
        navBar.style.display = '';
        navBar.style.transform = 'scale(' + (scale / 100) + ')';
        navBar.style.transformOrigin = 'bottom center';
      }
    }
  }

  function insertButtons() {
    if (!Platform.screen('mobile')) return;
    var navigationBar = document.querySelector('.navigation-bar__body');
    if (!navigationBar) return;

    removeButtons();
    if (config.menuButtons.length === 0) config.menuButtons = extractMenuButtons();

    var menuButtons = config.menuButtons.filter(function (btn) {
      return btn.action !== 'main' && btn.action !== 'settings' && isButtonEnabled(btn);
    });

    menuButtons.forEach(function (buttonConfig) {
      var buttonElement = $(createButton(buttonConfig))[0];
      buttonElement.addEventListener('click', function () { handleAction(buttonConfig.action); });
      navigationBar.appendChild(buttonElement);
    });
    
    updateScale();
  }

  function addStyles() {
    var style = document.createElement('style');
    style.id = 'nav-ext-styles';
    style.textContent = `
        .navigation-bar { transition: transform 0.2s ease; }
        .navigation-bar__body { display: flex !important; flex-wrap: nowrap !important; align-items: center !important; justify-content: space-around !important; padding: 0.5em !important; }
        .navigation-bar__item { display: flex !important; flex-direction: column; align-items: center; cursor: pointer; flex: 1; }
        .navigation-bar__icon { width: 1.5em !important; height: 1.5em !important; }
        .navigation-bar__label { font-size: 0.6em !important; }
    `;
    document.head.appendChild(style);
  }

  function addSettings() {
    Lampa.SettingsApi.addComponent({ component: 'nav_bar_extension', name: t('nav_ext_settings_title'), icon: '<svg><use xlink:href="#sprite-favorite"></use></svg>' });

    // Вибір масштабу
    Lampa.SettingsApi.addParam({
      component: 'nav_bar_extension',
      param: { name: 'nav_ext_scale', type: 'select', values: { '100': '100%', '75': '75%', '50': '50%', '25': '25%', '0': '0% (Hidden)' }, default: '100' },
      field: { name: t('nav_ext_scale') },
      onRender: function (item) { item.on('change', updateScale); }
    });

    // Кнопки
    setTimeout(function () {
      config.menuButtons.forEach(function (button) {
        if (button.action !== 'main' && button.action !== 'settings') {
          Lampa.SettingsApi.addParam({
            component: 'nav_bar_extension',
            param: { name: button.setting_key, type: 'trigger', default: false },
            field: { name: button.title },
            onRender: function (item) { item.on('change', insertButtons); }
          });
        }
      });
    }, 1000);
  }

  function init() {
    if (!Platform.screen('mobile')) return;
    addSettings();
    addStyles();
    
    // Ініціалізація
    Lampa.Listener.follow('app', function (e) {
        if(e.type == 'ready') insertButtons();
    });
    
    Lampa.Storage.listener.follow('change', function (e) {
      if (e.name == 'nav_ext_scale') updateScale();
    });
  }

  init();
})();
