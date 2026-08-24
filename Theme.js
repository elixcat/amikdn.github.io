(function() {
    'use strict';

    // Реєстрація плагіна
    Lampa.Manifest.plugins = Lampa.Manifest.plugins || [];
    Lampa.Manifest.plugins.push({
        name: 'Dark Night Theme',
        version: '1.0.0',
        description: 'Повна темна тема з неоновим підсвічуванням'
    });

    var style = document.createElement('style');
    style.textContent = `
        /* Основний фон */
        body { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%) !important; color: #ffffff !important; }
        
        /* Активні елементи (фокус) */
        .menu__item.focus, .menu__item.traverse, .menu__item.hover, 
        .settings-folder.focus, .settings-param.focus, 
        .selectbox-item.focus, .full-start__button.focus, 
        .full-descr__tag.focus, .player-panel .button.focus,
        .server.focus, .server.hover, .simple-button.focus, .button.focus,
        .head__action.focus, .head__action.hover { 
            background: linear-gradient(to right, #8a2387, #e94057, #f27121) !important; 
            color: #fff !important; 
            box-shadow: 0 0 30px rgba(233, 64, 87, 0.3) !important; 
            animation: night-pulse 2s infinite !important; 
            border: none !important;
        }

        /* Анімація пульсації */
        @keyframes night-pulse { 
            0% { box-shadow: 0 0 20px rgba(233, 64, 87, 0.3); } 
            50% { box-shadow: 0 0 30px rgba(242, 113, 33, 0.3); } 
            100% { box-shadow: 0 0 20px rgba(138, 35, 135, 0.3); } 
        }

        /* Картки фільмів */
        .card.focus .card__view::after, .card.hover .card__view::after { 
            border: 2px solid #e94057 !important; 
            box-shadow: 0 0 30px rgba(242, 113, 33, 0.5) !important; 
        }

        /* Налаштування модальних вікон */
        .settings__content, .settings-input__content, .selectbox__content, .modal__content { 
            background: rgba(10, 10, 10, 0.95) !important; 
            border: 1px solid rgba(233, 64, 87, 0.1) !important; 
            box-shadow: 0 0 30px rgba(242, 113, 33, 0.1) !important; 
        }

        /* Покращення тексту в серверах */
        .server.focus .server__name, .server.focus .server__quality {
            color: #ffffff !important;
            text-shadow: 0 0 5px rgba(0,0,0,0.5) !important;
        }
    `;
    document.head.appendChild(style);
})();
