(function() {
    'use strict';
    
    // Стилі застосовуються тільки до конкретних елементів, не ламаючи все інше
    var style = document.createElement('style');
    style.textContent = `
        /* Тільки кнопки балансерів */
        .server.focus { 
            background: linear-gradient(to right, #8a2387, #e94057, #f27121) !important; 
            color: #fff !important; 
        }
        /* Тільки для головного меню, якщо треба */
        .menu__item.focus {
            background: #8a2387 !important;
        }
    `;
    document.head.appendChild(style);
})();
