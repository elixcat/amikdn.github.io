(function() {
    'use strict';
    var Defined = {
        use_api: 'plxsena',
        localhost: 'https://pl.xsena.red/sisi',
        framework: ''
    };
    var luid = Lampa.Storage.get('lampac_unic_id', '');
    if (!luid) {
        luid = Lampa.Utils.uid(8).toLowerCase();
        Lampa.Storage.set('lampac_unic_id', luid);
    }
    Lampa.Lang.add({
        lampac_sisiname: {
            ru: 'Клубничка',
            en: 'Strawberry',
            uk: 'Полуничка',
            zh: '草莓'
        }
    });
    var network = new Lampa.Reguest();
    var preview_timer, preview_video;

    function sourceTitle(title) {
        return Lampa.Utils.capitalizeFirstLetter(title.split('. ')[0]);
    }

    function isVIP(element) {
        return /vip.mp4/.test(element.video);
    }

    function getAndroidVersion() {
        if (Lampa.Platform.is('android')) {
            try {
                var current = AndroidJS.appVersion().split('- ');
                return parseInt(current.pop());
            } catch (e) {
                return 0;
            }
        } else {
            return 0;
        }
    }
    var hostkey = 'https://pl.xsena.red'.replace('http://', '').replace('https://', '');
    if (!window.rch_nws || !window.rch_nws[hostkey]) {
        if (!window.rch_nws) window.rch_nws = {};
        window.rch_nws[hostkey] = {
            type: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : undefined,
            startTypeInvoke: false,
            rchRegistry: false,
            apkVersion: getAndroidVersion()
        };
    }
    window.rch_nws[hostkey].typeInvoke = function rchtypeInvoke(host, call) {
        if (!window.rch_nws[hostkey].startTypeInvoke) {
            window.rch_nws[hostkey].startTypeInvoke = true;
            var check = function check(good) {
                window.rch_nws[hostkey].type = Lampa.Platform.is('android') ? 'apk' : good ? 'cors' : 'web';
                call();
            };
            if (Lampa.Platform.is('android') || Lampa.Platform.is('tizen')) check(true);
            else {
                var net = new Lampa.Reguest();
                net.silent('https://pl.xsena.red'.indexOf(location.host) >= 0 ? 'https://github.com/' : host + '/cors/check', function() {
                    check(true);
                }, function() {
                    check(false);
                }, false, {
                    dataType: 'text'
                });
            }
        } else call();
    };
    window.rch_nws[hostkey].Registry = function RchRegistry(client, startConnection) {
        window.rch_nws[hostkey].typeInvoke('https://pl.xsena.red', function() {
            client.invoke("RchRegistry", {
                host: location.host,
                rchtype: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : (window.rch_nws[hostkey].type || 'web'),
                apkVersion: Lampa.Platform.is('android') ? (window.rch_nws[hostkey].apkVersion || 0) : 0,
                player: Lampa.Storage.field('player')
            });
            if (window.rch_nws[hostkey].rchRegistry) return;
            window.rch_nws[hostkey].rchRegistry = true;
            var handled = false;
            client.on('RchRegistry', function(clientIp, connectionId, rchtype) {
                if (startConnection && !handled) {
                    handled = true;
                    startConnection();
                }
            });
            client.on("RchClient", function(rchId, url, data, headers, returnHeaders) {
                var network = new Lampa.Reguest();

                function sendResult(uri, html) {
                    $.ajax({
                        url: 'https://pl.xsena.red/rch/' + uri + '?id=' + rchId,
                        type: 'POST',
                        data: html,
                        async: true,
                        cache: false,
                        contentType: false,
                        processData: false,
                        success: function(j) {},
                        error: function() {
                            client.invoke("RchResult", rchId, '');
                        }
                    });
                }

                function result(html) {
                    if (Lampa.Arrays.isObject(html) || Lampa.Arrays.isArray(html)) {
                        html = JSON.stringify(html);
                    }
                    if (typeof CompressionStream !== 'undefined' && html && html.length > 1000) {
                        var compressionStream = new CompressionStream('gzip');
                        var encoder = new TextEncoder();
                        var readable = new ReadableStream({
                            start: function(controller) {
                                controller.enqueue(encoder.encode(html));
                                controller.close();
                            }
                        });
                        var compressedStream = readable.pipeThrough(compressionStream);
                        new Response(compressedStream).arrayBuffer().then(function(compressedBuffer) {
                            var compressedArray = new Uint8Array(compressedBuffer);
                            if (compressedArray.length > html.length) {
                                sendResult('result', html);
                            } else {
                                sendResult('gzresult', compressedArray);
                            }
                        }).catch(function() {
                            sendResult('result', html);
                        });
                    } else {
                        sendResult('result', html);
                    }
                }
                if (url == 'eval') {
                    result(eval(data));
                } else if (url == 'evalrun') {
                    eval(data);
                } else if (url == 'ping') {
                    result('pong');
                } else {
                    network["native"](url, result, function(e) {
                        result('');
                    }, data, {
                        dataType: 'text',
                        timeout: 1000 * 8,
                        headers: headers,
                        returnHeaders: returnHeaders
                    });
                }
            });
            client.on('Connected', function(connectionId) {
                window.rch_nws[hostkey].connectionId = connectionId;
            });
        });
    };
    window.rch_nws[hostkey].typeInvoke('https://pl.xsena.red', function() {});

    function rchInvoke(json, call) {
        if (!window.nwsClient) window.nwsClient = {};
        var client = window.nwsClient[hostkey];
        if (client && client.connectionId != null) {
            call();
        } else if (client) {
            client.reconnect(function() {
                call();
            });
        } else {
            window.nwsClient[hostkey] = new NativeWsClient(json.nws, {
                autoReconnect: true
            });
            window.nwsClient[hostkey].on('Connected', function(connectionId) {
                window.rch_nws[hostkey].Registry(window.nwsClient[hostkey], function() {
                    call();
                });
            });
            window.nwsClient[hostkey].connect();
        }
    }

    function rchRun(json, call) {
        if (typeof NativeWsClient == 'undefined') {
            Lampa.Utils.putScript(["https://pl.xsena.red/js/nws-client-es5.js?v21042026"], function() {}, false, function() {
                rchInvoke(json, call);
            }, true);
        } else {
            rchInvoke(json, call);
        }
    }

    function modal(text) {
        var id = Lampa.Storage.get('sisi_unic_id', '').toLowerCase();
        var controller = Lampa.Controller.enabled().name;
        var content = "<div class=\"about\"><div>" + (text || 'Добавьте идентификатор устройства в init.conf') + "</div><div class=\"about contacts\"><div><small>unic_id</small><br>" + luid + "</div><div><small>box_mac</small><br>" + id + "</div></div></div>";
        Lampa.Modal.open({
            title: 'Доступ ограничен',
            html: $(content),
            size: 'medium',
            onBack: function onBack() {
                Lampa.Modal.close();
                Lampa.Controller.toggle(controller);
            }
        });
    }

    function qualityDefault(qualitys) {
        var preferably = Lampa.Storage.get('video_quality_default', '1080') + 'p';
        var url;
        if (qualitys) {
            for (var q in qualitys) {
                if (q.indexOf(preferably) == 0) url = qualitys[q];
            }
            if (!url) url = qualitys[Lampa.Arrays.getKeys(qualitys)[0]];
        }
        return url;
    }

    function play(element) {
        var controller_enabled = Lampa.Controller.enabled().name;
        if (isVIP(element)) {
            return modal();
        }
        if (true && !element.history_uid && element.bookmark && Lampa.Storage.field('sisi_history')) {
            network.silent(Api.account(Defined.localhost + '/history/add'), function(e) {}, function() {}, JSON.stringify(element), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        if (element.json) {
            Lampa.Loading.start(function() {
                network.clear();
                Lampa.Loading.stop();
            });
            Api.account(element.video + '&json=true');
            Api.qualitys(element.video, function(data) {
                if (data.error) {
                    Lampa.Noty.show(Lampa.Lang.translate('torrent_parser_nofiles'));
                    Lampa.Loading.stop();
                    return;
                }
                var qualitys = data.qualitys || data;
                var recomends = data.recomends || [];
                Lampa.Loading.stop();
                for (var i in qualitys) {
                    qualitys[i] = Api.account(qualitys[i], true);
                }
                var video = {
                    title: element.name,
                    url: Api.account(qualityDefault(qualitys), true),
                    url_reserve: data.qualitys_proxy ? Api.account(qualityDefault(data.qualitys_proxy), true) : false,
                    quality: qualitys,
                    headers: data.headers_stream
                };
                Lampa.Player.play(video);
                if (recomends.length) {
                    recomends.forEach(function(a) {
                        a.title = Lampa.Utils.shortText(a.name, 50);
                        a.icon = '<img class="size-youtube" src="' + a.picture + '" />';
                        a.template = 'selectbox_icon';
                        a.url = function(call) {
                            if (a.json) {
                                Api.qualitys(a.video, function(data) {
                                    a.quality = data.qualitys;
                                    a.url = Api.account(qualityDefault(data.qualitys), true);
                                    if (data.qualitys_proxy) a.url_reserve = Api.account(qualityDefault(data.qualitys_proxy), true);
                                    call();
                                });
                            } else {
                                a.url = a.video;
                                call();
                            }
                        };
                    });
                    Lampa.Player.playlist(recomends);
                } else {
                    Lampa.Player.playlist([video]);
                }
                Lampa.Player.callback(function() {
                    Lampa.Controller.toggle(controller_enabled);
                });
            }, function() {
                Lampa.Noty.show(Lampa.Lang.translate('torrent_parser_nofiles'));
                Lampa.Loading.stop();
            });
        } else {
            if (element.qualitys) {
                for (var i in element.qualitys) {
                    element.qualitys[i] = Api.account(element.qualitys[i], true);
                }
            }
            var video = {
                title: element.name,
                url: Api.account(qualityDefault(element.qualitys) || element.video, true),
                url_reserve: Api.account(qualityDefault(element.qualitys_proxy) || element.video_reserve || '', true),
                quality: element.qualitys
            };
            Lampa.Player.play(video);
            Lampa.Player.playlist([video]);
            Lampa.Player.callback(function() {
                Lampa.Controller.toggle(controller_enabled);
            });
        }
    }

    function fixCards(json) {
        json.forEach(function(m) {
            m.background_image = m.picture;
            m.poster = m.picture;
            m.img = m.picture;
            m.name = Lampa.Utils.capitalizeFirstLetter(m.name).replace(/\&(.*?);/g, '');
        });
    }

    function hidePreview() {
        clearTimeout(preview_timer);
        if (preview_video) {
            var vid = preview_video.find('video');
            try {
                vid.pause();
            } catch (e) {}
            preview_video.addClass('hide');
            preview_video = false;
        }
    }

    function preview(target, element) {
        hidePreview();
        preview_timer = setTimeout(function() {
            if (!element.preview || !Lampa.Storage.field('sisi_preview')) return;
            var video = target.find('video');
            var container = target.find('.sisi-video-preview');
            if (container.length == 0) {
                container = document.createElement('div');
                container.className = 'sisi-video-preview';
                container.style.position = 'absolute';
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.left = '0';
                container.style.top = '0';
                container.style.overflow = 'hidden';
                container.style.borderRadius = '1em';
                video = document.createElement('video');
                video.style.position = 'absolute';
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.left = '0';
                video.style.top = '0';
                video.style.objectFit = 'cover';
                container.appendChild(video);
                target.find('.card-view').append(container);
                video.addEventListener('ended', function() {
                    container.addClass('hide');
                });
                video.src = element.preview;
                video.load();
            }
            preview_video = $(container);
            try {
                preview_video.find('video')[0].play();
            } catch (e) {}
            preview_video.removeClass('hide');
        }, 1500);
    }

    function fixList(list) {
        list.forEach(function(a) {
            if (!a.quality && a.time) a.quality = a.time;
        });
        return list;
    }

    function menu$2(target, card_data) {
        if (!card_data.bookmark) return;
        var cm = [{
            title: !card_data.bookmark.uid ? 'В закладки' : 'Удалить из закладок'
        }];
        if (card_data.history_uid) {
            cm.push({
                title: 'Удалить из истории',
                history: true
            });
        }
        if (card_data.related) {
            cm.push({
                title: 'Похожие',
                related: true
            });
        }
        if (card_data.model) {
            cm.push({
                title: card_data.model.name,
                model: true
            });
        }
        Lampa.Select.show({
            title: 'Меню',
            items: cm,
            onSelect: function onSelect(m) {
                if (m.model) {
                    Lampa.Activity.push({
                        url: Defined.localhost.replace('/sisi', '') + '/' + card_data.model.uri,
                        title: 'Модель - ' + card_data.model.name,
                        component: 'sisi_view_' + Defined.use_api,
                        page: 1
                    });
                } else if (m.related) {
                    Lampa.Activity.push({
                        url: card_data.video + '&related=true',
                        title: 'Похожие - ' + card_data.title,
                        component: 'sisi_view_' + Defined.use_api,
                        page: 1
                    });
                } else if (m.history) {
                    Api.history(card_data, function(status) {
                        Lampa.Noty.show('Успешно');
                    });
                    Lampa.Controller.toggle('content');
                } else {
                    Api.bookmark(card_data, !card_data.bookmark.uid, function(status) {
                        Lampa.Noty.show('Успешно');
                    });
                    Lampa.Controller.toggle('content');
                }
            },
            onBack: function onBack() {
                Lampa.Controller.toggle('content');
            }
        });
    }
    var Utils = {
        sourceTitle: sourceTitle,
        play: play,
        fixCards: fixCards,
        isVIP: isVIP,
        preview: preview,
        hidePreview: hidePreview,
        fixList: fixList,
        menu: menu$2
    };

    function ApiHttp() {
        var _this = this;
        var network = new Lampa.Reguest();
        var menu;
        this.menu = function(success, error) {
            if (menu) return success(menu);
            var url = this.account(Defined.localhost);
            network.silent(url, function(data) {
                if (data.channels) {
                    menu = data.channels;
                    success(menu);
                } else {
                    error(data.msg);
                }
            }, error);
        };
        this.view = function(params, success, error) {
            var u = Lampa.Utils.addUrlComponent(params.url, 'pg=' + (params.page || 1));
            network.silent(this.account(u), function(json) {
                if (json.list) {
                    json.results = Utils.fixList(json.list);
                    json.collection = true;
                    json.total_pages = json.total_pages || 30;
                    Utils.fixCards(json.results);
                    delete json.list;
                    success(json);
                } else {
                    error();
                }
            }, error);
        };
        this.bookmark = function(element, add, call) {
            var u = Defined.localhost + '/bookmark/' + (add ? 'add' : 'remove?id=' + element.bookmark.uid);
            network.silent(this.account(u), function(e) {
                call(true);
            }, function() {
                call(false);
            }, JSON.stringify(element), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        };
        this.history = function(element, call) {
            var u = Defined.localhost + '/history/remove?id=' + element.history_uid;
            network.silent(this.account(u), function(e) {
                call(true);
            }, function() {
                call(false);
            });
        };
        this.account = function(u) {
            var unic_id = Lampa.Storage.get('sisi_unic_id', '');
            var uid = Lampa.Storage.get('lampac_unic_id', '');
            if (u.indexOf('box_mac=') === -1) u = Lampa.Utils.addUrlComponent(u, 'box_mac=' + unic_id);
            if (uid && u.indexOf('uid=') === -1) u = Lampa.Utils.addUrlComponent(u, 'uid=' + encodeURIComponent(uid));
            return u;
        };
        this.playlist = function(add_url_query, oncomplite, error) {
            var load = function load() {
                var status = new Lampa.Status(menu.length);
                status.onComplite = function(data) {
                    var items = [];
                    menu.forEach(function(m) {
                        if (data[m.playlist_url]) items.push(data[m.playlist_url]);
                    });
                    if (items.length) oncomplite(items);
                    else error();
                };
                menu.forEach(function(m) {
                    var u = _this.account(m.playlist_url + (m.playlist_url.indexOf('?') !== -1 ? '&' : '?') + add_url_query);
                    network.silent(u, function(json) {
                        if (json.list) {
                            json.title = Utils.sourceTitle(m.title);
                            json.results = Utils.fixList(json.list);
                            json.url = m.playlist_url;
                            json.collection = true;
                            Utils.fixCards(json.results);
                            status.append(m.playlist_url, json);
                        } else status.error();
                    }, status.error.bind(status));
                });
            };
            if (menu) load();
            else _this.menu(load, error);
        };
        this.main = function(params, oncomplite, error) {
            this.playlist('', oncomplite, error);
        };
        this.search = function(params, oncomplite, error) {
            this.playlist('search=' + encodeURIComponent(params.query), oncomplite, error);
        };
        this.qualitys = function(video_url, oncomplite, error) {
            network.silent(this.account(video_url + '&json=true'), oncomplite, error);
        };
    }
    var Api = new ApiHttp();

    function Sisi(object) {
        var comp = new Lampa.InteractionMain(object);
        comp.create = function() {
            this.activity.loader(true);
            Api.main(object, this.build.bind(this), this.empty.bind(this));
            return this.render();
        };
        return comp;
    }

    function View(object) {
        var comp = new Lampa.InteractionCategory(object);
        comp.create = function() {
            var _this = this;
            this.activity.loader(true);
            Api.view(object, function(data) {
                _this.build(data);
            }, this.empty.bind(this));
        };
        return comp;
    }

    function startPlugin() {
        window['plugin_xsena_' + Defined.use_api + '_ready'] = true;
        Lampa.Component.add('sisi_' + Defined.use_api, Sisi);
        Lampa.Component.add('sisi_view_' + Defined.use_api, View);
        var button = $("<li class=\"menu item selector\" data-action=\"xsena\"><div class=\"menu ico\">...</div><div class=\"menu text\">xsena.red</div></li>");
        button.on('hover:enter', function() {
            Api.menu(function(data) {
                Lampa.Select.show({
                    title: 'Сайты',
                    items: data,
                    onSelect: function(a) {
                        Lampa.Activity.push({
                            url: a.playlist_url,
                            title: a.title,
                            component: 'sisi_view_' + Defined.use_api
                        });
                    }
                });
            });
        });
        $('.menu .menu list').eq(0).append(button);
    }
    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function(e) {
        if (e.type == 'ready') startPlugin();
    });
})();
