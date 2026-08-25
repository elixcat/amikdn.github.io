(function () {
    'use strict';

    // Основний об'єкт плагіна
    var InterFaceMod = {
        name: 'interface_mod',
        version: '2.2.0',
        debug: false,
        settings: {
            enabled: true,
            buttons_mode: 'default',
            show_movie_type: true,
            theme: 'default',
            colored_ratings: true,
            seasons_info_mode: 'aired',
            show_episodes_on_main: false,
            label_position: 'top-right',
            show_buttons: true,
            colored_elements: true
        }
    };

    // Функція для додавання інформації про сезони та серії
    function addSeasonInfo() {
        Lampa.Listener.follow('full', function (data) {
            if (data.type === 'complite' && data.data.movie.number_of_seasons) {
                if (InterFaceMod.settings.seasons_info_mode === 'none') return;
                
                var movie = data.data.movie;
                var status = movie.status;
                var totalSeasons = movie.number_of_seasons || 0;
                var totalEpisodes = movie.number_of_episodes || 0;
                var airedSeasons = 0;
                var airedEpisodes = 0;
                var currentDate = new Date();
                
                if (movie.seasons) {
                    movie.seasons.forEach(function(season) {
                        if (season.season_number === 0) return;
                        var seasonAired = false;
                        var seasonEpisodes = 0;
                        if (season.air_date) {
                            var airDate = new Date(season.air_date);
                            if (airDate <= currentDate) {
                                seasonAired = true;
                                airedSeasons++;
                            }
                        }
                        if (season.episodes) {
                            season.episodes.forEach(function(episode) {
                                if (episode.air_date) {
                                    var epAirDate = new Date(episode.air_date);
                                    if (epAirDate <= currentDate) {
                                        seasonEpisodes++;
                                        airedEpisodes++;
                                    }
                                }
                            });
                        } else if (seasonAired && season.episode_count) {
                            seasonEpisodes = season.episode_count;
                            airedEpisodes += seasonEpisodes;
                        }
                    });
                } else if (movie.last_episode_to_air) {
                    airedSeasons = movie.last_episode_to_air.season_number || 0;
                    if (movie.season_air_dates) {
                        airedEpisodes = movie.season_air_dates.reduce(function(sum, season) { return sum + (season.episode_count || 0); }, 0);
                    } else if (movie.last_episode_to_air.episode_number) {
                        var lastSeason = movie.last_episode_to_air.season_number;
                        var lastEpisode = movie.last_episode_to_air.episode_number;
                        if (movie.seasons) {
                            airedEpisodes = 0;
                            movie.seasons.forEach(function(season) {
                                if (season.season_number === 0) return;
                                if (season.season_number < lastSeason) airedEpisodes += season.episode_count || 0;
                                else if (season.season_number === lastSeason) airedEpisodes += lastEpisode;
                            });
                        } else {
                            var prevSeasonsEpisodes = 0;
                            if (lastSeason > 1) prevSeasonsEpisodes = (lastSeason - 1) * 10;
                            airedEpisodes = prevSeasonsEpisodes + lastEpisode;
                        }
                    }
                }
                
                if (airedSeasons === 0) airedSeasons = totalSeasons;
                if (airedEpisodes === 0) airedEpisodes = totalEpisodes;
                
                if (movie.next_episode_to_air) {
                    var nextSeason = movie.next_episode_to_air.season_number;
                    var nextEpisode = movie.next_episode_to_air.episode_number;
                    if (totalEpisodes > 0) {
                        var remainingEpisodes = 0;
                        if (movie.seasons) {
                            movie.seasons.forEach(function(season) {
                                if (season.season_number === nextSeason) remainingEpisodes = (season.episode_count || 0) - nextEpisode + 1;
                                else if (season.season_number > nextSeason) remainingEpisodes += season.episode_count || 0;
                            });
                        }
                        if (remainingEpisodes > 0) {
                            var calculatedAired = totalEpisodes - remainingEpisodes;
                            if (calculatedAired >= 0 && calculatedAired <= totalEpisodes) airedEpisodes = calculatedAired;
                        }
                    }
                }
                
                if (totalEpisodes > 0 && airedEpisodes > totalEpisodes) airedEpisodes = totalEpisodes;
                
                function plural(number, one, two, five) {
                    let n = Math.abs(number);
                    n %= 100;
                    if (n >= 5 && n <= 20) return five;
                    n %= 10;
                    if (n === 1) return one;
                    if (n >= 2 && n <= 4) return two;
                    return five;
                }
                
                function getStatusText(status) {
                    if (status === 'Ended') return 'Завершений';
                    if (status === 'Canceled') return 'Скасований';
                    if (status === 'Returning Series') return 'Виходить';
                    if (status === 'In Production') return 'У виробництві';
                    return status || 'Невідомо';
                }
                
                var displaySeasons, displayEpisodes, seasonsText, episodesText;
                var isCompleted = (status === 'Ended' || status === 'Canceled');
                var bgColor = isCompleted ? 'rgba(33, 150, 243, 0.8)' : 'rgba(244, 67, 54, 0.8)';
                
                if (InterFaceMod.settings.seasons_info_mode === 'aired') {
                    displaySeasons = airedSeasons;
                    displayEpisodes = airedEpisodes;
                    seasonsText = plural(displaySeasons, 'сезон', 'сезони', 'сезонів');
                    episodesText = plural(displayEpisodes, 'серія', 'серії', 'серій');
                } else {
                    displaySeasons = totalSeasons;
                    displayEpisodes = totalEpisodes;
                    seasonsText = plural(displaySeasons, 'сезон', 'сезони', 'сезонів');
                    episodesText = plural(displayEpisodes, 'серія', 'серії', 'серій');
                }
                
                var infoElement = $('<div class="season-info-label"></div>');
                if (isCompleted) {
                    infoElement.append($('<div></div>').text(displaySeasons + ' ' + seasonsText + ' ' + displayEpisodes + ' ' + episodesText));
                    infoElement.append($('<div></div>').text(getStatusText(status)));
                } else {
                    var text = (InterFaceMod.settings.seasons_info_mode === 'aired' && totalEpisodes > 0 && airedEpisodes < totalEpisodes) 
                        ? (displaySeasons + ' ' + seasonsText + ' ' + airedEpisodes + ' ' + episodesText + ' з ' + totalEpisodes)
                        : (displaySeasons + ' ' + seasonsText + ' ' + displayEpisodes + ' ' + episodesText);
                    infoElement.append($('<div></div>').text(text));
                }
                
                var positionStyles = {
                    'top-right': { 'position': 'absolute', 'top': '1.4em', 'right': '-0.8em' },
                    'top-left': { 'position': 'absolute', 'top': '1.4em', 'left': '-0.8em' },
                    'bottom-right': { 'position': 'absolute', 'bottom': '1.4em', 'right': '-0.8em' },
                    'bottom-left': { 'position': 'absolute', 'bottom': '1.4em', 'left': '-0.8em' }
                };
                
                infoElement.css($.extend({
                    'background-color': bgColor, 'color': 'white', 'padding': '0.4em 0.6em', 'border-radius': '0.3em',
                    'font-size': '0.8em', 'z-index': '999', 'text-align': 'center', 'backdrop-filter': 'blur(2px)'
                }, positionStyles[InterFaceMod.settings.label_position] || positionStyles['top-right']));
                
                setTimeout(function() {
                    var poster = $(data.object.activity.render()).find('.full-start-new__poster');
                    if (poster.length) {
                        poster.css('position', 'relative');
                        poster.append(infoElement);
                    }
                }, 100);
            }
        });
    }

    // Функція для відображення всіх кнопок
    function showAllButtons() {
        var buttonStyle = document.createElement('style');
        buttonStyle.id = 'interface_mod_buttons_style';
        buttonStyle.innerHTML = `.full-start-new__buttons, .full-start__buttons { display: flex !important; flex-wrap: wrap !important; gap: 10px !important; }`;
        document.head.appendChild(buttonStyle);
        
        if (Lampa.FullCard) {
            var originFullCard = Lampa.FullCard.build;
            Lampa.FullCard.build = function(data) {
                var card = originFullCard(data);
                card.organizeButtons = function() {
                    var element = card.activity.render();
                    var targetContainer = element.find('.full-start-new__buttons, .full-start__buttons, .buttons-container');
                    if (!targetContainer.length) return;
                    
                    var allButtons = [];
                    ['.full-start__button', '.button'].forEach(sel => element.find(sel).each(function() { allButtons.push(this); }));
                    
                    var categories = { online: [], torrent: [], trailer: [], other: [] };
                    var added = {};
                    $(allButtons).each(function() {
                        var text = $(this).text().trim();
                        var cls = this.className;
                        if (!text || added[text]) return;
                        added[text] = true;
                        if (cls.includes('online')) categories.online.push(this);
                        else if (cls.includes('torrent')) categories.torrent.push(this);
                        else if (cls.includes('trailer')) categories.trailer.push(this);
                        else categories.other.push(this);
                    });
                    
                    targetContainer.children().detach();
                    ['online', 'torrent', 'trailer', 'other'].forEach(cat => categories[cat].forEach(btn => targetContainer.append(btn)));
                };
                card.onCreate = function() { if (InterFaceMod.settings.show_buttons) setTimeout(card.organizeButtons, 300); };
                return card;
            };
        }
    }

    // Функція для зміни лейблів типу контенту
    function changeMovieTypeLabels() {
        $('head').append(`<style id="movie_type_styles">.content-label { position: absolute !important; top: 1.4em !important; left: -0.8em !important; color: white !important; padding: 0.4em 0.4em !important; border-radius: 0.3em !important; font-size: 0.8em !important; z-index: 10 !important; } .serial-label { background-color: #3498db !important; } .movie-label { background-color: #2ecc71 !important; }</style>`);
        
        function addLabel(card) {
            if (!InterFaceMod.settings.show_movie_type || $(card).find('.content-label').length) return;
            var is_tv = $(card).hasClass('card--tv') || $(card).data('card_type') === 'tv' || $(card).find('.card__type').text().match(/(сезон|серія|ТВ|TV)/i);
            $(card).find('.card__view').append($('<div class="content-label ' + (is_tv ? 'serial-label' : 'movie-label') + '"></div>').text(is_tv ? 'Серіал' : 'Фільм'));
        }
        
        new MutationObserver(muts => muts.forEach(m => $(m.addedNodes).find('.card').addBack('.card').each(function() { addLabel(this); }))).observe(document.body, { childList: true, subtree: true });
        $('.card').each(function() { addLabel(this); });
    }

    // Функція тем
    function applyTheme(theme) {
        $('#interface_mod_theme').remove();
        if (theme === 'default') return;
        const themes = {
            neon: `body { background: linear-gradient(135deg, #0d0221 0%, #150734 50%, #1f0c47 100%); color: #fff; }`,
            dark_night: `body { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%); }`,
            blue_cosmos: `body { background: linear-gradient(135deg, #0b365c 0%, #144d80 50%, #0c2a4d 100%); }`,
            sunset: `body { background: linear-gradient(135deg, #2d1f3d 0%, #614385 50%, #516395 100%); }`,
            emerald: `body { background: linear-gradient(135deg, #1a2a3a 0%, #2C5364 50%, #203A43 100%); }`,
            aurora: `body { background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%); }`,
            bywolf_mod: `body { background: linear-gradient(135deg, #090227 0%, #170b34 50%, #261447 100%); }`
        };
        $('head').append(`<style id="interface_mod_theme">${themes[theme] || ''}</style>`);
    }

    // Кольорові рейтинги та статуси
    function updateVoteColors() {
        if (!InterFaceMod.settings.colored_ratings) return;
        $(".card__vote, .full-start__rate, .full-start-new__rate, .info__rate").each(function() {
            const v = parseFloat($(this).text());
            if (v <= 3) $(this).css('color', "red");
            else if (v < 6) $(this).css('color', "orange");
            else if (v < 8) $(this).css('color', "cornflowerblue");
            else $(this).css('color', "lawngreen");
        });
    }

    function colorizeElements() {
        if (!InterFaceMod.settings.colored_elements) return;
        $('.full-start__status').each(function() {
            var t = $(this).text();
            if (t.includes('Заверш') || t.includes('Ended')) $(this).css({'background-color': 'rgba(46, 204, 113, 0.8)', 'color': 'white'});
            else if (t.includes('Отмен') || t.includes('Canceled')) $(this).css({'background-color': 'rgba(231, 76, 60, 0.8)', 'color': 'white'});
        });
        $('.full-start__pg').each(function() {
            var t = $(this).text();
            if (t.includes('18+')) $(this).css({'background-color': '#e74c3c', 'color': 'white'});
        });
    }

    // Ініціалізація
    function startPlugin() {
        Lampa.SettingsApi.addComponent({ component: 'season_info', name: 'Інтерфейс мод', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>' });
        
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: { name: 'seasons_info_mode', type: 'select', values: { 'none': 'Вимкнути', 'aired': 'Актуальна', 'total': 'Повна' }, default: 'aired' },
            field: { name: 'Інформація про серії', description: 'Режим відображення' },
            onChange: v => { InterFaceMod.settings.seasons_info_mode = v; Lampa.Settings.update(); }
        });

        // Запуск
        applyTheme(Lampa.Storage.get('theme_select', 'default'));
        if (InterFaceMod.settings.enabled) addSeasonInfo();
        showAllButtons();
        changeMovieTypeLabels();
        setInterval(updateVoteColors, 2000);
        setInterval(colorizeElements, 2000);
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', e => { if (e.type === 'ready') startPlugin(); });
})();
