(function() {
    'use strict';

    // Реєстрація плагіна в системі Lampa
    Lampa.Manifest.plugins = Lampa.Manifest.plugins || [];
    Lampa.Manifest.plugins.push({
        name: 'Dark Night Theme',
        version: '1.1.0',
        description: 'Повна темна тема з неоновим підсвічуванням'
    });

    var style = document.createElement('style');
    style.id = 'dark-night-theme';
    style.type = 'text/css';
    style.textContent = `
        /* Основний фон додатка */
        body { 
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%) !important; 
            color: #ffffff !important; 
        }
        
        /* Універсальна підсвітка фокусу для всіх селекторів */
        .selector.focus, .menu__item.focus, .button.focus, 
        .head__action.focus, .head__action.hover { 
            background: linear-gradient(to right, #8a2387, #e94057, #f27121) !important; 
            color: #fff !important; 
            box-shadow: 0 0 20px rgba(233, 64, 87, 0.4) !important; 
            border: none !important;
            opacity: 1 !important;
        }

        /* Виправлення прозорості балансерів */
        .server.focus { 
            background: linear-gradient(to right, #8a2387, #e94057, #f27121) !important; 
            opacity: 1 !important;
            color: #fff !important;
        }
        
        /* Примусово робимо текст всередині балансера видимим */
        .server.focus * { 
            background: transparent !important; 
            color: #fff !important; 
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8) !important;
            opacity: 1 !important;
        }

        /* Анімація пульсації */
        .selector.focus { 
            animation: night-pulse 2s infinite !important; 
        }

        @keyframes night-pulse { 
            0% { box-shadow: 0 0 15px rgba(233, 64, 87, 0.4); } 
            50% { box-shadow: 0 0 25px rgba(242, 113, 33, 0.4); } 
            100% { box-shadow: 0 0 15px rgba(138, 35, 135, 0.4); } 
        }

        /* Картки */
        .card.focus .card__view::after, .card.hover .card__view::after { 
            border: 3px solid #e94057 !important; 
            box-shadow: 0 0 20px rgba(242, 113, 33, 0.6) !important; 
        }

        /* Модальні вікна та налаштування */
        .settings__content, .modal__content, .selectbox__content { 
            background: rgba(10, 10, 10, 0.98) !important; 
            border: 1px solid rgba(233, 64, 87, 0.2) !important; 
        }
    `;
    document.head.appendChild(style);

    // Додаємо функцію очищення при вимкненні плагіна
    Lampa.Listener.follow('plugin', function(e) {
        if (e.type === 'destroy' && e.name === 'Dark Night Theme') {
            var dnStyle = document.getElementById('dark-night-theme');
            if (dnStyle && dnStyle.parentNode) dnStyle.parentNode.removeChild(dnStyle);
        }
    });

})();
