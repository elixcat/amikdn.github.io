(function() {
    'use strict';
    
    var style = document.createElement('style');
    style.textContent = `
        .server.focus { 
            background: linear-gradient(to right, #8a2387, #e94057, #f27121) !important; 
            color: #fff !important; 
        }
        .menu__item.focus {
            background: #8a2387 !important;
        }
    `;
    document.head.appendChild(style);

    // Обов'язкова частина для плагіна
    Lampa.Manifest.plugins = Lampa.Manifest.plugins || [];
    Lampa.Manifest.plugins.push({
        name: 'Dark Night Theme',
        version: '1.0.0',
        description: 'Темная тема для кнопок'
    });
})();
