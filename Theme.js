(function () {
    'use strict';

    // Основний об'єкт плагіна
    var InterFaceMod = {
        // Назва плагіна
        name: 'interface_mod',
        // Версія плагіна
        version: '2.2.0',
        // Увімкнути відладку
        debug: false,
        // Налаштування за замовчуванням
        settings: {
            enabled: true,
            buttons_mode: 'default', // 'default', 'main_buttons', 'all_buttons'
            show_movie_type: true,
            theme: 'default',
            colored_ratings: true,
            seasons_info_mode: 'aired',
            show_episodes_on_main: false,
            label_position: 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
            show_buttons: true,
            colored_elements: true // Об'єднане налаштування для статусів та вікових обмежень
        }
    };



    // Функція для відображення всіх кнопок у картці
    function showAllButtons() {
        // Додаємо стилі для кнопок за допомогою CSS
        var buttonStyle = document.createElement('style');
        buttonStyle.id = 'interface_mod_buttons_style';
        buttonStyle.innerHTML = `
            .full-start-new__buttons, .full-start__buttons {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 10px !important;
            }
        `;
        document.head.appendChild(buttonStyle);
        
        // Використовуємо Lampa.FullCard для розширення функціональності карток
        var originFullCard;
        
        // Перевіряємо, чи існує об'єкт Lampa.FullCard
        if (Lampa.FullCard) {
            // Зберігаємо оригінальний метод build
            originFullCard = Lampa.FullCard.build;
            
            // Перевизначаємо метод build для модифікації кнопок
            Lampa.FullCard.build = function(data) {
                // Викликаємо оригінальний метод build
                var card = originFullCard(data);
                
                // Додаємо функцію організації кнопок у картку
                card.organizeButtons = function() {
                    // Знаходимо активність картки
                    var activity = card.activity;
                    if (!activity) return;
                    
                    // Отримуємо елемент активності
                    var element = activity.render();
                    if (!element) return;
                    
                    // Знаходимо контейнери для кнопок (підтримка різних версій Lampa)
                    var targetContainer = element.find('.full-start-new__buttons');
                    if (!targetContainer.length) {
                        targetContainer = element.find('.full-start__buttons');
                    }
                    if (!targetContainer.length) {
                        // Розширений пошук контейнерів кнопок
                        targetContainer = element.find('.buttons-container');
                    }
                    if (!targetContainer.length) return;
                    
                    console.log('InterfaceMod: Знайдено контейнер для кнопок', targetContainer);
                    
                    // Знаходимо всі кнопки з різних контейнерів
                    var allButtons = [];
                    
                    // Пошук кнопок у різних контейнерах (підтримка різних версій Lampa)
                    var buttonSelectors = [
                        '.buttons--container .full-start__button',
                        '.full-start-new__buttons .full-start__button', 
                        '.full-start__buttons .full-start__button',
                        '.buttons-container .button',
                        '.full-start-new__buttons .button',
                        '.full-start__buttons .button'
                    ];
                    
                    buttonSelectors.forEach(function(selector) {
                        element.find(selector).each(function() {
                            allButtons.push(this);
                        });
                    });
                    
                    if (allButtons.length === 0) {
                        console.log('InterfaceMod: Не знайдено кнопок для організації');
                        return;
                    }
                    
                    console.log('InterfaceMod: Знайдено кнопок:', allButtons.length);
                    
                    // Категорії кнопок
                    var categories = {
                        online: [],
                        torrent: [],
                        trailer: [],
                        other: []
                    };
                    
                    // Відстежуємо додані кнопки за текстом
                    var addedButtonTexts = {};
                    
                    // Сортуємо кнопки за категоріями
                    $(allButtons).each(function() {
                        var button = this;
                        var buttonText = $(button).text().trim();
                        var className = button.className || '';
                        
                        // Пропускаємо дублікати
                        if (!buttonText || addedButtonTexts[buttonText]) return;
                        addedButtonTexts[buttonText] = true;
                        
                        // Визначаємо категорію кнопки
                        if (className.includes('online')) {
                            categories.online.push(button);
                        } else if (className.includes('torrent')) {
                            categories.torrent.push(button);
                        } else if (className.includes('trailer')) {
                            categories.trailer.push(button);
                        } else {
                            categories.other.push(button);
                        }
                        
                        console.log('InterfaceMod: Оброблена кнопка:', buttonText, className);
                    });
                    
                    // Порядок кнопок
                    var buttonSortOrder = ['online', 'torrent', 'trailer', 'other'];
                    
                    // Тимчасово вимикаємо оновлення контролера
                    var needToggle = Lampa.Controller.enabled().name === 'full_start';
                    if (needToggle) Lampa.Controller.toggle('settings_component');
                    
                    // Зберігаємо оригінальні елементи з подіями
                    var originalElements = targetContainer.children().detach();
                    
                    // Застосовуємо стилі для контейнера
                    targetContainer.css({
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '10px'
                    });
                    
                    // Додаємо кнопки в порядку категорій
                    buttonSortOrder.forEach(function(category) {
                        categories[category].forEach(function(button) {
                            targetContainer.append(button);
                        });
                    });
                    
                    // Вмикаємо назад контролер
                    if (needToggle) {
                        setTimeout(function() {
                            Lampa.Controller.toggle('full_start');
                        }, 100);
                    }
                };
                
                // Викликаємо організацію кнопок при готовності картки
                card.onCreate = function() {
                    // Перевіряємо, чи увімкнена опція показу кнопок
                    if (InterFaceMod.settings.show_buttons) {
                        setTimeout(function() {
                            card.organizeButtons();
                        }, 300); // Збільшуємо таймаут для кращої сумісності
                    }
                };
                
                return card;
            };
        }
        
        // Для сумісності, також перехоплюємо подію створення картки
        Lampa.Listener.follow('full', function(e) {
            if (e.type === 'complite' && e.object && e.object.activity) {
                // Перевіряємо, чи увімкнена опція показу кнопок
                if (InterFaceMod.settings.show_buttons && !Lampa.FullCard) {
                    setTimeout(function() {
                        var fullContainer = e.object.activity.render();
                        var targetContainer = fullContainer.find('.full-start-new__buttons');
                        if (!targetContainer.length) {
                            targetContainer = fullContainer.find('.full-start__buttons');
                        }
                        if (!targetContainer.length) {
                            targetContainer = fullContainer.find('.buttons-container');
                        }
                        if (!targetContainer.length) return;
                        
                        console.log('InterfaceMod: Знайдено контейнер для кнопок (listener)', targetContainer);
                        
                        // Застосовуємо стилі для контейнера
                        targetContainer.css({
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px'
                        });
                        
                        // Решта коду аналогічна до того, що був вище
                        var allButtons = [];
                        
                        // Розширений пошук кнопок
                        var buttonSelectors = [
                            '.buttons--container .full-start__button',
                            '.full-start-new__buttons .full-start__button', 
                            '.full-start__buttons .full-start__button',
                            '.buttons-container .button',
                            '.full-start-new__buttons .button',
                            '.full-start__buttons .button'
                        ];
                        
                        buttonSelectors.forEach(function(selector) {
                            fullContainer.find(selector).each(function() {
                                allButtons.push(this);
                            });
                        });
                        
                        if (allButtons.length === 0) {
                            console.log('InterfaceMod: Не знайдено кнопок для організації (listener)');
                            return;
                        }
                        
                        console.log('InterfaceMod: Знайдено кнопок (listener):', allButtons.length);
                        
                        var categories = {
                            online: [],
                            torrent: [],
                            trailer: [],
                            other: []
                        };
                        
                        var addedButtonTexts = {};
                        
                        $(allButtons).each(function() {
                            var button = this;
                            var buttonText = $(button).text().trim();
                            var className = button.className || '';
                            
                            if (!buttonText || addedButtonTexts[buttonText]) return;
                            addedButtonTexts[buttonText] = true;
                            
                            if (className.includes('online')) {
                                categories.online.push(button);
                            } else if (className.includes('torrent')) {
                                categories.torrent.push(button);
                            } else if (className.includes('trailer')) {
                                categories.trailer.push(button);
                            } else {
                                categories.other.push(button);
                            }
                        });
                        
                        var buttonSortOrder = ['online', 'torrent', 'trailer', 'other'];
                        
                        var needToggle = Lampa.Controller.enabled().name === 'full_start';
                        if (needToggle) Lampa.Controller.toggle('settings_component');
                        
                        var originalElements = targetContainer.children().detach();
                        
                        buttonSortOrder.forEach(function(category) {
                            categories[category].forEach(function(button) {
                                targetContainer.append(button);
                            });
                        });
                        
                        if (needToggle) {
                            setTimeout(function() {
                                Lampa.Controller.toggle('full_start');
                            }, 100);
                        }
                    }, 300); // Збільшуємо таймаут
                }
            }
        });
        
        // Додаємо MutationObserver для відстеження динамічно доданих кнопок
        var buttonObserver = new MutationObserver(function(mutations) {
            if (!InterFaceMod.settings.show_buttons) return;
            
            let needReorganize = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && 
                    (mutation.target.classList.contains('full-start-new__buttons') || 
                     mutation.target.classList.contains('full-start__buttons') ||
                     mutation.target.classList.contains('buttons-container'))) {
                    needReorganize = true;
                }
            });
            
            if (needReorganize) {
                setTimeout(function() {
                    if (Lampa.FullCard && Lampa.Activity.active() && Lampa.Activity.active().activity.card) {
                        if (typeof Lampa.Activity.active().activity.card.organizeButtons === 'function') {
                            Lampa.Activity.active().activity.card.organizeButtons();
                        }
                    }
                }, 100);
            }
        });
        
        buttonObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Функція для зміни лейблів TV та додавання лейбла ФІЛЬМ
    function changeMovieTypeLabels() {
        // Додаємо CSS стилі для зміни лейблів
        var styleTag = $('<style id="movie_type_styles"></style>').html(`
            /* Базовий стиль для всіх лейблів */
            .content-label {
                position: absolute !important;
                top: 1.4em !important;
                left: -0.8em !important;
                color: white !important;
                padding: 0.4em 0.4em !important;
                border-radius: 0.3em !important;
                font-size: 0.8em !important;
                z-index: 10 !important;
            }
            
            /* Серіал - синій */
            .serial-label {
                background-color: #3498db !important;
            }
            
            /* Фільм - зелений */
            .movie-label {
                background-color: #2ecc71 !important;
            }
            
            /* Приховуємо вбудований лейбл TV тільки при увімкненій функції */
            body[data-movie-labels="on"] .card--tv .card__type {
                display: none !important;
            }
        `);
        $('head').append(styleTag);
        
        // Встановлюємо атрибут для body, щоб CSS міг визначити, увімкнена функція чи ні
        if (InterFaceMod.settings.show_movie_type) {
            $('body').attr('data-movie-labels', 'on');
        } else {
            $('body').attr('data-movie-labels', 'off');
        }
        
        // Функція для додавання лейбла до картки
        function addLabelToCard(card) {
            if (!InterFaceMod.settings.show_movie_type) return;
            
            // Якщо вже є наш лейбл, пропускаємо
            if ($(card).find('.content-label').length) return;
            
            var view = $(card).find('.card__view');
            if (!view.length) return;
            
            // Розширене визначення типу контенту на основі метаданих
            var is_tv = false;
            var metadata = {};
            var movie_data = null;
            
            // Спробуємо отримати всі можливі метадані
            try {
                // 1. Перевіряємо вбудовані дані картки
                var cardData = $(card).attr('data-card');
                if (cardData) {
                    try {
                        metadata = JSON.parse(cardData);
                        console.log('Метадані з data-card:', metadata);
                    } catch (e) {
                        console.error('Помилка парсингу data-card:', e);
                    }
                }
                
                // 2. Перевіряємо прив'язані дані jQuery
                var jqData = $(card).data();
                if (jqData && Object.keys(jqData).length > 0) {
                    metadata = { ...metadata, ...jqData };
                    console.log('Метадані з jQuery data():', jqData);
                }
                
                // 3. Перевірка доступу до даних через API Lampa
                if (Lampa.Card && $(card).attr('id')) {
                    var cardId = $(card).attr('id');
                    var cardObj = Lampa.Card.get(cardId);
                    if (cardObj) {
                        metadata = { ...metadata, ...cardObj };
                        console.log('Метадані з Lampa.Card:', cardObj);
                    }
                }
                
                // 4. Намагаємося отримати дані з Lampa.Storage.cache
                if (Lampa.Storage && Lampa.Storage.cache) {
                    var itemId = $(card).data('id') || $(card).attr('data-id') || (metadata ? metadata.id : null);
                    if (itemId && Lampa.Storage.cache('card_' + itemId)) {
                        var cachedData = Lampa.Storage.cache('card_' + itemId);
                        if (cachedData) {
                            metadata = { ...metadata, ...cachedData };
                            console.log('Метадані з Lampa.Storage.cache:', cachedData);
                        }
                    }
                }
                
                // Компіляція всіх метаданих
                movie_data = metadata;
                
                // Відладка зібраних метаданих
                if (InterFaceMod.debug) {
                    console.log('Зібрані метадані для картки:', movie_data);
                }
            } catch (e) {
                console.error('Помилка при отриманні метаданих:', e);
            }
            
            // Логіка визначення типу контенту за метаданими
            if (movie_data) {
                // Пріоритет 1: Пряма вказівка типу
                if (movie_data.type === 'tv' || movie_data.type === 'serial' || 
                    movie_data.card_type === 'tv' || movie_data.card_type === 'serial') {
                    is_tv = true;
                }
                // Пріоритет 2: Наявність інформації про сезони
                else if (movie_data.seasons || movie_data.number_of_seasons > 0 || 
                        movie_data.season_count > 0 || movie_data.seasons_count > 0) {
                    is_tv = true;
                }
                // Пріоритет 3: Наявність списку епізодів
                else if (movie_data.episodes || movie_data.number_of_episodes > 0 || 
                        movie_data.episodes_count > 0) {
                    is_tv = true;
                } 
                // Пріоритет 4: Наявність відмітки про серіал
                else if (movie_data.isSeries === true || movie_data.is_series === true || 
                        movie_data.isSerial === true || movie_data.is_serial === true) {
                    is_tv = true;
                }
            }
            
            // Якщо через метадані не визначили, використовуємо класи та структуру DOM
            if (!is_tv) {
                // Перевірка за класом картки
                if ($(card).hasClass('card--tv')) {
                    is_tv = true;
                } else if ($(card).data('card_type') === 'tv' || $(card).data('type') === 'tv') {
                    is_tv = true;
                } else {
                    // Перевірка за елементами всередині картки
                    var hasSeasonInfo = $(card).find('.card__type, .card__temp').text().match(/(сезон|серія|серії|епізод|ТВ|TV)/i);
                    if (hasSeasonInfo) {
                        is_tv = true;
                    }
                }
            }
            
            // Створюємо та додаємо лейбл
            var label = $('<div class="content-label"></div>');
            
            // Визначаємо тип контенту
            if (is_tv) {
                // Для серіалів
                label.addClass('serial-label');
                label.text('Серіал');
                label.data('type', 'serial');
            } else {
                // Для фільмів
                label.addClass('movie-label');
                label.text('Фільм');
                label.data('type', 'movie');
            }
            
            // Додаємо лейбл
            view.append(label);
            
            // Відладка
            if (InterFaceMod.debug) {
                console.log('Додано лейбл: ' + (is_tv ? 'Серіал' : 'Фільм'), card);
            }
        }
        
        // Оновлення лейбла при зміні даних картки
        function updateCardLabel(card) {
            if (!InterFaceMod.settings.show_movie_type) return;
            
            // Видаляємо старий лейбл, якщо він існує
            $(card).find('.content-label').remove();
            
            // Додаємо новий лейбл з оновленими даними
            addLabelToCard(card);
        }
        
        // Обробка всіх карток
        function processAllCards() {
            if (!InterFaceMod.settings.show_movie_type) return;
            
            // Знаходимо всі картки на сторінці
            $('.card').each(function() {
                addLabelToCard(this);
            });
        }
        
        // Додатковий слухач для карток у детальному представленні
        Lampa.Listener.follow('full', function(data) {
            if (data.type === 'complite' && data.data.movie) {
                // Додаткова логіка для визначення типу контенту в повному представленні
                var movie = data.data.movie;
                var posterContainer = $(data.object.activity.render()).find('.full-start__poster');
                
                if (posterContainer.length && movie) {
                    var is_tv = false;
                    
                    // Визначаємо тип контенту за даними
                    if (movie.number_of_seasons > 0 || movie.seasons || movie.season_count > 0) {
                        is_tv = true;
                    } else if (movie.type === 'tv' || movie.card_type === 'tv') {
                        is_tv = true;
                    }
                    
                    // Перевіряємо, чи потрібно додати лейбл у повне представлення
                    if (InterFaceMod.settings.show_movie_type) {
                        var existingLabel = posterContainer.find('.content-label');
                        if (existingLabel.length) {
                            existingLabel.remove();
                        }
                        
                        var label = $('<div class="content-label"></div>').css({
                            'position': 'absolute',
                            'top': '1.4em',
                            'left': '-0.8em',
                            'color': 'white',
                            'padding': '0.4em 0.4em',
                            'border-radius': '0.3em',
                            'font-size': '0.8em',
                            'z-index': '10'
                        });
                        
                        if (is_tv) {
                            label.addClass('serial-label');
                            label.text('Серіал');
                            label.css('background-color', '#3498db');
                        } else {
                            label.addClass('movie-label');
                            label.text('Фільм');
                            label.css('background-color', '#2ecc71');
                        }
                        
                        posterContainer.css('position', 'relative');
                        posterContainer.append(label);
                    }
                }
            }
        });
        
        // Використовуємо MutationObserver для відстеження нових карток та змін у них
        var observer = new MutationObserver(function(mutations) {
            var needCheck = false;
            var cardsToUpdate = new Set();
            
            mutations.forEach(function(mutation) {
                // Перевіряємо додані вузли
                if (mutation.addedNodes && mutation.addedNodes.length) {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        var node = mutation.addedNodes[i];
                        // Якщо додано елемент картки або елемент, що містить картки
                        if ($(node).hasClass('card')) {
                            cardsToUpdate.add(node);
                            needCheck = true;
                        } else if ($(node).find('.card').length) {
                            $(node).find('.card').each(function() {
                                cardsToUpdate.add(this);
                            });
                            needCheck = true;
                        }
                    }
                }
                
                // Перевіряємо зміну атрибутів існуючих карток
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'class' || 
                     mutation.attributeName === 'data-card' || 
                     mutation.attributeName === 'data-type')) {
                    var targetNode = mutation.target;
                    if ($(targetNode).hasClass('card')) {
                        cardsToUpdate.add(targetNode);
                        needCheck = true;
                    }
                }
            });
            
            if (needCheck) {
                setTimeout(function() {
                    // Оновлюємо лише змінені картки
                    cardsToUpdate.forEach(function(card) {
                        updateCardLabel(card);
                    });
                }, 100);
            }
        });
        
        // Запускаємо спостерігач з розширеними параметрами
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-card', 'data-type']
        });
        
        // Запускаємо первинну перевірку
        processAllCards();
        
        // Періодична перевірка для карток, які могли бути пропущені
        setInterval(processAllCards, 2000);
        
        // Стежимо за зміною налаштування
        Lampa.Settings.listener.follow('change', function(e) {
            if (e.name === 'season_info_show_movie_type') {
                if (e.value) {
                    // Якщо увімкнено, додаємо стилі та лейбли
                    if (!$('style[data-id="movie-type-styles"]').length) {
                        styleTag.attr('data-id', 'movie-type-styles');
                        $('head').append(styleTag);
                    }
                    $('body').attr('data-movie-labels', 'on');
                    processAllCards();
                } else {
                    // Якщо вимкнено, видаляємо стилі та лейбли
                    $('body').attr('data-movie-labels', 'off');
                    $('.content-label').remove();
                }
            }
        });
    }

    // Функція для застосування тем
    function applyTheme(theme) {
        // Видаляємо попередні стилі теми
        $('#interface_mod_theme').remove();

        // Якщо обрано "Ні", просто видаляємо стилі
        if (theme === 'default') return;

        // Створюємо новий стиль
        const style = $('<style id="interface_mod_theme"></style>');

        // Визначаємо стилі для різних тем
        const themes = {
            neon: `
                body {
                    background: linear-gradient(135deg, #0d0221 0%, #150734 50%, #1f0c47 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #ff00ff, #00ffff);
                    color: #fff;
                    box-shadow: 0 0 20px rgba(255, 0, 255, 0.4);
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                    border: none;
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #ff00ff;
                    box-shadow: 0 0 20px #00ffff;
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #ff00ff, #00ffff);
                    box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
                }
                .full-start__background {
                    opacity: 0.7;
                    filter: brightness(1.2) saturate(1.3);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(15, 2, 33, 0.95);
                    border: 1px solid rgba(255, 0, 255, 0.1);
                }
            `,
            dark_night: `
                body {
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #8a2387, #e94057, #f27121);
                    color: #fff;
                    box-shadow: 0 0 30px rgba(233, 64, 87, 0.3);
                    animation: night-pulse 2s infinite;
                }
                @keyframes night-pulse {
                    0% { box-shadow: 0 0 20px rgba(233, 64, 87, 0.3); }
                    50% { box-shadow: 0 0 30px rgba(242, 113, 33, 0.3); }
                    100% { box-shadow: 0 0 20px rgba(138, 35, 135, 0.3); }
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #e94057;
                    box-shadow: 0 0 30px rgba(242, 113, 33, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #8a2387, #f27121);
                    animation: night-pulse 2s infinite;
                }
                .full-start__background {
                    opacity: 0.8;
                    filter: saturate(1.3) contrast(1.1);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(10, 10, 10, 0.95);
                    border: 1px solid rgba(233, 64, 87, 0.1);
                    box-shadow: 0 0 30px rgba(242, 113, 33, 0.1);
                }
            `,
            blue_cosmos: `
                body {
                    background: linear-gradient(135deg, #0b365c 0%, #144d80 50%, #0c2a4d 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #12c2e9, #c471ed, #f64f59);
                    color: #fff;
                    box-shadow: 0 0 30px rgba(18, 194, 233, 0.3);
                    animation: cosmos-pulse 2s infinite;
                }
                @keyframes cosmos-pulse {
                    0% { box-shadow: 0 0 20px rgba(18, 194, 233, 0.3); }
                    50% { box-shadow: 0 0 30px rgba(196, 113, 237, 0.3); }
                    100% { box-shadow: 0 0 20px rgba(246, 79, 89, 0.3); }
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #12c2e9;
                    box-shadow: 0 0 30px rgba(196, 113, 237, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #12c2e9, #f64f59);
                    animation: cosmos-pulse 2s infinite;
                }
                .full-start__background {
                    opacity: 0.8;
                    filter: saturate(1.3) contrast(1.1);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(11, 54, 92, 0.95);
                    border: 1px solid rgba(18, 194, 233, 0.1);
                    box-shadow: 0 0 30px rgba(196, 113, 237, 0.1);
                }
            `,
            sunset: `
                body {
                    background: linear-gradient(135deg, #2d1f3d 0%, #614385 50%, #516395 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #ff6e7f, #bfe9ff);
                    color: #2d1f3d;
                    box-shadow: 0 0 15px rgba(255, 110, 127, 0.3);
                    font-weight: bold;
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #ff6e7f;
                    box-shadow: 0 0 15px rgba(255, 110, 127, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #ff6e7f, #bfe9ff);
                    color: #2d1f3d;
                }
                .full-start__background {
                    opacity: 0.8;
                    filter: saturate(1.2) contrast(1.1);
                }
            `,
            emerald: `
                body {
                    background: linear-gradient(135deg, #1a2a3a 0%, #2C5364 50%, #203A43 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #43cea2, #185a9d);
                    color: #fff;
                    box-shadow: 0 4px 15px rgba(67, 206, 162, 0.3);
                    border-radius: 5px;
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 3px solid #43cea2;
                    box-shadow: 0 0 20px rgba(67, 206, 162, 0.4);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #43cea2, #185a9d);
                }
                .full-start__background {
                    opacity: 0.85;
                    filter: brightness(1.1) saturate(1.2);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(26, 42, 58, 0.98);
                    border: 1px solid rgba(67, 206, 162, 0.1);
                }
            `,
            aurora: `
                body {
                    background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #aa4b6b, #6b6b83, #3b8d99);
                    color: #fff;
                    box-shadow: 0 0 20px rgba(170, 75, 107, 0.3);
                    transform: scale(1.02);
                    transition: all 0.3s ease;
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #aa4b6b;
                    box-shadow: 0 0 25px rgba(170, 75, 107, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #aa4b6b, #3b8d99);
                    transform: scale(1.05);
                }
                .full-start__background {
                    opacity: 0.75;
                    filter: contrast(1.1) brightness(1.1);
                }
            `,
            bywolf_mod: `
                body {
                    background: linear-gradient(135deg, #090227 0%, #170b34 50%, #261447 100%);
                    color: #ffffff;
                }
                .menu__item.focus,
                .menu__item.traverse,
                .menu__item.hover,
                .settings-folder.focus,
                .settings-param.focus,
                .selectbox-item.focus,
                .full-start__button.focus,
                .full-descr__tag.focus,
                .player-panel .button.focus {
                    background: linear-gradient(to right, #fc00ff, #00dbde);
                    color: #fff;
                    box-shadow: 0 0 30px rgba(252, 0, 255, 0.3);
                    animation: cosmic-pulse 2s infinite;
                }
                @keyframes cosmic-pulse {
                    0% { box-shadow: 0 0 20px rgba(252, 0, 255, 0.3); }
                    50% { box-shadow: 0 0 30px rgba(0, 219, 222, 0.3); }
                    100% { box-shadow: 0 0 20px rgba(252, 0, 255, 0.3); }
                }
                .card.focus .card__view::after,
                .card.hover .card__view::after {
                    border: 2px solid #fc00ff;
                    box-shadow: 0 0 30px rgba(0, 219, 222, 0.5);
                }
                .head__action.focus,
                .head__action.hover {
                    background: linear-gradient(45deg, #fc00ff, #00dbde);
                    animation: cosmic-pulse 2s infinite;
                }
                .full-start__background {
                    opacity: 0.8;
                    filter: saturate(1.3) contrast(1.1);
                }
                .settings__content,
                .settings-input__content,
                .selectbox__content,
                .modal__content {
                    background: rgba(9, 2, 39, 0.95);
                    border: 1px solid rgba(252, 0, 255, 0.1);
                    box-shadow: 0 0 30px rgba(0, 219, 222, 0.1);
                }
            `
        };

        // Встановлюємо стилі для обраної теми
        style.html(themes[theme] || '');
        
        // Додаємо стиль у head
        $('head').append(style);
    }

    // Функція для зміни кольору рейтингу фільмів та серіалів
    function updateVoteColors() {
        if (!InterFaceMod.settings.colored_ratings) return;
        
        // Функція для зміни кольору елемента залежно від рейтингу
        function applyColorByRating(element) {
            const voteText = $(element).text().trim();
            // Регулярний вираз для вилучення числа з тексту
            const match = voteText.match(/(\d+(\.\d+)?)/);
            if (!match) return;
            
            const vote = parseFloat(match[0]);
            
            if (vote >= 0 && vote <= 3) {
                $(element).css('color', "red");
            } else if (vote > 3 && vote < 6) {
                $(element).css('color', "orange");
            } else if (vote >= 6 && vote < 8) {
                $(element).css('color', "cornflowerblue");
            } else if (vote >= 8 && vote <= 10) {
                $(element).css('color', "lawngreen");
            }
        }
        
        // Обробляємо рейтинги на головній сторінці та у списках
        $(".card__vote").each(function() {
            applyColorByRating(this);
        });
        
        // Обробляємо рейтинги в детальній картці фільму/серіалу
        $(".full-start__rate, .full-start-new__rate").each(function() {
            applyColorByRating(this);
        });
        
        // Також обробляємо інші можливі елементи з рейтингом
        $(".info__rate, .card__imdb-rate, .card__kinopoisk-rate").each(function() {
            applyColorByRating(this);
        });
    }

    // Спостерігач за змінами в DOM для оновлення кольорів рейтингу
    function setupVoteColorsObserver() {
        if (!InterFaceMod.settings.colored_ratings) return;
        
        // Запускаємо первинне оновлення
        setTimeout(updateVoteColors, 500);
        
        // Створюємо спостерігач для відстеження змін у DOM
        const observer = new MutationObserver(function(mutations) {
            setTimeout(updateVoteColors, 100);
        });
        
        // Запускаємо спостерігач
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    }

    // Додаємо слухач для оновлення кольорів у детальній картці
    function setupVoteColorsForDetailPage() {
        if (!InterFaceMod.settings.colored_ratings) return;
        
        // Слухач події завантаження повної інформації про фільм/серіал
        Lampa.Listener.follow('full', function (data) {
            if (data.type === 'complite') {
                // Оновлюємо кольори рейтингів після завантаження інформації
                setTimeout(updateVoteColors, 100);
            }
        });
    }

    // Функція для зміни кольору статусів серіалів
    function colorizeSeriesStatus() {
        if (!InterFaceMod.settings.colored_elements) return;
        
        // Функція для застосування кольору до статусу
        function applyStatusColor(statusElement) {
            var statusText = $(statusElement).text().trim();
            
            // Кольори для різних статусів з текстовим кольором
            var statusColors = {
                'completed': {
                    bg: 'rgba(46, 204, 113, 0.8)', // Зелений з прозорістю
                    text: 'white'
                },
                'canceled': {
                    bg: 'rgba(231, 76, 60, 0.8)', // Червоний з прозорістю
                    text: 'white'
                },
                'ongoing': {
                    bg: 'rgba(243, 156, 18, 0.8)', // Жовтий/Помаранчевий з прозорістю
                    text: 'black'
                },
                'production': {
                    bg: 'rgba(52, 152, 219, 0.8)', // Синій з прозорістю
                    text: 'white'
                },
                'planned': {
                    bg: 'rgba(155, 89, 182, 0.8)', // Фіолетовий з прозорістю
                    text: 'white'
                },
                'pilot': {
                    bg: 'rgba(230, 126, 34, 0.8)', // Помаранчевий з прозорістю
                    text: 'white'
                },
                'released': {
                    bg: 'rgba(26, 188, 156, 0.8)', // Бірюзовий з прозорістю
                    text: 'white'
                },
                'rumored': {
                    bg: 'rgba(149, 165, 166, 0.8)', // Сірий з прозорістю
                    text: 'white'
                },
                'post': {
                    bg: 'rgba(0, 188, 212, 0.8)', // Блакитний з прозорістю
                    text: 'white'
                }
            };
            
            var bgColor = '';
            var textColor = '';
            
            // Зіставляємо текст статусу з групою
            if (statusText.includes('Заверш') || statusText.includes('Ended')) {
                bgColor = statusColors.completed.bg;
                textColor = statusColors.completed.text;
            } else if (statusText.includes('Скасован') || statusText.includes('Canceled')) {
                bgColor = statusColors.canceled.bg;
                textColor = statusColors.canceled.text;
            } else if (statusText.includes('Онгоинг') || statusText.includes('Виход') || statusText.includes('У процесі...') || statusText.includes('У процесі') || statusText.includes('Return')) {
                bgColor = statusColors.ongoing.bg;
                textColor = statusColors.ongoing.text;
            } else if (statusText.includes('виробництві') || statusText.includes('Production')) {
                bgColor = statusColors.production.bg;
                textColor = statusColors.production.text;
            } else if (statusText.includes('Заплановано') || statusText.includes('Planned')) {
                bgColor = statusColors.planned.bg;
                textColor = statusColors.planned.text;
            } else if (statusText.includes('Пілотний') || statusText.includes('Pilot')) {
                bgColor = statusColors.pilot.bg;
                textColor = statusColors.pilot.text;
            } else if (statusText.includes('Випущений') || statusText.includes('Released')) {
                bgColor = statusColors.released.bg;
                textColor = statusColors.released.text;
            } else if (statusText.includes('чутками') || statusText.includes('Rumored')) {
                bgColor = statusColors.rumored.bg;
                textColor = statusColors.rumored.text;
            } else if (statusText.includes('Скоро') || statusText.includes('Post')) {
                bgColor = statusColors.post.bg;
                textColor = statusColors.post.text;
            }
            
            // Застосовуємо стилі, якщо знайшли відповідний статус
            if (bgColor) {
                $(statusElement).css({
                    'background-color': bgColor,
                    'color': textColor,
                    'border-radius': '0.3em',
                    'border': '0px',
                    'font-size': '1.3em',
                    'display': 'inline-block'
                });
            }
            
            if (InterFaceMod.debug) {
                console.log('Статус серіалу:', statusText, bgColor, textColor);
            }
        }
        
        // Обробка статусів на існуючих елементах
        $('.full-start__status').each(function() {
            applyStatusColor(this);
        });
        
        // Використовуємо MutationObserver для відстеження нових елементів
        var statusObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length) {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        var node = mutation.addedNodes[i];
                        $(node).find('.full-start__status').each(function() {
                            applyStatusColor(this);
                        });
                        
                        if ($(node).hasClass('full-start__status')) {
                            applyStatusColor(node);
                        }
                    }
                }
            });
        });
        
        // Запускаємо спостерігач для body
        statusObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Також слухаємо події повної завантаження картки
        Lampa.Listener.follow('full', function(data) {
            if (data.type === 'complite' && data.data.movie) {
                setTimeout(function() {
                    $(data.object.activity.render()).find('.full-start__status').each(function() {
                        applyStatusColor(this);
                    });
                }, 100);
            }
        });
    }

    // Функція для зміни кольору вікових обмежень
    function colorizeAgeRating() {
        if (!InterFaceMod.settings.colored_elements) return;
        
        // Функція для застосування кольору до вікового обмеження
        function applyAgeRatingColor(ratingElement) {
            var ratingText = $(ratingElement).text().trim();
            
            // Вікові рейтинги за групами
            var ageRatings = {
                kids: ['G', 'TV-Y', 'TV-G', '0+', '3+', '0', '3'],
                children: ['PG', 'TV-PG', 'TV-Y7', '6+', '7+', '6', '7'],
                teens: ['PG-13', 'TV-14', '12+', '13+', '14+', '12', '13', '14'],
                almostAdult: ['R', 'TV-MA', '16+', '17+', '16', '17'],
                adult: ['NC-17', '18+', '18', 'X']
            };
            
            // Кольори для кожної групи
            var colors = {
                kids: {
                    bg: '#2ecc71', // Зелений
                    text: 'white'
                },
                children: {
                    bg: '#3498db', // Блакитний
                    text: 'white'
                },
                teens: {
                    bg: '#f1c40f', // Жовтий
                    text: 'black'
                },
                almostAdult: {
                    bg: '#e67e22', // Помаранчевий
                    text: 'white'
                },
                adult: {
                    bg: '#e74c3c', // Червоний
                    text: 'white'
                }
            };
            
            // Визначаємо групу для поточного рейтингу
            var group = null;
            
            // Перевіряємо всі групи
            for (var groupKey in ageRatings) {
                // Перевіряємо точну відповідність
                if (ageRatings[groupKey].includes(ratingText)) {
                    group = groupKey;
                    break;
                }
                
                // Перевіряємо часткову відповідність
                for (var i = 0; i < ageRatings[groupKey].length; i++) {
                    if (ratingText.includes(ageRatings[groupKey][i])) {
                        group = groupKey;
                        break;
                    }
                }
                
                if (group) break;
            }
            
            // Застосовуємо стилі залежно від знайденої групи
            if (group) {
                $(ratingElement).css({
                    'background-color': colors[group].bg,
                    'color': colors[group].text,
                    'border-radius': '0.3em',
                    'font-size': '1.3em',
                    'border': '0px'
                });
                
                if (InterFaceMod.debug) {
                    console.log('Вікове обмеження:', ratingText, 'група:', group, 'колір:', colors[group].bg);
                }
            }
        }
        
        // Обробка вікових обмежень на існуючих елементах
        $('.full-start__pg').each(function() {
            applyAgeRatingColor(this);
        });
        
        // Використовуємо MutationObserver для відстеження нових елементів
        var ratingObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length) {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        var node = mutation.addedNodes[i];
                        $(node).find('.full-start__pg').each(function() {
                            applyAgeRatingColor(this);
                        });
                        
                        if ($(node).hasClass('full-start__pg')) {
                            applyAgeRatingColor(node);
                        }
                    }
                }
            });
        });
        
        // Запускаємо спостерігач для body
        ratingObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Також слухаємо події повної завантаження картки
        Lampa.Listener.follow('full', function(data) {
            if (data.type === 'complite' && data.data.movie) {
                setTimeout(function() {
                    $(data.object.activity.render()).find('.full-start__pg').each(function() {
                        applyAgeRatingColor(this);
                    });
                }, 100);
            }
        });
    }

    // Функція ініціалізації плагіна
    function startPlugin() {

        // Реєструємо плагін у Lampa
        Lampa.SettingsApi.addComponent({
            component: 'season_info',
            name: 'Інтерфейс мод',
            icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V7C20 7.55228 19.5523 8 19 8H5C4.44772 8 4 7.55228 4 7V5Z" fill="currentColor"/><path d="M4 11C4 10.4477 4.44772 10 5 10H19C19.5523 10 20 10.4477 20 11V13C20 13.5523 19.5523 14 19 14H5C4.44772 14 4 13.5523 4 13V11Z" fill="currentColor"/><path d="M4 17C4 16.4477 4.44772 16 5 16H19C19.5523 16 20 16.4477 20 17V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V17Z" fill="currentColor"/></svg>'
        });
        
        // Додаємо налаштування плагіна
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: { 
                type: 'button',
                component: 'about' 
            },
            field: {
                name: 'Про плагін',
                description: 'Інформація та підтримка'
            },
            onChange: showAbout
        });
        
        
        
        // Додаємо вибір розташування лейбла
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: {
                name: 'label_position',
                type: 'select',
                values: {
                    'top-right': 'Верхній правий кут',
                    'top-left': 'Верхній лівий кут',
                    'bottom-right': 'Нижній правий кут',
                    'bottom-left': 'Нижній лівий кут'
                },
                default: 'top-right'
            },
            field: {
                name: 'Розташування лейбла про серії',
                description: 'Оберіть позицію лейбла на постері'
            },
            onChange: function (value) {
                InterFaceMod.settings.label_position = value;
                Lampa.Settings.update();
                
                // Повідомлення про необхідність перезавантажити сторінку для застосування змін
                Lampa.Noty.show('Для застосування змін відкрийте картку серіалу заново');
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: {
                name: 'show_buttons',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Показувати всі кнопки',
                description: 'Відображати всі кнопки дій у картці'
            },
            onChange: function (value) {
                InterFaceMod.settings.show_buttons = value;
                Lampa.Settings.update();
                console.log('InterfaceMod: Відображення кнопок ' + (value ? 'увімкнено' : 'вимкнено'));
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: {
                name: 'season_info_show_movie_type',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Змінити лейбли типу',
                description: 'Змінити "TV" на "Серіал" та додати лейбл "Фільм"'
            },
            onChange: function (value) {
                InterFaceMod.settings.show_movie_type = value;
                Lampa.Settings.update();
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: {
                name: 'theme_select',
                type: 'select',
                values: {
                    default: 'Ні',
                    bywolf_mod: 'Bywolf_mod',
                    dark_night: 'Dark Night bywolf',
                    blue_cosmos: 'Blue Cosmos',
                    neon: 'Neon',
                    sunset: 'Dark MOD',
                    emerald: 'Emerald V1',
                    aurora: 'Aurora'
                },
                default: 'default'
            },
            field: {
                name: 'Тема інтерфейсу',
                description: 'Оберіть тему оформлення інтерфейсу'
            },
            onChange: function(value) {
                InterFaceMod.settings.theme = value;
                Lampa.Settings.update();
                applyTheme(value);
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: {
                name: 'colored_ratings',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Кольорові рейтинги',
                description: 'Змінювати колір рейтингу залежно від оцінки'
            },
            onChange: function (value) {
                // Зберігаємо поточний активний елемент
                var activeElement = document.activeElement;
                
                // Оновлюємо налаштування
                InterFaceMod.settings.colored_ratings = value;
                Lampa.Settings.update();
                
                // Використовуємо setTimeout для відкладеного виконання, 
                // щоб не порушувати цикл обробки поточної події
                setTimeout(function() {
                    if (value) {
                        // Якщо увімкнено, запускаємо оновлення кольорів та спостерігач
                        setupVoteColorsObserver();
                        setupVoteColorsForDetailPage();
                    } else {
                        // Якщо вимкнено, повертаємо стандартний колір для всіх елементів з рейтингом
                        $(".card__vote, .full-start__rate, .full-start-new__rate, .info__rate, .card__imdb-rate, .card__kinopoisk-rate").css("color", "");
                    }
                    
                    // Повертаємо фокус на активний елемент
                    if (activeElement && document.body.contains(activeElement)) {
                        activeElement.focus();
                    }
                }, 0);
            }
        });
        
        Lampa.SettingsApi.addParam({
            component: 'season_info',
            param: {
                name: 'colored_elements',
                type: 'trigger',
                default: true
            },
            field: {
                name: 'Кольорові елементи',
                description: 'Відображати статуси серіалів та вікові обмеження кольоровими'
            },
            onChange: function (value) {
                InterFaceMod.settings.colored_elements = value;
                Lampa.Settings.update();
                
                if (value) {
                    colorizeSeriesStatus();
                    colorizeAgeRating();
                } else {
                    // Повертаємо стандартні кольори
                    $('.full-start__status').css({
                        'background-color': '',
                        'color': '',
                        'padding': '',
                        'border-radius': '',
                        'font-weight': '',
                        'display': ''
                    });
                    
                    $('.full-start__pg').css({
                        'background-color': '',
                        'color': '',
                        'font-weight': ''
                    });
                }
            }
        });
        
        // Застосовуємо налаштування
        InterFaceMod.settings.show_buttons = Lampa.Storage.get('show_buttons', true);
        InterFaceMod.settings.show_movie_type = Lampa.Storage.get('season_info_show_movie_type', true);
        InterFaceMod.settings.theme = Lampa.Storage.get('theme_select', 'default');
        InterFaceMod.settings.colored_ratings = Lampa.Storage.get('colored_ratings', true);
        InterFaceMod.settings.colored_elements = Lampa.Storage.get('colored_elements', true);
        InterFaceMod.settings.seasons_info_mode = Lampa.Storage.get('seasons_info_mode', 'aired');
        InterFaceMod.settings.show_episodes_on_main = Lampa.Storage.get('show_episodes_on_main', false);
        InterFaceMod.settings.label_position = Lampa.Storage.get('label_position', 'top-right');
        
        // Встановлюємо enabled на основі seasons_info_mode
        InterFaceMod.settings.enabled = (InterFaceMod.settings.seasons_info_mode !== 'none');
        
        applyTheme(InterFaceMod.settings.theme);
        
        // Запускаємо функції плагіна залежно від налаштувань
 
        }
        
        // Запускаємо функцію відображення кнопок у будь-якому випадку
        showAllButtons();
        
        // Змінюємо лейбли типу контенту
        changeMovieTypeLabels();
        
        // Запускаємо функцію кольорових рейтингів та спостерігач
        if (InterFaceMod.settings.colored_ratings) {
            setupVoteColorsObserver();
            // Додаємо слухач для оновлення кольорів у детальній картці
            setupVoteColorsForDetailPage();
        }
        
        // Запускаємо функції кольорових статусів та вікових обмежень
        if (InterFaceMod.settings.colored_elements) {
            colorizeSeriesStatus();
            colorizeAgeRating();
        }

        // Додати в startPlugin() після реєстрації всіх компонентів
        Lampa.Settings.listener.follow('open', function (e) {
            // Чекаємо на рендеринг елементів меню
            setTimeout(function() {
                // Знаходимо наш компонент і компонент "Інтерфейс"
                var interfaceMod = $('.settings-folder[data-component="season_info"]');
                var interfaceStandard = $('.settings-folder[data-component="interface"]');
                
                // Якщо знайшли обидва елементи, переміщаємо наш компонент після стандартного
                if (interfaceMod.length && interfaceStandard.length) {
                    interfaceMod.insertAfter(interfaceStandard);
                }
            }, 100);
        });
    }

  function _0x4e5f(){var _0x16f3a0=['then','error','32002ZEhIqs','contribution','</h1>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin__footer\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h3>Поддержать\x20разработку</h3>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22color:\x20white;\x20font-size:\x2014px;\x20margin-bottom:\x205px;\x22>OZON\x20Банк</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22color:\x20white;\x20font-size:\x2018px;\x20font-weight:\x20bold;\x20margin-bottom:\x205px;\x22>+7\x20953\x20235\x2000\x2002</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22color:\x20#ffffff;\x20font-size:\x2012px;\x22>Владелец:\x20Иван\x20Л.</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-container\x22\x20style=\x22margin-top:\x2020px;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-column\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-title\x22>Особая\x20благодарность\x20в\x20поддержке:</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-list\x20supporters-list\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-item\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-name\x22>Загрузка\x20данных...</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-column\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-title\x22>Спасибо\x20за\x20идеи\x20и\x20разработку:</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-list\x20contributors-list\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-item\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-name\x22>Загрузка\x20данных...</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin__description\x22\x20style=\x22margin-top:\x2020px;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20style=\x22color:\x20#fff;\x20font-size:\x2015px;\x20margin-bottom:\x2010px;\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20New\x20versions\x202.2.0\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<ul>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li><span>✦</span>\x20Востоновленна\x20работа\x20с\x20кнопками</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li><span>✦</span>\x20Новая\x20функция\x20цветные\x20статусы\x20и\x20возростные\x20ограничения\x20это\x20там\x20где\x20\x22Онгоинг\x22\x20и\x2018+</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li><span>✦</span>\x20Изменено\x20расположения\x20настроек\x20плагина\x20теперь\x20оно\x20сразу\x20после\x20настроек\x20интерфейса\x20лампы</li>\x0a\x09\x09\x09\x09\x09<li><span>✦</span>\x20Добавленно\x20две\x20новых\x20темы</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<li><span>✦</span>\x20Мелкие\x20исправления\x20и\x20улучшения</li>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</ul>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20','find','Controller','#about-plugin-styles','forEach','random','20czITHT','Сетевой\x20ответ\x20некорректен','version','Ошибка\x20загрузки\x20данных:','close','</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-contribution\x22>','1828302cvGTgA','remove','name','7329UtbJGC','1140084IlxCNQ','.supporters-list','2248jvqFNZ','date','\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22about-plugin__title\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<h1>Интерфейс\x20MOD\x20v','Modal','666378FfKmzW','supporters','10PpKvBF','.contributors-list','append','json','head','contributors','html','<div></div>','15dtMzdn','</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20','open','2859651BWXlbG','\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-item\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-name\x22>Ошибка\x20загрузки\x20данных</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-contribution\x22>Проверьте\x20соединение</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20','269236BjiuRE','full','toggle'];_0x4e5f=function(){return _0x16f3a0;};return _0x4e5f();}(function(_0x1dd2a5,_0x491e52){var _0x1a175b=_0x5c85,_0x3d525d=_0x1dd2a5();while(!![]){try{var _0x286241=-parseInt(_0x1a175b(0xf8))/0x1+parseInt(_0x1a175b(0x10c))/0x2*(-parseInt(_0x1a175b(0x102))/0x3)+parseInt(_0x1a175b(0x107))/0x4+-parseInt(_0x1a175b(0xfa))/0x5*(-parseInt(_0x1a175b(0x11a))/0x6)+parseInt(_0x1a175b(0x11d))/0x7*(-parseInt(_0x1a175b(0xf4))/0x8)+-parseInt(_0x1a175b(0x105))/0x9*(-parseInt(_0x1a175b(0x114))/0xa)+parseInt(_0x1a175b(0x11e))/0xb;if(_0x286241===_0x491e52)break;else _0x3d525d['push'](_0x3d525d['shift']());}catch(_0x4a88d6){_0x3d525d['push'](_0x3d525d['shift']());}}}(_0x4e5f,0x5b9eb));function _0x5c85(_0x5e3dad,_0x5e3faf){var _0x4e5fc3=_0x4e5f();return _0x5c85=function(_0x5c85ab,_0x245f8f){_0x5c85ab=_0x5c85ab-0xf3;var _0x260992=_0x4e5fc3[_0x5c85ab];return _0x260992;},_0x5c85(_0x5e3dad,_0x5e3faf);}function showAbout(){var _0x3473dc=_0x5c85;$(_0x3473dc(0x111))['length']&&$('#about-plugin-styles')[_0x3473dc(0x11b)]();var _0x51d740=$('<style\x20id=\x22about-plugin-styles\x22></style>');_0x51d740['html']('\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20rgba(9,\x202,\x2039,\x200.95);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x2015px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20overflow:\x20hidden;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20box-shadow:\x200\x200\x2015px\x20rgba(0,\x20219,\x20222,\x200.1);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__title\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20linear-gradient(90deg,\x20#fc00ff,\x20#00dbde);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2015px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-align:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__title\x20h1\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2024px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-weight:\x20bold;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-shadow:\x200\x200\x205px\x20rgba(255,\x20255,\x20255,\x200.5);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__description\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2015px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20rgba(15,\x202,\x2033,\x200.8);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border:\x201px\x20solid\x20rgba(252,\x200,\x20255,\x200.2);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__description\x20ul\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20#fff;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2014px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20line-height:\x201.5;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20list-style-type:\x20none;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding-left:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin:\x2010px\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__description\x20li\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x206px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding-left:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20relative;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__description\x20li\x20span\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20absolute;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20left:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20#fc00ff;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__footer\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2015px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20linear-gradient(90deg,\x20#fc00ff,\x20#00dbde);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-align:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.about-plugin__footer\x20h3\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-top:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2018px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-weight:\x20bold;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-container\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20display:\x20flex;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20justify-content:\x20space-between;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-top:\x2020px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-column\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20width:\x2048%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20rgba(15,\x202,\x2033,\x200.8);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20relative;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20height:\x20200px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20overflow:\x20hidden;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border:\x201px\x20solid\x20rgba(252,\x200,\x20255,\x200.2);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-title\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20#fc00ff;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2016px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-weight:\x20bold;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-align:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-shadow:\x200\x200\x205px\x20rgba(252,\x200,\x20255,\x200.3);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20relative;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20z-index:\x2010;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20background:\x20rgba(15,\x202,\x2033,\x200.95);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x208px\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-radius:\x205px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20box-shadow:\x200\x202px\x205px\x20rgba(0,\x200,\x200,\x200.3);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20border-bottom:\x201px\x20solid\x20rgba(252,\x200,\x20255,\x200.3);\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-list\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20position:\x20absolute;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20width:\x20100%;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20left:\x200;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding:\x200\x2010px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20box-sizing:\x20border-box;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20animation:\x20scrollCredits\x2030s\x20linear\x20infinite;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20padding-top:\x2060px;\x20/*\x20Увеличенный\x20отступ\x20перед\x20началом\x20титров\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-top:\x2020px;\x20/*\x20Дополнительный\x20отступ\x20от\x20заголовка\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-item\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20text-align:\x20center;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x2015px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20color:\x20white;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-name\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-weight:\x20bold;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2014px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20margin-bottom:\x204px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20.credits-contribution\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20font-size:\x2012px;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20opacity:\x200.8;\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20@keyframes\x20scrollCredits\x20{\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x200%\x20{\x20transform:\x20translateY(50%);\x20}\x20/*\x20Начинаем\x20анимацию\x20с\x20середины\x20*/\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20100%\x20{\x20transform:\x20translateY(-100%);\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20}\x0a\x20\x20\x20\x20\x20\x20\x20\x20'),$(_0x3473dc(0xfe))[_0x3473dc(0xfc)](_0x51d740);var _0x4d4d60=_0x3473dc(0xf6)+InterFaceMod[_0x3473dc(0x116)]+_0x3473dc(0x10e),_0x8d7af5=$(_0x3473dc(0x101));_0x8d7af5['html'](_0x4d4d60),Lampa[_0x3473dc(0xf7)][_0x3473dc(0x104)]({'title':'','html':_0x8d7af5,'onBack':function(){var _0x112901=_0x3473dc;$(_0x112901(0x111))['remove'](),Lampa[_0x112901(0xf7)][_0x112901(0x118)](),Lampa[_0x112901(0x110)][_0x112901(0x109)]('settings');},'size':_0x3473dc(0x108)});var _0x1fbc04='https://bywolf88.github.io/lampa-plugins/usersupp.json?nocache='+Math[_0x3473dc(0x113)]();fetch(_0x1fbc04)[_0x3473dc(0x10a)](function(_0x251ffd){var _0x1127f6=_0x3473dc;if(!_0x251ffd['ok'])throw new Error(_0x1127f6(0x115));return _0x251ffd[_0x1127f6(0xfd)]();})[_0x3473dc(0x10a)](function(_0x97bcd8){var _0x13679a=_0x3473dc;if(_0x97bcd8&&_0x97bcd8['supporters']&&_0x97bcd8[_0x13679a(0xff)]){var _0x1acaa5='';_0x97bcd8[_0x13679a(0xf9)]['forEach'](function(_0x53aa47){var _0x481a4=_0x13679a;_0x1acaa5+='\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-item\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-name\x22>'+_0x53aa47[_0x481a4(0x11c)]+'</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-contribution\x22>'+_0x53aa47[_0x481a4(0x10d)]+_0x481a4(0x119)+_0x53aa47[_0x481a4(0xf5)]+_0x481a4(0x103);}),_0x8d7af5['find'](_0x13679a(0xf3))[_0x13679a(0x100)](_0x1acaa5);var _0x2d97f7='';_0x97bcd8[_0x13679a(0xff)][_0x13679a(0x112)](function(_0xc3b90f){var _0x1c095c=_0x13679a;_0x2d97f7+='\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-item\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-name\x22>'+_0xc3b90f[_0x1c095c(0x11c)]+_0x1c095c(0x119)+_0xc3b90f[_0x1c095c(0x10d)]+'</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22credits-contribution\x22>'+_0xc3b90f[_0x1c095c(0xf5)]+_0x1c095c(0x103);}),_0x8d7af5['find'](_0x13679a(0xfb))[_0x13679a(0x100)](_0x2d97f7);}})['catch'](function(_0x5bb425){var _0xa73fe5=_0x3473dc;console[_0xa73fe5(0x10b)](_0xa73fe5(0x117),_0x5bb425);var _0x4a2e24=_0xa73fe5(0x106);_0x8d7af5[_0xa73fe5(0x10f)]('.supporters-list')[_0xa73fe5(0x100)](_0x4a2e24),_0x8d7af5[_0xa73fe5(0x10f)]('.contributors-list')[_0xa73fe5(0x100)](_0x4a2e24);});}


    // Чекаємо на завантаження програми та запускаємо плагін
    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                startPlugin();
            }
        });
    }

    // Реєстрація плагіна в маніфесті
    Lampa.Manifest.plugins = {
        name: 'Інтерфейс мод',
        version: '2.2.0',
        description: 'Покращений інтерфейс для програми Lampa'
    };

    // Експортуємо об'єкт плагіна для зовнішнього доступу
    window.season_info = InterFaceMod;
})();
