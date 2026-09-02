(function () {
    'use strict';

    var style = document.createElement('style');
    style.innerHTML = `
        .time-badge {
            background-color: #3498DB;
            color: white;
            padding: 2px 8px;
            border-radius: 6px;
            margin-right: 8px;
            font-weight: bold;
            display: inline-block;
            vertical-align: middle;
        }
    `;
    document.head.appendChild(style);

    function getScaleValues() {
        var vals = {};
        for (var i = 5; i <= 20; i++) {
            var val = (i / 10).toString();
            vals[val] = (i * 10) + "%";
        }
        return vals;
    }

    Lampa.SettingsApi.addParam({
        component: "interface",
        param: { name: "logo_glav", type: "select", values: { 1: "Приховати", 0: "Відображати" }, default: "0" },
        field: { name: "Логотипи замість назв", description: "Відображає логотипи фільмів замість тексту" }
    });

    Lampa.SettingsApi.addParam({
        component: "interface",
        param: { name: "logo_size", type: "select", values: { w300: "w300", w500: "w500", w780: "w780", original: "Оригінал" }, default: "w500" },
        field: { name: "Розмір логотипу", description: "Розмір зображення" }
    });

    Lampa.SettingsApi.addParam({
        component: "interface",
        param: { name: "logo_hide_year", type: "trigger", default: true },
        field: { name: "Приховувати рік та країну над логотипом", description: "Переносить рік випуску та країну під логотип" }
    });

    Lampa.SettingsApi.addParam({
        component: "interface",
        param: { name: "logo_info_scale", type: "select", values: getScaleValues(), default: "1" },
        field: { name: "Масштаб інформації (рік, жанри)", description: "Масштаб для всього, крім часу." }
    });

    Lampa.SettingsApi.addParam({
        component: "interface",
        param: { name: "logo_time_scale", type: "select", values: getScaleValues(), default: "1" },
        field: { name: "Масштаб часу перегляду", description: "Окремий масштаб тільки для часу." }
    });

    if (window.logoplugin) return;
    window.logoplugin = true;

    Lampa.Listener.follow('full', function (a) {
        if (a.type == 'complite' && "1" != Lampa.Storage.get("logo_glav")) {
            var movie = a.data.movie;
            var render = a.object.activity.render();
            var title = render.find(".full-start-new__title");
            var head = render.find(".full-start-new__head");
            var details = render.find(".full-start-new__details");

            if (movie.id == '') return;

            var infoScale = parseFloat(Lampa.Storage.get("logo_info_scale", "1"));
            var timeScale = parseFloat(Lampa.Storage.get("logo_time_scale", "1"));

            $.get(Lampa.TMDB.api + "/3/" + (movie.name ? 'tv' : 'movie') + "/" + movie.id +"/images?api_key=" + Lampa.TMDB.key() + "&include_image_language=" + Lampa.Storage.get("language") + ",en,null", function (response) {
                var logo_path = response.logos && response.logos.length > 0 ? (response.logos.find(l => l.iso_639_1 == Lampa.Storage.get("language")) || response.logos.find(l => l.iso_639_1 == 'en') || response.logos[0]).file_path : null;

                if (logo_path) {
                    title.html('<img style="margin-top:5px; max-height:125px;" src="' + Lampa.TMDB.image("/t/p/" + (Lampa.Storage.get("logo_size", "w500") === "original" ? "original" : Lampa.Storage.get("logo_size", "w500")) + logo_path.replace(".svg", ".png")) + '"/>');
                    render.find(".full-start-new__tagline").remove();

                    if (Lampa.Storage.get("logo_hide_year", true)) {
                        var head_html = head.html() || "";
                        var details_html = details.html() || "";
                        
                        // 1. Обробка часу (виносимо в окремий елемент)
                        var time_match = details_html.match(/(\d{1,2}:\d{2})/);
                        var time_html = time_match ? '<span class="time-badge" style="font-size:' + (timeScale * 100) + '%;">' + time_match[0] + '</span>' : '';
                        
                        // 2. Обробка жанрів (видаляємо час із загального тексту)
                        var genre_html = details_html.replace(/(\d{1,2}:\d{2})\s?●\s?/, '').replace(/(\d{1,2}:\d{2})/, '');
                        // Додаємо пробіли до символу ●
                        genre_html = genre_html.replace(/●/g, ' &nbsp; ● &nbsp; ');

                        // 3. Формуємо новий вміст через append (зберігаючи стилі Lampa)
                        details.html('<div style="font-size:' + (infoScale * 100) + '%;">' + time_html + genre_html + '</div>' + 
                                     '<div style="font-size:' + (infoScale * 100) + '%; margin-top:5px;">' + head_html + '</div>');
                        
                        head.remove();
                    }
                }
            });
        }
    });
})();
