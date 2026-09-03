(function () {
  'use strict';

  var PLUGIN_FLAG = 'rezka_comment_plugin';
  var COMPONENT = 'rezka_comment';
  var BUTTON_CLASS = 'rezka-comment--button';
  var STYLE_ID = 'rezka-comment-style';
  var CACHE_KEY = 'rezka_comment_cache_v3'; // Оновлено версію кешу
  var CACHE_TTL = 24 * 60 * 60 * 1000;
  var CACHE_LIMIT = 40;
  var REQUEST_TIMEOUT = 15000;

  var DEFAULT_HOST = 'https://rezka.ag';
  var DEFAULT_PROXY = 'https://worker-patient-dream-26d8.bdvburik.workers.dev:8443/';

  var network = null;
  var busy = false;
  var modal_open = false;

  function getNetwork() { if (!network) network = new Lampa.Reguest(); return network; }
  function stopBusy() { busy = false; Lampa.Loading.stop(); }
  function fail(message) { stopBusy(); if (message) Lampa.Noty.show(message); }

  function getSettings() {
    var host = String(Lampa.Storage.get('rezka_comment_host', DEFAULT_HOST) || DEFAULT_HOST).trim();
    var cookie = String(Lampa.Storage.get('rezka_comment_cookie', '') || '').trim();
    var proxy = String(Lampa.Storage.get('rezka_comment_proxy', DEFAULT_PROXY) || DEFAULT_PROXY).trim();
    var scale = Lampa.Storage.get('rezka_comment_scale', 100);
    host = host.replace(/\/+$/, '');
    if (host && !/^https?:\/\//i.test(host)) host = 'https://' + host;
    if (!host) host = DEFAULT_HOST;
    if (proxy && proxy.charAt(proxy.length - 1) !== '/') proxy += '/';
    return { host: host, cookie: cookie, proxy: proxy, scale: scale };
  }

  function buildUrl(target, referer) {
    var s = getSettings();
    var url = s.proxy;
    if (s.cookie) url += 'param/Cookie=' + encodeURIComponent(s.cookie) + '/';
    if (referer) url += 'param/Referer=' + encodeURIComponent(referer) + '/';
    return url + target;
  }

  function request(url, onSuccess, onError) {
    var net = getNetwork();
    net.timeout(REQUEST_TIMEOUT);
    net.native(url, function (data) {
        var text = typeof data === 'string' ? data : String(data || '');
        if (text.indexOf('Проверяем, что вы не бот') !== -1 || text.indexOf('Anubis') !== -1) onError('challenge');
        else onSuccess(text);
    }, function (err, code) { onError(code ? 'HTTP ' + code : 'network'); }, false, { dataType: 'text' });
  }

  function parseHTML(html) {
    try { if (typeof DOMParser !== 'undefined') return new DOMParser().parseFromString(html, 'text/html'); } catch (e) {}
    var holder = document.createElement('div'); holder.innerHTML = html; return holder;
  }

  function getCountryFromPage(dom) {
    var items = dom.querySelectorAll('.b-post__info_details_item');
    for (var i = 0; i < items.length; i++) {
        var text = items[i].innerText || "";
        if (text.indexOf('Страна:') !== -1) return text.replace('Страна:', '').replace(/\n/g, '').trim();
    }
    return '';
  }

  function writeCache(key, html, title, country) {
    var all = Lampa.Storage.get(CACHE_KEY, '{}') || {};
    all[key] = { time: Date.now(), html: html, title: title || '', country: country || '' };
    Lampa.Storage.set(CACHE_KEY, all);
  }

  function readCache(key) {
    var all = Lampa.Storage.get(CACHE_KEY, '{}') || {};
    return (all[key] && (Date.now() - all[key].time < CACHE_TTL)) ? all[key] : null;
  }

  function injectStyle() {
    var old = document.getElementById(STYLE_ID);
    if (old) old.parentNode.removeChild(old);
    var scale = getSettings().scale / 100;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.rc-wrap{text-align:left; font-size:' + scale + 'em}',
      '.rc-item{display:flex;margin:0 0 .6em 0;padding:.1em}',
      '.rc-card{background:#1b1b1b;border:1px solid #2a2a2a;border-radius:.4em;padding:.5em .8em;flex-grow:1}',
      '.rc-head{display:flex;justify-content:space-between;margin-bottom:.3em}',
      '.rc-name{font-weight:600;color:#fff}.rc-date{opacity:.6;font-size:.8em;padding-left:1em}',
      '.rc-text{color:#ddd;line-height:1.45;word-wrap:break-word}',
      '.rc-spoiler{display:inline-block;background:#3a3a3a;border-radius:.3em;padding:0 .5em;color:#fff;cursor:pointer}'
    ].join('');
    document.head.appendChild(style);
  }

  function openModal(html, title, country) {
    stopBusy();
    injectStyle();
    var fullTitle = title + (country ? ' (' + country + ')' : '');
    var body = $('<div class="rc-wrap"></div>').html(html);
    modal_open = true;
    Lampa.Modal.open({ title: fullTitle, html: body, size: 'large', mask: true, onBack: function() { modal_open = false; Lampa.Modal.close(); Lampa.Controller.toggle('content'); } });
  }

  function loadComments(id, pageUrl, title, cacheKey, country) {
    var target = getSettings().host + '/ajax/get_comments/?news_id=' + (id || '1') + '&cstart=1&skin=hdrezka';
    request(buildUrl(target, pageUrl), function (raw) {
        var json = JSON.parse(raw);
        var dom = parseHTML(json.comments);
        var root = dom.querySelector('ol.comments-tree-list');
        if (!root) { fail(Lampa.Lang.translate('rc_error_empty')); return; }
        // Базова очистка (спрощено)
        root.querySelectorAll('script, .actions').forEach(el => el.remove());
        var html = root.innerHTML;
        writeCache(cacheKey, html, title, country);
        openModal(html, title, country);
    }, function(err) { fail(Lampa.Lang.translate('rc_error_load')); });
  }

  function searchRezka(queries, index, targetNames, year, cacheKey) {
    if (index >= queries.length) { fail(Lampa.Lang.translate('rc_error_not_found')); return; }
    var target = getSettings().host + '/search/?q=' + encodeURIComponent(queries[index]);
    request(buildUrl(target), function(html) {
      var dom = parseHTML(html);
      var best = dom.querySelector(".b-content__inline_item"); // Спрощений вибір
      if (!best) { searchRezka(queries, index + 1, targetNames, year, cacheKey); return; }
      
      var link = best.querySelector('.b-content__inline_item-link a');
      var href = link ? link.getAttribute('href') : '';
      request(buildUrl(href), function(pageHtml) {
          var country = getCountryFromPage(parseHTML(pageHtml));
          loadComments(best.getAttribute('data-id'), href, queries[index], cacheKey, country);
      }, function() { loadComments(best.getAttribute('data-id'), href, queries[index], cacheKey, ''); });
    }, function() { searchRezka(queries, index + 1, targetNames, year, cacheKey); });
  }

  function addSettings() {
    Lampa.SettingsApi.addComponent({ component: COMPONENT, name: 'Rezka Комментарии', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' });
    var scaleValues = {}; for(var i=100; i<=200; i+=5) scaleValues[i] = i + '%';
    Lampa.SettingsApi.addParam({ component: COMPONENT, param: { name: 'rezka_comment_scale', type: 'select', values: scaleValues, 'default': 100 }, field: { name: 'Масштаб тексту (%)', description: 'Розмір шрифту коментарів' } });
    Lampa.SettingsApi.addParam({ component: COMPONENT, param: { name: 'rezka_comment_host', type: 'input', placeholder: DEFAULT_HOST, 'default': DEFAULT_HOST }, field: { name: 'Зеркало', description: 'Адреса hdrezka' } });
  }

  function startPlugin() {
    window[PLUGIN_FLAG] = true;
    addSettings();
    Lampa.Listener.follow('full', function (e) {
      if (e.type !== 'complite') return;
      var btn = $('<div class="full-start__button selector ' + BUTTON_CLASS + '"><span>Комментарии</span></div>');
      btn.on('hover:enter', function () {
        var m = e.data.movie;
        var cacheKey = (e.object.method === 'tv' ? 'tv_' : 'mv_') + m.id;
        var cached = readCache(cacheKey);
        if (cached) openModal(cached.html, cached.title, cached.country);
        else searchRezka([m.title, m.original_title].filter(Boolean), 0, [], m.release_date, cacheKey);
      });
      (e.object.activity.render().find('.full-start__buttons')).append(btn);
    });
  }

  if (!window[PLUGIN_FLAG]) startPlugin();
})();
