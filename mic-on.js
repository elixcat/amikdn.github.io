(function () {
    'use strict';

    // Створюємо стилі, які скасовують приховування мікрофона
    var style = document.createElement('style');
    style.textContent = `
        .simple-keyboard-mic {
            display: flex !important;
            width: auto !important;
            min-width: 40px !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            visibility: visible !important;
        }
        .simple-keyboard-mic svg {
            display: block !important;
            width: 24px !important;
            height: 24px !important;
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(style);

    // Додатково: якщо Lampa видаляє кнопку з DOM, ми її повертаємо
    // (Але зазвичай вона просто прихована CSS, тому стилів вище має вистачити)
    console.log('Rezka Mic Fix loaded');
})();
