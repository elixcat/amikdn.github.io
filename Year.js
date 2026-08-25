(function () {
    'use strict';

    // --- НАЛАШТУВАННЯ (ЗМІНЮЙ ТУТ) ---
    var SETTINGS = {
        font_size: '0.8em',      // Розмір року
        padding: '0.2em 0.5em',  // Відступи плашки
        bg_color: 'rgba(0, 0, 0, 0.8)', // Фон (rgba для прозорості)
        text_color: '#ffffff',   // Колір тексту
        border_radius: '0 0.9em 0.9em 0.9em' // Заокруглення
    };

    function addYearBadge(card) {
        if (!card || !card.querySelector) return;
        var view = card.querySelector('.card__view');
        var age = card.querySelector('.card__age'); // Зазвичай рік береться з цього елемента
        if (!view || !age) return;

        // Налаштовуємо стиль
        age.style.cssText = `
            position: absolute !important;
            line-height: 1 !important;
            box-sizing: border-box !important;
            user-select: none !important;
            top: 0 !important;
            left: 0 !important;
            bottom: auto !important;
            right: auto !important;
            margin: 0 !important;
            padding: ${SETTINGS.padding} !important;
            background: ${SETTINGS.bg_color} !important;
            color: ${SETTINGS.text_color} !important;
            font-size: ${SETTINGS.font_size} !important;
            border-radius: ${SETTINGS.border_radius} !important;
            z-index: 10 !important;
        `;
    }

    function initPlugin() {
        // Слухаємо додавання нових карток
        Lampa.Listener.follow('line', function(e) {
            if (e.type === 'append' || e.type === 'create') {
                setTimeout(function() {
                    $('.card').each(function() {
                        addYearBadge(this);
                    });
                }, 500);
            }
        });

        // Перший запуск
        $('.card').each(function() {
            addYearBadge(this);
        });
    }

    // Реєстрація плагіна
    Lampa.Manifest.plugins = Lampa.Manifest.plugins || [];
    Lampa.Manifest.plugins.push({
        name: 'Year Badge Only',
        version: '1.0.0',
        description: 'Показує рік випуску на постері'
    });

    if (window.appready) {
        initPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') initPlugin();
        });
    }
})();
