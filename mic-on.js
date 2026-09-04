(function () {
    'use strict';

    // Маніфест плагіна, щоб Lampa його прийняла
    if (window.Lampa && Lampa.Plugins) {
        Lampa.Plugins.add({
            name: 'Fix Mic Button',
            description: 'Повертає кнопку мікрофона в сенсорному режимі',
            version: '1.0.0',
            author: 'User',
            callback: function () {
                // Додаємо CSS, який скасовує приховування
                var style = document.createElement('style');
                style.textContent = `
                    .simple-keyboard-mic {
                        display: flex !important;
                        width: auto !important;
                        min-width: 40px !important;
                        opacity: 1 !important;
                        pointer-events: auto !important;
                        visibility: visible !important;
                        position: relative !important;
                    }
                    .simple-keyboard-mic svg {
                        display: block !important;
                        width: 24px !important;
                        height: 24px !important;
                        opacity: 1 !important;
                    }
                `;
                document.head.appendChild(style);
                
                console.log('Mic Fix enabled');
            }
        });
    }
})();
