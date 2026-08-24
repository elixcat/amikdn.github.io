(function() {
    'use strict';

    // Маніфест плагіна
    Lampa.Manifest.plugins = Lampa.Manifest.plugins || [];
    Lampa.Manifest.plugins.push({
        name: 'Dark Night Theme Only',
        version: '1.0.0',
        description: 'Тільки тема Dark Night'
    });

    function applyTheme() {
        var style = document.createElement('style');
        style.id = 'dark-night-theme-only';
        style.type = 'text/css';
        style.textContent = `
            /* Основной фон */
            body { 
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%) !important; 
                color: #ffffff !important; 
            }
            
            /* Фокус кнопок (неоновый стиль) */
            .selector.focus, .menu__item.focus, .button.focus, 
            .head__action.focus, .server.focus { 
                background: linear-gradient(to right, #8a2387, #e94057, #f27121) !important; 
                color: #fff !important; 
                box-shadow: 0 0 20px rgba(233, 64, 87, 0.4) !important; 
                border: none !important;
                opacity: 1 !important;
            }

            /* Картки */
            .card.focus .card__view::after, .card.hover .card__view::after { 
                border: 2px solid #e94057 !important; 
                box-shadow: 0 0 20px rgba(242, 113, 33, 0.5) !important; 
            }

            /* Модальні вікна */
            .settings__content, .modal__content { 
                background: rgba(10, 10, 10, 0.98) !important; 
                border: 1px solid rgba(233, 64, 87, 0.2) !important; 
            }
        `;
        document.head.appendChild(style);
    }

    // Запуск теми при старті
    if (window.appready) {
        applyTheme();
    } else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type === 'ready') applyTheme();
        });
    }
})();
