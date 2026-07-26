(function(){
  "use strict";

  // ---------- Live clock (falls back gracefully; format mirrors the mock) ----------
  var timeEl = document.getElementById('trayTime');
  var dateEl = document.getElementById('trayDate');

  function pad(n){ return n < 10 ? '0' + n : '' + n; }

  function updateClock(){
    var now = new Date();
    var h = now.getHours();
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;
    timeEl.textContent = h12 + ':' + pad(now.getMinutes()) + ' ' + ampm;
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    dateEl.textContent = months[now.getMonth()] + ' ' + now.getDate();
  }
  updateClock();
  setInterval(updateClock, 15000);

  // ---------- Settings gear micro-interaction ----------
  var gearBtn = document.getElementById('gearBtn');
  var themeToggle = document.getElementById('themeToggle');

  gearBtn.addEventListener('click', function(){
    gearBtn.classList.remove('spin');
    // force reflow so the animation can retrigger
    void gearBtn.offsetWidth;
    gearBtn.classList.add('spin');
  });

  themeToggle.addEventListener('click', function(){
    document.body.classList.toggle('dark-mode');
    var isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀' : '☾';
    themeToggle.title = isDark ? 'Mode clair' : 'Mode sombre';
  });

  // ---------- App "windows" (simple placeholder apps) ----------
  var appMeta = {
    notes:      { title: 'Notes', body: '' }, // populated dynamically, see openApp()
    terminal:   { title: 'Terminal', body: '<code>nexus@desktop:~$ _cd Projects</code>' },
    browser:    { title: 'Browser', body: "<p>Un nouvel onglet de navigation s'ouvrirait ici.</p>" },
    editor:     { title: 'Text Editor', body: '<p>Document sans titre — prêt à écrire.</p>' },
    video:      { title: 'Video', body: '<p>Lecteur vidéo — aucune lecture en cours.</p>' },
    paint:      { title: 'Paint', body: '<p>Nouvelle toile — 800 × 600 px.</p>' },
    calendar:   { title: 'Calendar', body: "<p>Aucun événement aujourd'hui.</p>" },
    recyclebin: { title: 'Recycle Bin', body: '<p>La corbeille est vide.</p>' }
  };

  var notesContent = '';

  var scrim = document.getElementById('scrim');
  var win = document.getElementById('appWindow');
  var winTitle = document.getElementById('winTitle');
  var winContent = document.getElementById('winContent');
  var startMenu = document.getElementById('startMenu');
  var dockMenuBtn = document.getElementById('dockMenuBtn');

  function isStartMenuOpen(){ return startMenu.classList.contains('open'); }

  function openApp(key){
    var meta = appMeta[key];
    if(!meta) return;
    closeStartMenu();
    winTitle.textContent = meta.title;

    if(key === 'notes'){
      winContent.innerHTML = '<textarea id="notesTextarea" placeholder="Écrivez quelque chose…" spellcheck="false"></textarea>';
      var ta = document.getElementById('notesTextarea');
      ta.value = notesContent;
      ta.addEventListener('input', function(){ notesContent = ta.value; });
      win.classList.add('open');
      scrim.classList.add('active');
      setTimeout(function(){ ta.focus(); }, 120);
      return;
    }

    winContent.innerHTML = meta.body;
    win.classList.add('open');
    scrim.classList.add('active');
  }
  function closeApp(){
    win.classList.remove('open');
    if(!isStartMenuOpen()){ scrim.classList.remove('active'); }
  }

  function openStartMenu(){
    closeApp();
    startMenu.classList.add('open');
    scrim.classList.add('active');
    dockMenuBtn.setAttribute('aria-expanded', 'true');
    var input = document.getElementById('smSearchInput');
    if(input){ setTimeout(function(){ input.focus(); }, 120); }
  }
  function closeStartMenu(){
    startMenu.classList.remove('open');
    if(!win.classList.contains('open')){ scrim.classList.remove('active'); }
    dockMenuBtn.setAttribute('aria-expanded', 'false');
  }
  function toggleStartMenu(){
    if(isStartMenuOpen()){ closeStartMenu(); } else { openStartMenu(); }
  }

  function closeAllOverlays(){
    closeApp();
    closeStartMenu();
    closeExplorer();
    if(typeof closeGalleryWindow === 'function') closeGalleryWindow();
    if(typeof closeSettingsWindow === 'function') closeSettingsWindow();
    if(typeof closeCalculatorWindow === 'function') closeCalculatorWindow();
  }

  // Dock "Nexus Menu" toggles the Start Menu instead of opening a window
  dockMenuBtn.addEventListener('click', function(){
    toggleStartMenu();
  });

  // Desktop icons + other dock items + pinned Start Menu apps open a window
  // (elements that launch dedicated apps — File Explorer, Gallery, Settings,
  // Calculator — are excluded here and wired in their own modules below)
  var DEDICATED_APPS = ['explorer', 'gallery', 'settings', 'calculator'];
  document.querySelectorAll('[data-app]').forEach(function(el){
    if(el === dockMenuBtn) return;
    if(DEDICATED_APPS.indexOf(el.getAttribute('data-app')) !== -1) return;
    el.addEventListener('click', function(){
      document.querySelectorAll('.desktop-icon.selected').forEach(function(i){ i.classList.remove('selected'); });
      if(el.classList.contains('desktop-icon')){ el.classList.add('selected'); }
      openApp(el.getAttribute('data-app'));
    });
  });

  // Power options (demo actions — no real system effect)
  function firePowerAction(label, message){
    winTitle.textContent = label;
    winContent.innerHTML = '<p>' + message + '</p>';
    closeStartMenu();
    win.classList.add('open');
    scrim.classList.add('active');
  }
  document.getElementById('smRestart').addEventListener('click', function(){
    firePowerAction('Restart', 'Redémarrage en cours… (démo, aucune action réelle)');
  });
  document.getElementById('smShutdown').addEventListener('click', function(){
    firePowerAction('Shut Down', 'Arrêt du système… (démo, aucune action réelle)');
  });
  document.getElementById('smLogout').addEventListener('click', function(){
    firePowerAction('Log Out', 'Déconnexion en cours… (démo, aucune action réelle)');
  });

  document.getElementById('winClose').addEventListener('click', closeApp);
  document.getElementById('winClose2').addEventListener('click', closeApp);
  scrim.addEventListener('click', closeAllOverlays);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeAllOverlays();
  });

  // Deselect desktop icons when clicking empty wallpaper area
  document.getElementById('wallpaper').addEventListener('click', function(){
    document.querySelectorAll('.desktop-icon.selected').forEach(function(i){ i.classList.remove('selected'); });
  });

  /* =========================================================================
     FILE EXPLORER — a small, self-contained, functional mini file manager.
     Virtual filesystem, back/forward navHistory, breadcrumb, sidebar shortcuts,
     live search, draggable + resizable + maximizable window.
  ========================================================================= */

    // ---------- Virtual filesystem ----------
    function folder(name, children){ return { type:'folder', name:name, children: children || {} }; }
    function file(name, ext){ return { type:'file', name:name, ext:ext }; }

    var fsRoot = folder('Files', {
      'Desktop':   folder('Desktop', {}),
      'Documents': folder('Documents', {
        'Projects': folder('Projects', {
          'Website':    folder('Website', {}),
          'Notes.txt':  file('Notes.txt', 'txt')
        }),
        'Reports': folder('Reports', {
          'Q1-Report.pdf': file('Q1-Report.pdf', 'pdf'),
          'Q2-Report.pdf': file('Q2-Report.pdf', 'pdf')
        }),
        'PDF.pdf':            file('PDF.pdf', 'pdf'),
        'Presentation.pptx':  file('Presentation.pptx', 'pptx'),
        'Text Editor.txt':    file('Text Editor.txt', 'txt'),
        'Archive.zip':        file('Archive.zip', 'zip')
      }),
      'Downloads': folder('Downloads', {
        'Archive.zip':     file('Archive.zip', 'zip'),
        'Installer.exe':   file('Installer.exe', 'exe')
      }),
      'Images': folder('Images', {
        'Vacation.jpg':    file('Vacation.jpg', 'img'),
        'Screenshot.png':  file('Screenshot.png', 'img')
      }),
      'Videos': folder('Videos', {
        'Clip.mp4': file('Clip.mp4', 'video')
      }),
      'Music': folder('Music', {
        'Song.mp3': file('Song.mp3', 'audio')
      })
    });

    function getNode(path){
      var node = fsRoot;
      for(var i = 0; i < path.length; i++){
        if(!node.children || !node.children[path[i]]) return null;
        node = node.children[path[i]];
      }
      return node;
    }

    // ---------- Icon glyphs ----------
    var FOLDER_COLORS = {
      Desktop:   ['#7cc0ff', '#5aa7f2'],
      Documents: ['#57d9a3', '#2fb679'],
      Downloads: ['#6fa8ff', '#3f7ce0'],
      Images:    ['#7cc0ff', '#4f9bef'],
      Videos:    ['#c79bff', '#9b6bff'],
      Music:     ['#ff9bab', '#ff5b6e'],
      Projects:  ['#ffd479', '#ffb23f'],
      Reports:   ['#ffd479', '#ffb23f'],
      Website:   ['#7cc0ff', '#5aa7f2']
    };

    function folderIconSVG(name){
      var c = FOLDER_COLORS[name] || ['#cfd6de', '#aab2bc'];
      var extra = '';
      if(name === 'Images'){
        extra = '<circle cx="19" cy="15" r="1.6" fill="#fff"/><path d="M11 24l4.5-5 3.5 4 3-3.5 4.5 5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
      }
      return '<svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">' +
        '<path d="M4 16c0-2.2 1.8-4 4-4h10l4.5 4.5H44c2.2 0 4 1.8 4 4v18c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V16z" fill="' + c[0] + '"/>' +
        '<path d="M4 19c0-2.2 1.8-4 4-4h32c2.2 0 4 1.8 4 4v17c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V19z" fill="' + c[1] + '"/>' +
        extra +
        '</svg>';
    }

    var FILE_STYLES = {
      pdf:   { bg: '#ff5f5f', label: 'PDF'  },
      pptx:  { bg: '#ff8a3d', label: 'PPT'  },
      zip:   { bg: '#ffc94a', label: 'ZIP'  },
      txt:   { bg: '#5aa7f2', label: 'TXT'  },
      img:   { bg: '#9b6bff', label: 'IMG'  },
      video: { bg: '#37b6d8', label: 'MP4'  },
      audio: { bg: '#ff5b8a', label: 'MP3'  },
      exe:   { bg: '#8a8f98', label: 'EXE'  }
    };

    function fileIconSVG(ext){
      var s = FILE_STYLES[ext] || { bg: '#9aa2ab', label: '' };
      return '<svg width="46" height="52" viewBox="0 0 46 52" aria-hidden="true">' +
        '<path d="M4 2h26l12 12v34a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#ffffff" stroke="#e3e6ea" stroke-width="1.3"/>' +
        '<path d="M30 2v10a2 2 0 0 0 2 2h10z" fill="#eef1f5"/>' +
        '<rect x="2" y="30" width="34" height="14" rx="2.5" fill="' + s.bg + '"/>' +
        '<text x="19" y="40" font-family="Arial, sans-serif" font-weight="700" font-size="10.5" fill="#ffffff" text-anchor="middle">' + s.label + '</text>' +
        (ext === 'zip' ? '<rect x="16.5" y="6" width="3" height="20" fill="#e3e6ea"/>' : '') +
        '</svg>';
    }

    function iconForNode(node){
      return node.type === 'folder' ? folderIconSVG(node.name) : fileIconSVG(node.ext);
    }

    // ---------- DOM refs ----------
    var winEl        = document.getElementById('explorerWindow');
    var titlebarEl    = document.getElementById('ewTitlebar');
    var backBtn       = document.getElementById('ewBack');
    var fwdBtn        = document.getElementById('ewFwd');
    var reloadBtn     = document.getElementById('ewReload');
    var crumbsEl      = document.getElementById('ewCrumbs');
    var crumbDropdown = document.getElementById('ewCrumbDropdown');
    var crumbMenu     = document.getElementById('ewCrumbMenu');
    var searchInput   = document.getElementById('ewSearchInput');
    var gridEl        = document.getElementById('ewGrid');
    var emptyEl       = document.getElementById('ewEmpty');
    var sidebarItems  = document.querySelectorAll('.ew-sb-item');
    var networkBtn    = document.getElementById('ewNetwork');
    var minBtn        = document.getElementById('ewMinBtn');
    var maxBtn        = document.getElementById('ewMaxBtn');
    var closeBtn      = document.getElementById('ewCloseBtn');
    var dotMin        = document.getElementById('ewDotMin');
    var dotMax        = document.getElementById('ewDotMax');
    var dotClose      = document.getElementById('ewDotClose');
    var resizeHandle  = document.getElementById('ewResizeHandle');
    var toastStack    = document.getElementById('toastStack');

    // ---------- State ----------
    var currentPath = ['Documents'];
    var navHistory = [currentPath.slice()];
    var historyIndex = 0;
    var isMaximized = false;
    var isOpen = false;

    // ---------- Toasts ----------
    function showToast(message){
      var t = document.createElement('div');
      t.className = 'toast';
      t.textContent = message;
      toastStack.appendChild(t);
      requestAnimationFrame(function(){ t.classList.add('show'); });
      setTimeout(function(){
        t.classList.remove('show');
        setTimeout(function(){ t.remove(); }, 220);
      }, 2200);
    }

    // ---------- Rendering ----------
    function renderBreadcrumb(){
      crumbsEl.innerHTML = '';
      var rootBtn = document.createElement('button');
      rootBtn.className = 'crumb' + (currentPath.length === 0 ? ' current' : '');
      rootBtn.textContent = 'Files';
      rootBtn.type = 'button';
      if(currentPath.length !== 0){
        rootBtn.addEventListener('click', function(){ navigate([]); });
      }
      crumbsEl.appendChild(rootBtn);

      currentPath.forEach(function(seg, i){
        var sep = document.createElement('span');
        sep.className = 'sep';
        sep.textContent = '›';
        crumbsEl.appendChild(sep);

        var btn = document.createElement('button');
        var isLast = i === currentPath.length - 1;
        btn.className = 'crumb' + (isLast ? ' current' : '');
        btn.type = 'button';
        btn.textContent = seg;
        if(!isLast){
          var targetPath = currentPath.slice(0, i + 1);
          btn.addEventListener('click', function(){ navigate(targetPath); });
        }
        crumbsEl.appendChild(btn);
      });
    }

    function renderCrumbMenu(){
      crumbMenu.innerHTML = '';
      var shortcuts = [
        { label: 'Files (racine)', path: [] },
        { label: 'Desktop', path: ['Desktop'] },
        { label: 'Documents', path: ['Documents'] },
        { label: 'Downloads', path: ['Downloads'] },
        { label: 'Images', path: ['Images'] },
        { label: 'Videos', path: ['Videos'] },
        { label: 'Music', path: ['Music'] }
      ];
      shortcuts.forEach(function(s){
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = s.label;
        b.addEventListener('click', function(){
          navigate(s.path);
          crumbMenu.classList.remove('open');
        });
        crumbMenu.appendChild(b);
      });
    }

    function renderSidebarActive(){
      sidebarItems.forEach(function(item){
        var nav = item.getAttribute('data-nav');
        if(nav === null) return;
        var navPath = nav === '' ? [] : [nav];
        var match = navPath.length === currentPath.length && navPath.every(function(seg, i){ return seg === currentPath[i]; });
        item.classList.toggle('active', match);
      });
    }

    function renderGrid(filterText){
      var node = getNode(currentPath);
      gridEl.innerHTML = '';
      if(!node || node.type !== 'folder'){
        emptyEl.hidden = false;
        emptyEl.textContent = 'Dossier introuvable.';
        return;
      }
      var keys = Object.keys(node.children).sort(function(a, b){
        var na = node.children[a], nb = node.children[b];
        if(na.type !== nb.type) return na.type === 'folder' ? -1 : 1;
        return a.localeCompare(b);
      });

      var q = (filterText || '').trim().toLowerCase();
      var visibleCount = 0;

      keys.forEach(function(key){
        var child = node.children[key];
        if(q && child.name.toLowerCase().indexOf(q) === -1) return;
        visibleCount++;

        var btn = document.createElement('button');
        btn.className = 'ew-item';
        btn.type = 'button';
        btn.title = child.name;

        var iconSpan = document.createElement('span');
        iconSpan.className = 'ew-item-icon';
        iconSpan.innerHTML = iconForNode(child);

        var labelSpan = document.createElement('span');
        labelSpan.className = 'ew-item-label';
        labelSpan.textContent = child.name;

        btn.appendChild(iconSpan);
        btn.appendChild(labelSpan);

        btn.addEventListener('click', function(){
          gridEl.querySelectorAll('.ew-item.selected').forEach(function(i){ i.classList.remove('selected'); });
          btn.classList.add('selected');
        });

        btn.addEventListener('dblclick', function(){
          if(child.type === 'folder'){
            navigate(currentPath.concat(key));
          } else {
            showToast('Ouverture de ' + child.name + '…');
          }
        });

        gridEl.appendChild(btn);
      });

      if(visibleCount === 0){
        emptyEl.hidden = false;
        emptyEl.textContent = q ? 'Aucun résultat pour « ' + filterText + ' ».' : 'Ce dossier est vide.';
      } else {
        emptyEl.hidden = true;
      }
    }

    function updateNavButtons(){
      backBtn.disabled = historyIndex <= 0;
      fwdBtn.disabled = historyIndex >= navHistory.length - 1;
    }

    function render(){
      renderBreadcrumb();
      renderSidebarActive();
      renderGrid(searchInput.value);
      updateNavButtons();
    }

    // ---------- Navigation ----------
    function navigate(path, opts){
      opts = opts || {};
      currentPath = path.slice();
      if(!opts.skipHistory){
        navHistory = navHistory.slice(0, historyIndex + 1);
        navHistory.push(currentPath.slice());
        historyIndex = navHistory.length - 1;
      }
      if(searchInput.value){ searchInput.value = ''; }
      render();
    }

    backBtn.addEventListener('click', function(){
      if(historyIndex <= 0) return;
      historyIndex--;
      navigate(navHistory[historyIndex], { skipHistory: true });
    });
    fwdBtn.addEventListener('click', function(){
      if(historyIndex >= navHistory.length - 1) return;
      historyIndex++;
      navigate(navHistory[historyIndex], { skipHistory: true });
    });
    reloadBtn.addEventListener('click', function(){
      reloadBtn.style.transform = 'rotate(180deg)';
      setTimeout(function(){ reloadBtn.style.transform = ''; }, 300);
      render();
    });

    sidebarItems.forEach(function(item){
      var nav = item.getAttribute('data-nav');
      if(nav === null) return;
      item.addEventListener('click', function(){
        navigate(nav === '' ? [] : [nav]);
      });
    });

    networkBtn.addEventListener('click', function(){
      showToast('Aucun appareil trouvé sur le réseau.');
    });

    searchInput.addEventListener('input', function(){
      renderGrid(searchInput.value);
    });

    crumbDropdown.addEventListener('click', function(e){
      e.stopPropagation();
      renderCrumbMenu();
      crumbMenu.classList.toggle('open');
    });
    document.addEventListener('click', function(e){
      if(!crumbMenu.contains(e.target) && e.target !== crumbDropdown){
        crumbMenu.classList.remove('open');
      }
    });

    // ---------- Open / close / minimize / maximize ----------
    function openExplorerAt(pathAttr){
      var path = (pathAttr === undefined || pathAttr === null || pathAttr === '')
        ? []
        : pathAttr.split(',').map(function(s){ return s.trim(); }).filter(Boolean);

      if(!isOpen){
        navHistory = [path.slice()];
        historyIndex = 0;
        navigate(path, { skipHistory: true });
        winEl.classList.add('open');
        isOpen = true;
      } else if(pathAttr !== undefined){
        // A specific shortcut (desktop icon / start menu) always jumps there
        navigate(path);
        winEl.classList.add('open');
        winEl.style.display = '';
      } else {
        // Clicking the dock icon again toggles minimize
        toggleMinimize();
      }
    }

    function closeExplorer(){
      if(!isOpen) return;
      winEl.classList.remove('open');
      winEl.classList.remove('maximized');
      isMaximized = false;
      isOpen = false;
      currentPath = ['Documents'];
      navHistory = [currentPath.slice()];
      historyIndex = 0;
    }

    function toggleMinimize(){
      var hidden = winEl.style.display === 'none';
      winEl.style.display = hidden ? '' : 'none';
    }

    function toggleMaximize(){
      isMaximized = !isMaximized;
      winEl.classList.toggle('maximized', isMaximized);
      if(isMaximized){
        winEl.style.left = '';
        winEl.style.top = '';
      }
    }

    minBtn.addEventListener('click', toggleMinimize);
    dotMin.addEventListener('click', toggleMinimize);
    maxBtn.addEventListener('click', toggleMaximize);
    dotMax.addEventListener('click', toggleMaximize);
    closeBtn.addEventListener('click', closeExplorer);
    dotClose.addEventListener('click', closeExplorer);

    // Wire every trigger (desktop icon, dock item, start menu app)
    document.querySelectorAll('[data-app="explorer"]').forEach(function(el){
      el.addEventListener('click', function(){
        document.querySelectorAll('.desktop-icon.selected').forEach(function(i){ i.classList.remove('selected'); });
        if(el.classList.contains('desktop-icon')){ el.classList.add('selected'); }
        var pathAttr = el.hasAttribute('data-explorer-path') ? el.getAttribute('data-explorer-path') : undefined;
        openExplorerAt(pathAttr);
        if(el.closest('#startMenu')){
          // closeStartMenu is defined in the outer scope
          var sm = document.getElementById('startMenu');
          sm.classList.remove('open');
        }
      });
    });

    // ---------- Dragging (pointer events) ----------
    var dragState = null;
    titlebarEl.addEventListener('pointerdown', function(e){
      if(e.target.closest('.ew-nav-btn, .ew-breadcrumb, .ew-search, .ew-win-controls, .ew-dot')) return;
      if(isMaximized) return;
      var rect = winEl.getBoundingClientRect();
      dragState = { startX: e.clientX, startY: e.clientY, left: rect.left, top: rect.top };
      winEl.classList.add('dragging');
      titlebarEl.classList.add('grabbing');
      titlebarEl.setPointerCapture(e.pointerId);
    });
    titlebarEl.addEventListener('pointermove', function(e){
      if(!dragState) return;
      var dx = e.clientX - dragState.startX;
      var dy = e.clientY - dragState.startY;
      var viewport = document.querySelector('.viewport').getBoundingClientRect();
      var newLeft = dragState.left + dx - viewport.left;
      var newTop = Math.max(0, dragState.top + dy - viewport.top);
      winEl.style.left = newLeft + 'px';
      winEl.style.top = newTop + 'px';
      winEl.style.transform = 'none';
    });
    function endDrag(){
      dragState = null;
      winEl.classList.remove('dragging');
      titlebarEl.classList.remove('grabbing');
    }
    titlebarEl.addEventListener('pointerup', endDrag);
    titlebarEl.addEventListener('pointercancel', endDrag);

    // ---------- Resizing ----------
    var resizeState = null;
    resizeHandle.addEventListener('pointerdown', function(e){
      if(isMaximized) return;
      var rect = winEl.getBoundingClientRect();
      resizeState = { startX: e.clientX, startY: e.clientY, width: rect.width, height: rect.height };
      resizeHandle.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });
    resizeHandle.addEventListener('pointermove', function(e){
      if(!resizeState) return;
      var dw = e.clientX - resizeState.startX;
      var dh = e.clientY - resizeState.startY;
      winEl.style.width = Math.max(520, resizeState.width + dw) + 'px';
      winEl.style.height = Math.max(320, resizeState.height + dh) + 'px';
    });
    resizeHandle.addEventListener('pointerup', function(){ resizeState = null; });
    resizeHandle.addEventListener('pointercancel', function(){ resizeState = null; });

    // Initial paint of static UI bits (in case the window opens later)
    render();

  /* =========================================================================
     GENERIC APP-FRAME CONTROLLER
     Shared drag / minimize / maximize / close behaviour for Calculator,
     Settings and Gallery windows (they all share the .app-frame markup).
  ========================================================================= */
  function createAppFrame(el, opts){
    opts = opts || {};
    var titlebar = el.querySelector('[data-drag-handle]');
    var isOpen = false;
    var isMaximized = false;

    function open(){
      if(!isOpen){
        isOpen = true;
        el.style.display = '';
        el.classList.add('open');
        if(opts.onOpen) opts.onOpen();
      } else if(el.style.display === 'none'){
        el.style.display = '';
      } else {
        toggleMinimize();
      }
    }
    function close(){
      if(!isOpen) return;
      el.classList.remove('open');
      el.classList.remove('maximized');
      isMaximized = false;
      isOpen = false;
      el.style.left = '';
      el.style.top = '';
      el.style.width = '';
      el.style.height = '';
      el.style.transform = '';
      el.style.display = '';
      if(opts.onClose) opts.onClose();
    }
    function toggleMinimize(){
      var hidden = el.style.display === 'none';
      el.style.display = hidden ? '' : 'none';
    }
    function toggleMaximize(){
      isMaximized = !isMaximized;
      el.classList.toggle('maximized', isMaximized);
      if(isMaximized){ el.style.left = ''; el.style.top = ''; }
    }

    el.querySelectorAll('[data-action]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var action = btn.getAttribute('data-action');
        if(action === 'close') close();
        else if(action === 'minimize') toggleMinimize();
        else if(action === 'maximize') toggleMaximize();
      });
    });

    var dragState = null;
    titlebar.addEventListener('pointerdown', function(e){
      if(e.target.closest('[data-action]')) return;
      if(isMaximized) return;
      var rect = el.getBoundingClientRect();
      dragState = { startX: e.clientX, startY: e.clientY, left: rect.left, top: rect.top };
      el.classList.add('dragging');
      titlebar.classList.add('grabbing');
      titlebar.setPointerCapture(e.pointerId);
    });
    titlebar.addEventListener('pointermove', function(e){
      if(!dragState) return;
      var dx = e.clientX - dragState.startX;
      var dy = e.clientY - dragState.startY;
      var viewport = document.querySelector('.viewport').getBoundingClientRect();
      el.style.left = (dragState.left + dx - viewport.left) + 'px';
      el.style.top = Math.max(0, dragState.top + dy - viewport.top) + 'px';
      el.style.transform = 'none';
    });
    function endDrag(){
      dragState = null;
      el.classList.remove('dragging');
      titlebar.classList.remove('grabbing');
    }
    titlebar.addEventListener('pointerup', endDrag);
    titlebar.addEventListener('pointercancel', endDrag);

    return { open: open, close: close, isOpenNow: function(){ return isOpen; } };
  }

  /* =========================================================================
     CALCULATOR — accumulator-based 4-function + scientific calculator with
     a history sidebar. No eval() is used anywhere.
  ========================================================================= */
  var calcExprEl     = document.getElementById('calcExpr');
  var calcValueEl    = document.getElementById('calcValue');
  var calcHistoryList  = document.getElementById('calcHistoryList');
  var calcHistoryEmpty = document.getElementById('calcHistoryEmpty');
  var calcHistoryPanel = document.getElementById('calcHistoryPanel');

  var calcAcc = null;          // accumulated value
  var calcPendingOp = null;    // '+', '-', '*', '/', 'pow'
  var calcCurrent = '';        // operand currently being typed
  var calcExprTrail = '';      // top line, e.g. "45 + "
  var calcJustEvaluated = false;
  var calcHistory = [];

  var OP_SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷', 'pow': '^' };

  function calcFmt(n){
    if(n === null || n === undefined || !isFinite(n)) return 'Erreur';
    if(Math.abs(n) < 1e-10) n = 0;
    var s = parseFloat(n.toPrecision(12)).toString();
    return s;
  }

  function calcCompute(a, b, op){
    switch(op){
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
      case 'pow': return Math.pow(a, b);
      default: return b;
    }
  }

  function calcRender(){
    calcExprEl.textContent = calcExprTrail || '\u00A0';
    calcValueEl.textContent = calcCurrent !== '' ? calcCurrent : (calcAcc !== null ? calcFmt(calcAcc) : '0');
  }

  function calcResetIfNeeded(){
    if(calcJustEvaluated){
      calcCurrent = '';
      calcExprTrail = '';
      calcAcc = null;
      calcPendingOp = null;
      calcJustEvaluated = false;
    }
  }

  function calcDigit(d){
    calcResetIfNeeded();
    if(d === '.' ){
      if(calcCurrent.indexOf('.') !== -1) return;
      calcCurrent += (calcCurrent === '' ? '0.' : '.');
    } else {
      if(calcCurrent === '0') calcCurrent = d;
      else calcCurrent += d;
    }
    calcRender();
  }

  function calcOperator(op){
    if(calcCurrent === '' && calcAcc === null) return;
    if(calcPendingOp && calcCurrent !== ''){
      calcAcc = calcCompute(calcAcc, parseFloat(calcCurrent), calcPendingOp);
    } else if(calcCurrent !== ''){
      calcAcc = parseFloat(calcCurrent);
    }
    calcPendingOp = op;
    calcExprTrail = calcFmt(calcAcc) + ' ' + OP_SYMBOLS[op] + ' ';
    calcCurrent = '';
    calcJustEvaluated = false;
    calcRender();
  }

  function calcEquals(){
    if(calcPendingOp === null || calcCurrent === '') return;
    var b = parseFloat(calcCurrent);
    var result = calcCompute(calcAcc, b, calcPendingOp);
    var fullExpr = (calcExprTrail + calcCurrent).replace(/\s+/g, ' ').trim();
    calcPushHistory(fullExpr, calcFmt(result));
    calcExprTrail = fullExpr + ' =';
    calcCurrent = calcFmt(result);
    calcAcc = null;
    calcPendingOp = null;
    calcJustEvaluated = true;
    calcRender();
  }

  function calcApplyUnary(kind){
    var x = calcCurrent !== '' ? parseFloat(calcCurrent) : (calcAcc !== null ? calcAcc : 0);
    var result, label;
    switch(kind){
      case 'sin':  result = Math.sin(x * Math.PI / 180); label = 'sin(' + calcFmt(x) + '°)'; break;
      case 'cos':  result = Math.cos(x * Math.PI / 180); label = 'cos(' + calcFmt(x) + '°)'; break;
      case 'tan':  result = Math.tan(x * Math.PI / 180); label = 'tan(' + calcFmt(x) + '°)'; break;
      case 'sq':   result = x * x; label = calcFmt(x) + '²'; break;
      case 'sqrt': result = Math.sqrt(x); label = '√(' + calcFmt(x) + ')'; break;
      case 'log':  result = Math.log(x) / Math.LN10; label = 'log(' + calcFmt(x) + ')'; break;
      case 'ln':   result = Math.log(x); label = 'ln(' + calcFmt(x) + ')'; break;
      case 'inv':  result = 1 / x; label = '1/(' + calcFmt(x) + ')'; break;
      case 'pct':  result = x / 100; label = calcFmt(x) + '%'; break;
      case 'fact':
        if(x < 0 || Math.floor(x) !== x || x > 170){ result = NaN; label = calcFmt(x) + '!'; }
        else { result = 1; for(var i = 2; i <= x; i++) result *= i; label = calcFmt(x) + '!'; }
        break;
      default: return;
    }
    if(!isFinite(result)){
      calcValueEl.textContent = 'Erreur';
      calcCurrent = '';
      calcAcc = null;
      calcPendingOp = null;
      calcExprTrail = '';
      calcJustEvaluated = true;
      return;
    }
    if(calcPendingOp !== null){
      calcCurrent = calcFmt(result);
    } else {
      calcPushHistory(label, calcFmt(result));
      calcExprTrail = '';
      calcAcc = null;
      calcCurrent = calcFmt(result);
    }
    calcJustEvaluated = (calcPendingOp === null);
    calcRender();
  }

  function calcToggleSign(){
    if(calcCurrent !== ''){
      calcCurrent = (calcCurrent.charAt(0) === '-') ? calcCurrent.slice(1) : ('-' + calcCurrent);
    } else if(calcAcc !== null){
      calcAcc = -calcAcc;
    }
    calcRender();
  }

  function calcInsertConstant(name){
    calcResetIfNeeded();
    calcCurrent = calcFmt(name === 'pi' ? Math.PI : Math.E);
    calcRender();
  }

  function calcClearAll(){
    calcAcc = null;
    calcPendingOp = null;
    calcCurrent = '';
    calcExprTrail = '';
    calcJustEvaluated = false;
    calcRender();
  }

  function calcBackspace(){
    if(calcCurrent !== ''){
      calcCurrent = calcCurrent.slice(0, -1);
      calcRender();
    }
  }

  function calcPushHistory(exprText, resultText){
    calcHistory.unshift({ expr: exprText, result: resultText });
    if(calcHistory.length > 50) calcHistory.pop();
    calcRenderHistory();
  }

  function calcRenderHistory(){
    calcHistoryList.innerHTML = '';
    if(calcHistory.length === 0){
      calcHistoryList.appendChild(calcHistoryEmpty);
      return;
    }
    calcHistory.forEach(function(entry){
      var btn = document.createElement('button');
      btn.className = 'calc-history-entry';
      btn.type = 'button';
      btn.innerHTML = '<div class="expr">' + entry.expr + ' =</div><div class="result">' + entry.result + '</div>';
      btn.addEventListener('click', function(){
        calcAcc = null;
        calcPendingOp = null;
        calcExprTrail = '';
        calcCurrent = entry.result;
        calcJustEvaluated = true;
        calcRender();
      });
      calcHistoryList.appendChild(btn);
    });
  }

  document.querySelectorAll('.calc-key[data-key]').forEach(function(btn){
    var key = btn.getAttribute('data-key');
    btn.addEventListener('click', function(){
      if(/^[0-9.]$/.test(key)) calcDigit(key);
      else if(key === '+') calcOperator('+');
      else if(key === '-') calcOperator('-');
      else if(key === '*') calcOperator('*');
      else if(key === '/') calcOperator('/');
      else if(key === '^') calcOperator('pow');
    });
  });
  document.querySelectorAll('.calc-key[data-fn]').forEach(function(btn){
    var fn = btn.getAttribute('data-fn');
    btn.addEventListener('click', function(){
      if(fn === 'neg') calcToggleSign();
      else calcApplyUnary(fn);
    });
  });
  document.querySelectorAll('.calc-key[data-const]').forEach(function(btn){
    var c = btn.getAttribute('data-const');
    btn.addEventListener('click', function(){ calcInsertConstant(c); });
  });
  document.getElementById('calcEquals').addEventListener('click', calcEquals);
  document.getElementById('calcClear').addEventListener('click', calcClearAll);
  document.getElementById('calcBackspace').addEventListener('click', calcBackspace);
  document.getElementById('calcHistoryToggle').addEventListener('click', function(){
    calcHistoryPanel.classList.toggle('collapsed');
  });
  document.getElementById('calcHistoryClose').addEventListener('click', function(){
    calcHistoryPanel.classList.add('collapsed');
  });

  calcRender();
  calcRenderHistory();

  var calcFrame = createAppFrame(document.getElementById('calcWindow'), {});
  function closeCalculatorWindow(){ calcFrame.close(); }

  /* =========================================================================
     SETTINGS — sidebar categories + a fully functional "Appearance" panel:
     real light/dark mode toggle, theme-color swatches, an HSV accent-color
     picker, and a glass-intensity slider. Other categories show a placeholder.
  ========================================================================= */
  var browserWindowEl = document.querySelector('.browser-window');
  var settingsTitleEl = document.getElementById('settingsTitle');
  var settingsPanelEl = document.getElementById('settingsPanel');
  var settingsSearchInput = document.getElementById('settingsSearchInput');
  var settingsNavItems = document.querySelectorAll('.settings-nav-item');

  var CATEGORY_LABELS = {
    appearance: 'Appearance', wallpaper: 'Wallpaper', themes: 'Themes',
    colors: 'Colors', notifications: 'Notifications', language: 'Language',
    datetime: 'Date & Time', storage: 'Storage', updates: 'System Updates', about: 'About'
  };

  var THEME_SWATCHES = ['#ff6b6b', '#ffb23f', '#ffe066', '#6fdcae', '#2fb6a8', '#4f7dff', '#9b6bff',
                         '#c0392b', '#c9701b', '#a6a61e', '#237a52', '#1f6f75', '#2e5fb3', '#5e3fae'];

  var settingsState = {
    category: 'appearance',
    theme: 'light',
    systemModeAuto: false,
    activeSwatchIndex: 5,
    accentCustom: false,
    hue: 222, sat: 0.68, val: 1,
    glassPct: 55
  };

  function clamp(v, min, max){ return Math.min(max, Math.max(min, v)); }

  function hexToRgb(hex){
    hex = hex.replace('#', '');
    return { r: parseInt(hex.substr(0,2),16), g: parseInt(hex.substr(2,2),16), b: parseInt(hex.substr(4,2),16) };
  }
  function rgbToHex(r,g,b){
    function h(n){ n = clamp(Math.round(n),0,255).toString(16); return n.length===1?'0'+n:n; }
    return '#' + h(r) + h(g) + h(b);
  }
  function darken(hex, amt){
    var c = hexToRgb(hex);
    return rgbToHex(c.r*(1-amt), c.g*(1-amt), c.b*(1-amt));
  }
  function hsvToHex(h, s, v){
    var c = v * s, x = c * (1 - Math.abs((h/60) % 2 - 1)), m = v - c;
    var r=0,g=0,b=0;
    if(h<60){ r=c;g=x;b=0; } else if(h<120){ r=x;g=c;b=0; } else if(h<180){ r=0;g=c;b=x; }
    else if(h<240){ r=0;g=x;b=c; } else if(h<300){ r=x;g=0;b=c; } else { r=c;g=0;b=x; }
    return rgbToHex((r+m)*255, (g+m)*255, (b+m)*255);
  }

  function applyAccent(hex){
    browserWindowEl.style.setProperty('--accent-color', hex);
    browserWindowEl.style.setProperty('--accent-color-strong', darken(hex, 0.18));
  }

  function setTheme(mode){
    settingsState.theme = mode;
    browserWindowEl.classList.toggle('dark-theme', mode === 'dark');
  }

  function applySystemPreference(){
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }

  function applyGlassIntensity(pct){
    settingsState.glassPct = pct;
    var blurPx = 8 + (pct / 100) * 28; // 8px .. 36px
    browserWindowEl.style.setProperty('--surface-blur', blurPx.toFixed(1) + 'px');
  }

  function buildAppearancePanel(){
    var accentHex = hsvToHex(settingsState.hue, settingsState.sat, settingsState.val);
    var swatchesHtml = THEME_SWATCHES.map(function(hex, i){
      return '<button class="settings-swatch' + (i === settingsState.activeSwatchIndex && !settingsState.accentCustom ? ' active' : '') +
             '" data-swatch-index="' + i + '" style="background:' + hex + ';" aria-label="Couleur ' + hex + '"></button>';
    }).join('');

    return '' +
      '<div class="settings-card">' +
        '<div class="settings-row">' +
          '<h4>System Mode</h4>' +
          '<button class="settings-toggle' + (settingsState.systemModeAuto ? ' on' : '') + '" id="stSystemModeToggle" aria-label="Suivre le thème système"></button>' +
        '</div>' +
        '<p class="desc">Select light/dark mode, or let NexusOS follow your system preference.</p>' +
        '<div class="settings-mode-cards" id="stModeCards" style="' + (settingsState.systemModeAuto ? 'opacity:0.5;pointer-events:none;' : '') + '">' +
          '<button class="settings-mode-card' + (settingsState.theme === 'light' ? ' active' : '') + '" data-mode="light">' +
            '<div class="settings-mode-preview light"><span></span></div><div class="label">Light</div>' +
          '</button>' +
          '<button class="settings-mode-card' + (settingsState.theme === 'dark' ? ' active' : '') + '" data-mode="dark">' +
            '<div class="settings-mode-preview dark"><span></span></div><div class="label">Dark</div>' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<div class="settings-card">' +
        '<div class="settings-row">' +
          '<div style="flex:1;">' +
            '<h4>Theme Color</h4>' +
            '<p class="desc">Select an accent color for buttons, toggles and highlights.</p>' +
            '<div class="settings-swatches">' + swatchesHtml + '</div>' +
          '</div>' +
          '<div style="width:1px;background:var(--surface-input-border);align-self:stretch;"></div>' +
          '<div style="flex:1;">' +
            '<div class="settings-row" style="margin-top:0;">' +
              '<h4>Accent Color</h4>' +
              '<button class="settings-toggle' + (settingsState.accentCustom ? ' on' : '') + '" id="stAccentToggle" aria-label="Activer la couleur personnalisée"></button>' +
            '</div>' +
            '<p class="desc">Select a custom accent color.</p>' +
            '<div class="settings-accent-picker" style="' + (settingsState.accentCustom ? '' : 'opacity:0.5;pointer-events:none;') + '">' +
              '<div class="settings-accent-sv" id="stAccentSV">' +
                '<div class="sv-white"></div><div class="sv-black"></div>' +
                '<div class="sv-thumb" id="stSvThumb"></div>' +
              '</div>' +
              '<div class="settings-hue-slider" id="stHueSlider">' +
                '<div class="hue-thumb" id="stHueThumb"></div>' +
              '</div>' +
              '<div class="settings-accent-preview">' +
                '<div class="settings-accent-swatch-preview" id="stAccentPreview" style="background:' + accentHex + ';"></div>' +
                '<button class="settings-reset-btn" id="stResetAccent" style="pointer-events:auto;">Reset Accent Color</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="settings-card">' +
        '<h4>Window Glass</h4>' +
        '<p class="desc">Adjust the blur intensity of translucent windows across GhostOS.</p>' +
        '<div class="settings-slider-row">' +
          '<input type="range" class="settings-slider" id="stGlassSlider" min="0" max="100" value="' + settingsState.glassPct + '">' +
          '<span class="settings-slider-value" id="stGlassValue">' + settingsState.glassPct + '%</span>' +
        '</div>' +
      '</div>';
  }

  function buildPlaceholderPanel(category){
    return '<div class="settings-placeholder">' +
      '<strong>' + CATEGORY_LABELS[category] + '</strong>' +
      '<span>Cette section est une démo — contenu à venir.</span>' +
    '</div>';
  }

  function bindAppearanceEvents(){
    var modeCards = document.getElementById('stModeCards');
    if(modeCards){
      modeCards.querySelectorAll('.settings-mode-card').forEach(function(card){
        card.addEventListener('click', function(){
          setTheme(card.getAttribute('data-mode'));
          renderSettingsPanel();
        });
      });
    }
    var sysToggle = document.getElementById('stSystemModeToggle');
    if(sysToggle){
      sysToggle.addEventListener('click', function(){
        settingsState.systemModeAuto = !settingsState.systemModeAuto;
        if(settingsState.systemModeAuto) applySystemPreference();
        renderSettingsPanel();
      });
    }

    document.querySelectorAll('.settings-swatch').forEach(function(sw){
      sw.addEventListener('click', function(){
        settingsState.activeSwatchIndex = parseInt(sw.getAttribute('data-swatch-index'), 10);
        settingsState.accentCustom = false;
        applyAccent(THEME_SWATCHES[settingsState.activeSwatchIndex]);
        renderSettingsPanel();
      });
    });

    var accentToggle = document.getElementById('stAccentToggle');
    if(accentToggle){
      accentToggle.addEventListener('click', function(){
        settingsState.accentCustom = !settingsState.accentCustom;
        applyAccent(settingsState.accentCustom
          ? hsvToHex(settingsState.hue, settingsState.sat, settingsState.val)
          : THEME_SWATCHES[settingsState.activeSwatchIndex]);
        renderSettingsPanel();
      });
    }

    var svEl = document.getElementById('stAccentSV');
    var svThumb = document.getElementById('stSvThumb');
    if(svEl && svThumb){
      function positionSvThumb(){
        svThumb.style.left = (settingsState.sat * 100) + '%';
        svThumb.style.top = ((1 - settingsState.val) * 100) + '%';
      }
      positionSvThumb();
      svEl.style.backgroundColor = 'hsl(' + settingsState.hue + ',100%,50%)';

      var svDragging = false;
      function updateSvFromEvent(e){
        var rect = svEl.getBoundingClientRect();
        var x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        var y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
        settingsState.sat = x;
        settingsState.val = 1 - y;
        positionSvThumb();
        if(settingsState.accentCustom){
          var hex = hsvToHex(settingsState.hue, settingsState.sat, settingsState.val);
          applyAccent(hex);
          var preview = document.getElementById('stAccentPreview');
          if(preview) preview.style.background = hex;
        }
      }
      svEl.addEventListener('pointerdown', function(e){ svDragging = true; svEl.setPointerCapture(e.pointerId); updateSvFromEvent(e); });
      svEl.addEventListener('pointermove', function(e){ if(svDragging) updateSvFromEvent(e); });
      svEl.addEventListener('pointerup', function(){ svDragging = false; });
      svEl.addEventListener('pointercancel', function(){ svDragging = false; });
    }

    var hueEl = document.getElementById('stHueSlider');
    var hueThumb = document.getElementById('stHueThumb');
    if(hueEl && hueThumb){
      function positionHueThumb(){ hueThumb.style.left = (settingsState.hue / 360 * 100) + '%'; }
      positionHueThumb();

      var hueDragging = false;
      function updateHueFromEvent(e){
        var rect = hueEl.getBoundingClientRect();
        var x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        settingsState.hue = Math.round(x * 360);
        positionHueThumb();
        if(svEl) svEl.style.backgroundColor = 'hsl(' + settingsState.hue + ',100%,50%)';
        if(settingsState.accentCustom){
          var hex = hsvToHex(settingsState.hue, settingsState.sat, settingsState.val);
          applyAccent(hex);
          var preview = document.getElementById('stAccentPreview');
          if(preview) preview.style.background = hex;
        }
      }
      hueEl.addEventListener('pointerdown', function(e){ hueDragging = true; hueEl.setPointerCapture(e.pointerId); updateHueFromEvent(e); });
      hueEl.addEventListener('pointermove', function(e){ if(hueDragging) updateHueFromEvent(e); });
      hueEl.addEventListener('pointerup', function(){ hueDragging = false; });
      hueEl.addEventListener('pointercancel', function(){ hueDragging = false; });
    }

    var resetBtn = document.getElementById('stResetAccent');
    if(resetBtn){
      resetBtn.addEventListener('click', function(){
        settingsState.hue = 222; settingsState.sat = 0.68; settingsState.val = 1;
        settingsState.accentCustom = false;
        settingsState.activeSwatchIndex = 5;
        applyAccent(THEME_SWATCHES[5]);
        renderSettingsPanel();
      });
    }

    var glassSlider = document.getElementById('stGlassSlider');
    var glassValue = document.getElementById('stGlassValue');
    if(glassSlider){
      glassSlider.addEventListener('input', function(){
        applyGlassIntensity(parseInt(glassSlider.value, 10));
        if(glassValue) glassValue.textContent = glassSlider.value + '%';
      });
    }
  }

  function renderSettingsPanel(){
    settingsTitleEl.textContent = 'Settings - ' + CATEGORY_LABELS[settingsState.category];
    if(settingsState.category === 'appearance'){
      settingsPanelEl.innerHTML = buildAppearancePanel();
      bindAppearanceEvents();
    } else {
      settingsPanelEl.innerHTML = buildPlaceholderPanel(settingsState.category);
    }
  }

  settingsNavItems.forEach(function(item){
    item.addEventListener('click', function(){
      settingsNavItems.forEach(function(i){ i.classList.remove('active'); });
      item.classList.add('active');
      settingsState.category = item.getAttribute('data-category');
      renderSettingsPanel();
    });
  });

  settingsSearchInput.addEventListener('input', function(){
    var q = settingsSearchInput.value.trim().toLowerCase();
    settingsNavItems.forEach(function(item){
      var label = CATEGORY_LABELS[item.getAttribute('data-category')].toLowerCase();
      item.classList.toggle('hidden-by-search', q !== '' && label.indexOf(q) === -1);
    });
  });

  var settingsFrame = createAppFrame(document.getElementById('settingsWindow'), {
    onOpen: function(){ renderSettingsPanel(); }
  });
  function closeSettingsWindow(){ settingsFrame.close(); }

  /* =========================================================================
     GALLERY — generative SVG "photos" (no external images needed) shown in a
     grid, with a detail preview pane: file info, zoom, prev/next navigation.
  ========================================================================= */
  function gSvg(inner){
    return '<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">' + inner + '</svg>';
  }

  function landscapeArt(uid, skyA, skyB, mtn1, mtn2, water){
    return gSvg(
      '<defs><linearGradient id="sky' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + skyA + '"/><stop offset="100%" stop-color="' + skyB + '"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#sky' + uid + ')"/>' +
      '<circle cx="320" cy="65" r="28" fill="#fff6d0" opacity="0.9"/>' +
      '<path d="M0,190 L90,90 L160,180 L230,80 L400,200 L400,300 L0,300 Z" fill="' + mtn1 + '"/>' +
      '<path d="M0,230 L120,150 L210,220 L320,140 L400,240 L400,300 L0,300 Z" fill="' + mtn2 + '"/>' +
      '<rect y="228" width="400" height="72" fill="' + water + '" opacity="0.5"/>'
    );
  }

  function urbanArt(uid, skyA, skyB, palette){
    var heights = [90, 145, 70, 165, 110, 185, 95, 130];
    var bars = '';
    var x = 0;
    var w = 400 / heights.length;
    heights.forEach(function(h, i){
      var color = palette[i % palette.length];
      bars += '<rect x="' + x.toFixed(1) + '" y="' + (300 - h) + '" width="' + (w - 4).toFixed(1) + '" height="' + h + '" fill="' + color + '"/>';
      for(var wy = 300 - h + 10; wy < 295; wy += 16){
        for(var wx = x + 6; wx < x + w - 10; wx += 14){
          bars += '<rect x="' + wx.toFixed(1) + '" y="' + wy + '" width="5" height="7" fill="#ffe9a8" opacity="0.85"/>';
        }
      }
      x += w;
    });
    return gSvg(
      '<defs><linearGradient id="usky' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + skyA + '"/><stop offset="100%" stop-color="' + skyB + '"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#usky' + uid + ')"/>' + bars
    );
  }

  function abstractArt(c1, c2, c3, c4){
    return gSvg(
      '<rect width="400" height="300" fill="' + c1 + '"/>' +
      '<circle cx="95" cy="90" r="70" fill="' + c2 + '" opacity="0.85"/>' +
      '<rect x="200" y="40" width="150" height="150" fill="' + c3 + '" opacity="0.8" transform="rotate(18 280 120)"/>' +
      '<polygon points="60,260 180,180 300,270" fill="' + c4 + '" opacity="0.85"/>' +
      '<circle cx="330" cy="230" r="38" fill="' + c2 + '" opacity="0.6"/>'
    );
  }

  var PHOTOS = [
    { name: 'Lakeside Peaks.jpg',    category: 'Landscape', w: 3840, h: 2160, size: '4.2 MB', date: '12 Mar 2026', art: landscapeArt('a', '#7cc0ff', '#bfe6ff', '#2f6b46', '#3f8f5f', '#4fa3f7') },
    { name: 'Golden Ridgeline.jpg',  category: 'Landscape', w: 5184, h: 3456, size: '6.1 MB', date: '02 Apr 2026', art: landscapeArt('b', '#ffb677', '#ffe2b0', '#7a4a2a', '#a5673a', '#ffb23f') },
    { name: 'Emerald Valley.jpg',    category: 'Landscape', w: 4032, h: 3024, size: '5.0 MB', date: '18 May 2026', art: landscapeArt('c', '#9be8c8', '#e4fff2', '#2f6b3f', '#3fa25a', '#37d67a') },
    { name: 'Twilight Skyline.jpg',  category: 'Urban',     w: 4000, h: 2667, size: '3.8 MB', date: '27 Jan 2026', art: urbanArt('d', '#3a3f6b', '#c96b9c', ['#2b2f4a', '#38406f', '#242844']) },
    { name: 'Downtown Grid.jpg',     category: 'Urban',     w: 3600, h: 2400, size: '3.1 MB', date: '09 Feb 2026', art: urbanArt('e', '#4f7dff', '#a7c4ff', ['#2f3a5c', '#3a4a78', '#26314f']) },
    { name: 'Neon District.jpg',     category: 'Urban',     w: 4200, h: 2800, size: '4.5 MB', date: '30 Jun 2026', art: urbanArt('f', '#241b3a', '#7b3fae', ['#241b3a', '#3a2a5c', '#2c2148']) },
    { name: 'Chroma Drift.jpg',      category: 'Abstract',  w: 3000, h: 3000, size: '2.6 MB', date: '15 Jul 2026', art: abstractArt('#ff6b6b', '#ffe066', '#4f7dff', '#2fb6a8') },
    { name: 'Fractured Bloom.jpg',   category: 'Abstract',  w: 3000, h: 3000, size: '2.9 MB', date: '21 Jul 2026', art: abstractArt('#9b6bff', '#ffb23f', '#37d67a', '#ff5c9c') },
    { name: 'Prism Fold.jpg',        category: 'Abstract',  w: 3200, h: 2400, size: '3.0 MB', date: '05 Jul 2026', art: abstractArt('#2fb6a8', '#ffe066', '#ff6b6b', '#4f7dff') },
    { name: 'Alpine Mirror.jpg',     category: 'Landscape', w: 4500, h: 3000, size: '5.4 MB', date: '11 Jun 2026', art: landscapeArt('g', '#a7c4ff', '#eaf3ff', '#3a4a6b', '#556f9c', '#7cc0ff') },
    { name: 'Harborfront.jpg',       category: 'Urban',     w: 3840, h: 2560, size: '4.0 MB', date: '19 Mar 2026', art: urbanArt('h', '#6fa8ff', '#ffe9c9', ['#33507a', '#3f6494', '#2a415f']) },
    { name: 'Vaporwave Grid.jpg',    category: 'Abstract',  w: 2800, h: 2800, size: '2.4 MB', date: '01 Jul 2026', art: abstractArt('#ff8ac9', '#7cf0ff', '#ffe066', '#9b6bff') }
  ];

  var galleryGrid = document.getElementById('galleryGrid');
  var galleryPreviewImage = document.getElementById('galleryPreviewImage');
  var galleryPreviewInfo = document.getElementById('galleryPreviewInfo');
  var galleryZoomLabel = document.getElementById('galleryZoomLabel');
  var galleryIndex = 0;
  var galleryZoom = 100;
  var galleryInitialized = false;

  function galleryRenderGrid(){
    galleryGrid.innerHTML = '';
    PHOTOS.forEach(function(photo, i){
      var btn = document.createElement('button');
      btn.className = 'gallery-thumb' + (i === galleryIndex ? ' active' : '');
      btn.type = 'button';
      btn.innerHTML = '<span class="thumb-art">' + photo.art + '</span><span class="thumb-label">' + photo.name + '</span>';
      btn.addEventListener('click', function(){ galleryShow(i); });
      galleryGrid.appendChild(btn);
    });
  }

  function galleryShow(index){
    galleryIndex = (index + PHOTOS.length) % PHOTOS.length;
    var photo = PHOTOS[galleryIndex];

    galleryGrid.querySelectorAll('.gallery-thumb').forEach(function(el, i){
      el.classList.toggle('active', i === galleryIndex);
    });

    galleryPreviewImage.innerHTML = photo.art;
    galleryPreviewInfo.innerHTML =
      '<strong>' + photo.name + '</strong>' +
      photo.category + '<br>' +
      photo.w + ' × ' + photo.h + '<br>' +
      photo.size + ' • ' + photo.date;

    galleryZoom = 100;
    galleryPreviewImage.style.transform = 'scale(1)';
    galleryZoomLabel.textContent = '100%';
  }

  document.getElementById('galleryPrev').addEventListener('click', function(){ galleryShow(galleryIndex - 1); });
  document.getElementById('galleryNext').addEventListener('click', function(){ galleryShow(galleryIndex + 1); });
  document.getElementById('galleryZoomIn').addEventListener('click', function(){
    galleryZoom = clamp(galleryZoom + 25, 50, 300);
    galleryPreviewImage.style.transform = 'scale(' + (galleryZoom / 100) + ')';
    galleryZoomLabel.textContent = galleryZoom + '%';
  });
  document.getElementById('galleryZoomOut').addEventListener('click', function(){
    galleryZoom = clamp(galleryZoom - 25, 50, 300);
    galleryPreviewImage.style.transform = 'scale(' + (galleryZoom / 100) + ')';
    galleryZoomLabel.textContent = galleryZoom + '%';
  });

  var galleryFrame = createAppFrame(document.getElementById('galleryWindow'), {
    onOpen: function(){
      if(!galleryInitialized){
        galleryRenderGrid();
        galleryShow(0);
        galleryInitialized = true;
      }
    }
  });
  function closeGalleryWindow(){ galleryFrame.close(); }

  /* ---------- Wire dedicated-app triggers (desktop icons, dock, start menu) ---------- */
  var DEDICATED_FRAMES = { gallery: galleryFrame, settings: settingsFrame, calculator: calcFrame };
  document.querySelectorAll('[data-app="gallery"], [data-app="settings"], [data-app="calculator"]').forEach(function(el){
    el.addEventListener('click', function(){
      document.querySelectorAll('.desktop-icon.selected').forEach(function(i){ i.classList.remove('selected'); });
      if(el.classList.contains('desktop-icon')){ el.classList.add('selected'); }
      DEDICATED_FRAMES[el.getAttribute('data-app')].open();
      var sm = document.getElementById('startMenu');
      if(el.closest('#startMenu')) sm.classList.remove('open');
    });
  });

})();