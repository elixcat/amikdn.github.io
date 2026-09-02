(function () {
    'use strict';

    // Додаємо CSS для плашки часу
    var style = document.createElement('style');
    style.innerHTML = `
        .time-badge {
            background-color: #3498DB;
            color: white;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: bold;
            display: inline-block;
            vertical-align: middle;
        }
    `;
    document.head.appendChild(style);

    // Функція для створення значень масштабу
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
        field: { name: "Розмір логотипу", description: "Розмір зображення логотипу" }
    });

    Lampa.SettingsApi.addParam({
        component: "interface",
        param: { name: "logo_hide_year", type: "trigger", default: true },
        field: { name: "Приховувати рік та країну над логотипом", description: "Переносить рік випуску та країну під логотип" }
    });

    Lampa.SettingsApi.addParam({
        component: "interface",
        param: { name: "logo_info_scale", type: "select", values: getScaleValues(), default: "1" },
        field: { name: "Масштаб інформації (рік, назва, жанр)", description: "Масштаб для всього, крім часу перегляду." }
    });

    Lampa.SettingsApi.addParam({
        component: "interface",
        param: { name: "logo_time_scale", type: "select", values: getScaleValues(), default: "1" },
        field: { name: "Масштаб часу перегляду", description: "Окремий масштаб тільки для часу перегляду." }
    });

    if (window.logoplugin) return;
    window.logoplugin = true;

    Lampa.Storage.listener.follow('change', function (e) {
        if (['logo_glav', 'logo_size', 'logo_hide_year', 'logo_info_scale', 'logo_time_scale'].includes(e.param)) {
            var activity = Lampa.Activity.active();
            if (activity && activity.component === 'full') {
                setTimeout(function () { activity.reload(); }, 300);
            }
        }
    });

    Lampa.Listener.follow('full', function (a) {
        if (a.type == 'complite' && "1" != Lampa.Storage.get("logo_glav")) {
            var movie = a.data.movie;
            var type = movie.name ? 'tv' : 'movie';
            var render = a.object.activity.render();
            var title = render.find(".full-start-new__title");
            var head = render.find(".full-start-new__head");
            var details = render.find(".full-start-new__details");
            var tagline = render.find(".full-start-new__tagline");

            if (movie.id == '') return;

            var lang = Lampa.Storage.get("language");
            var size = Lampa.Storage.get("logo_size", "w500");
            var infoScale = parseFloat(Lampa.Storage.get("logo_info_scale", "1"));
            var timeScale = parseFloat(Lampa.Storage.get("logo_time_scale", "1"));

            var TMDB_API = "http://apitmdb.cubnotrip.top/3";
            var url = TMDB_API + "/" + type + "/" + movie.id +"/images?api_key=" + Lampa.TMDB.key() +"&include_image_language=" + lang + ",en,null";

            $.get(url, function (response) {
                
                var logo_path = null;
                if (response.logos && response.logos.length > 0) {
                    for (var i = 0; i < response.logos.length; i++) { if (response.logos[i].iso_639_1 == lang) { logo_path = response.logos[i].file_path; break; } }
                    if (!logo_path) { for (var i = 0; i < response.logos.length; i++) { if (response.logos[i].iso_639_1 == 'en') { logo_path = response.logos[i].file_path; break; } } }
                    if (!logo_path) { logo_path = response.logos[0].file_path; }
                }

                if (logo_path) {
                    var logo_url = Lampa.TMDB.image("/t/p/" + (size === "original" ? "original" : size) + logo_path.replace(".svg", ".png"));
                    title.html('<img style="margin-top:5px; max-height:125px;" src="' + logo_url + '"/>');
                    tagline.remove();

                    if (Lampa.Storage.get("logo_hide_year", true)) {
                        if (head.length && details.length && details.find(".logo-moved-head").length === 0) {
                            var head_html = head.html().trim();
                            if (head_html) {
                                var raw_details = details.html();
                                var time_match = raw_details.match(/(\d{1,2}:\d{2})/);
                                var time_html = '';
                                
                                // Вирізаємо час із загального тексту
                                if (time_match) {
                                    time_html = '<span class="time-badge" style="font-size:' + (timeScale * 100) + '%;">' + time_match[0] + '</span>';
                                    raw_details = raw_details.replace(time_match[0], '');
                                }

                                // Масштабуємо решту контенту
                                var scalePercent = (infoScale * 100);
                                var moved_head = '<div class="logo-moved-head" style="margin-left:0.6em; display:block; width:100%; clear:both; margin-bottom:0.5em; font-size:' + scalePercent + '%;">' + head_html + '</div>';
                                
                                var scaled_details = raw_details.replace(/(<span|<div)/g, function(match) {
                                    return match + ' style="font-size:' + scalePercent + '%;"';
                                });
                                
                                details.html(moved_head + time_html + scaled_details);
                                head.remove();
                            }
                        }
                    }
                }
            });
        }
    });
})();
