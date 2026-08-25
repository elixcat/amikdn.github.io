(function () {
    'use strict';

    var InterFaceMod = {
        name: 'interface_mod',
        version: '2.2.0',
        settings: { theme: Lampa.Storage.get('theme_select', 'default') }
    };

    // --- 1. ТЕМИ ТА СТИЛІ ---
    function applyTheme() {
        $('#interface_mod_theme').remove();
        var theme = InterFaceMod.settings.theme;
        if (theme === 'default') return;

        var style = $('<style id="interface_mod_theme"></style>');
        var themes = {
            dark_night: `
                body { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%) !important; color: #ffffff !important; }
                .selector.focus, .menu__item.focus, .button.focus, .server.focus, .head__action.focus { 
                    background: linear-gradient(to right, #8a2387, #e94057, #f27121) !important; 
                    color: #fff !important; 
                    box-shadow: 0 0 20px rgba(233, 64, 87, 0.4) !important; 
                    border: none !important;
                }
                .card.focus .card__view::after { border: 2px solid #e94057 !important; box-shadow: 0 0 20px rgba(242, 113, 33, 0.5) !important; }
            `
        };
        style.html(themes[theme] || '');
        $('head').append(style);
    }

    // --- 2. ЛЕЙБЛИ ФІЛЬМ/СЕРІАЛ ---
    function addTypeLabels() {
        var style = $('<style id="movie_type_styles"></style>').html(`
            .content-label {
                position: absolute !important; top: 0 !important; left: 0 !important;
                background-color: #2ecc71 !important; color: white !important;
                padding: 0.2em 0.5em !important; border-radius: 0 0.9em 0.9em 0.9em !important;
                font-size: 0.75em !important; z-index: 10 !important;
            }
        `);
        $('head').append(style);

        $('.card').each(function() {
            var card = $(this);
            if (card.find('.content-label').length) return;
            var is_tv = card.hasClass('card--tv') || card.data('card_type') === 'tv';
            if (!is_tv) {
                card.find('.card__view').append('<div class="content-label">Фільм</div>');
            }
        });
    }

    // --- 3. КНОПКИ ПЕРЕЗАВАНТАЖЕННЯ/ВИХІД ---
    function showAllButtons() {
        var container = $('#app > div.head > div > div.head__actions');
        if (container.length > 0 && $('#RELOAD').length === 0) {
            container.append('<div id="RELOAD" class="head__action selector" tabindex="0">🔄</div>');
            container.append('<div id="EXIT" class="head__action selector" tabindex="0">❌</div>');

            $('#RELOAD').on('hover:enter hover:click hover:touch', function() {
                if (window.Lampa.App && typeof window.Lampa.App.reload === 'function') window.Lampa.App.reload();
                else location.reload();
            });

            $('#EXIT').on('hover:enter hover:click hover:touch', function() {
                if (Lampa.Platform.is('android')) Lampa.Android.exit();
                else Lampa.Activity.out();
            });
        }
    }

    // --- СТАРТ ---
    function startPlugin() {
        applyTheme();
        addTypeLabels();
        showAllButtons();

        // Спостерігач за новими картками
        var observer = new MutationObserver(addTypeLabels);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });

    Lampa.Manifest.plugins.push({
        name: 'Interface MOD',
        version: '2.2.0',
        description: 'Чиста тема та кнопки'
    });
})();
