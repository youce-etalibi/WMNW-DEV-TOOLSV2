document.addEventListener('DOMContentLoaded', () => {



    const toastEl = document.getElementById('toast');
    let toastTimeout;

    const showToast = (message, duration = 3000) => {
        clearTimeout(toastTimeout);
        toastEl.textContent = message;
        toastEl.classList.add('show');
        toastTimeout = setTimeout(() => toastEl.classList.remove('show'), duration);
    };

    const setRgbVars = () => {
        const style = getComputedStyle(document.body);
        const bgElevated = style.getPropertyValue('--bg-elevated').trim();
        if (bgElevated.startsWith('#')) {
            const r = parseInt(bgElevated.substring(1, 3), 16);
            const g = parseInt(bgElevated.substring(3, 5), 16);
            const b = parseInt(bgElevated.substring(5, 7), 16);
            document.documentElement.style.setProperty('--bg-elevated-rgb', `${r}, ${g}, ${b}`);
        }
    };




    const lightThemeBtn = document.getElementById('theme-light');
    const darkThemeBtn = document.getElementById('theme-dark');

    const applyTheme = (theme) => {
        document.body.classList.toggle('light', theme === 'light');
        lightThemeBtn.classList.toggle('active', theme === 'light');
        darkThemeBtn.classList.toggle('active', theme === 'dark');
        localStorage.setItem('theme', theme);
        setRgbVars();
    };

    lightThemeBtn.addEventListener('click', () => applyTheme('light'));
    darkThemeBtn.addEventListener('click', () => applyTheme('dark'));
    
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(savedTheme);



    const setupTabs = (tabSelector, panelSelector, activeClass = 'active') => {
        const tabs = document.querySelectorAll(tabSelector);
        const panels = document.querySelectorAll(panelSelector);

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = document.querySelector(tab.dataset.target || tab.dataset.dnsTarget);
                
                tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
                tab.setAttribute('aria-selected', 'true');

                panels.forEach(panel => panel.classList.remove(activeClass));
                if (target) target.classList.add(activeClass);
            });
        });
    };

    setupTabs('.main-tabs .tab', '.panel[role="tabpanel"]');
    setupTabs('#panel-spamhaus .spamhaus-tabs .tab', '#panel-spamhaus .spamhaus-content .panel');

    
    const dnsPanel = document.getElementById('panel-dns');
    const encryptorPanel = document.getElementById('panel-encryptor');

    const injectDnsContent = () => {
        dnsPanel.innerHTML = `
            <h2 class="card-title">DNS Record Generator</h2>
            <div class="tabs dns-tabs" role="tablist">
                <button class="tab" aria-selected="true" data-dns-target="#dns-a">A Record</button>
                <button class="tab" aria-selected="false" data-dns-target="#dns-mx">MX Record</button>
                <button class="tab" aria-selected="false" data-dns-target="#dns-spfip">SPF by IP</button>
                <button class="tab" aria-selected="false" data-dns-target="#dns-spfdomain">SPF by Domain</button>
                <button class="tab" aria-selected="false" data-dns-target="#dns-dmarc">DMARC</button>
            </div>
            <div class="dns-content">
                <div id="dns-a" class="panel active" data-dns-tool="a">${createDnsToolHtml('a', 'Arecords:ip;ip', {domains: 'example.com\nexample.net', subdomains: '@\napi', ips: '192.0.2.10\n198.51.100.12'})}</div>
                <div id="dns-mx" class="panel" data-dns-tool="mx">${createDnsToolHtml('mx', 'MXrecords:ip;ip', {})}</div>
                <div id="dns-spfip" class="panel" data-dns-tool="spfip">${createDnsToolHtml('spfip', 'v=spf1 ip4:... -all', {})}</div>
                <div id="dns-spfdomain" class="panel" data-dns-tool="spfdomain">${createDnsToolHtml('spfdomain', 'v=spf1 include:a.com -all', {includes: ''})}</div>
                <div id="dns-dmarc" class="panel" data-dns-tool="dmarc">
                    <fieldset class="form-group">
                        <legend>DMARC Policy</legend>
                        <div class="segmented-control" role="group" aria-label="DMARC mode">
                            <button data-dmarc-mode="reject" aria-pressed="true">Reject</button>
                            <button data-dmarc-mode="quarantine" aria-pressed="false">Quarantine</button>
                        </div>
                    </fieldset>
                    <div class="content-grid"><div class="form-group"><label for="dmarc-domains">Domains</label><textarea id="dmarc-domains" data-input="domains" placeholder="example.com"></textarea></div></div>
                    <div class="btn-group">
                        <button class="btn btn--primary" data-action="generate">Generate</button>
                        <button class="btn btn--secondary" data-action="clear" title="Clear inputs"><svg><use href="#icon-clear"></use></svg> Clear</button>
                    </div>
                    <div class="output-area is-empty" data-output="dmarc" aria-live="polite">
                        <div class="output-area__toolbar"><button class="btn btn--success" data-action="copy"><svg><use href="#icon-copy"></use></svg>Copy</button><button class="btn btn--secondary" data-action="download" data-filename="dmarc.txt"><svg><use href="#icon-download"></use></svg>Download</button></div>
                        <span>DMARC records will appear here...</span>
                    </div>
                </div>
            </div>
        `;
        setupTabs('#panel-dns .dns-tabs .tab', '#panel-dns .dns-content .panel');
    };
    
    const createDnsToolHtml = (id, hint, fields) => {
        const hasIncludes = 'includes' in fields;
        const hasIps = !hasIncludes;
        return `
            <div class="content-grid">
                <div class="form-group"><label for="${id}-domains">Domains (one/line)</label><textarea id="${id}-domains" data-input="domains" placeholder="${fields.domains || ''}"></textarea></div>
                <div class="form-group"><label for="${id}-subdomains">Subdomains (one/line)</label><textarea id="${id}-subdomains" data-input="subdomains" placeholder="${fields.subdomains || ''}"></textarea></div>
                ${hasIps ? `<div class="form-group"><label for="${id}-ips">IPs (one/line)</label><textarea id="${id}-ips" data-input="ips" placeholder="${fields.ips || ''}"></textarea></div>` : ''}
                ${hasIncludes ? `<div class="form-group"><label for="${id}-includes">Include Domains (one/line)</label><textarea id="${id}-includes" data-input="includes"></textarea></div>` : ''}
            </div>
            <div class="btn-group">
                <button class="btn btn--primary" data-action="generate">Generate</button>
                <button class="btn btn--secondary" data-action="clear" title="Clear inputs"><svg><use href="#icon-clear"></use></svg> Clear</button>
                <span class="input-hint">Format: <code>${hint}</code></span>
            </div>
            <div class="output-area is-empty" data-output="${id}" aria-live="polite">
                <div class="output-area__toolbar">
                    <button class="btn btn--success" data-action="copy"><svg><use href="#icon-copy"></use></svg>Copy</button>
                    <button class="btn btn--secondary" data-action="download" data-filename="${id}-records.txt"><svg><use href="#icon-download"></use></svg>Download</button>
                </div>
                <span>${id.toUpperCase()} Records will appear here...</span>
            </div>
        `;
    };

    const injectEncryptorContent = () => {
        encryptorPanel.innerHTML = `
            <div class="content-grid">
                <div class="form-section">
                    <h2 class="card-title">Decrypt an Encrypted Link</h2>
                    <div class="form-group"><label for="enc-in">Encrypted link</label><input type="text" id="enc-in" placeholder="Paste encrypted link here..."/></div>
                    <div class="btn-group"><button class="btn btn--primary" id="btn-decrypt">Decrypt</button><span class="input-hint">Uses a custom character map.</span></div>
                    <div class="output-area is-empty" id="dec-out" aria-live="polite">
                        <div class="output-area__toolbar"><button class="btn btn--success" data-action="copy-direct" data-copy-target="dec-out"><svg><use href="#icon-copy"></use></svg>Copy</button></div>
                        <span>Decrypted result will appear here...</span>
                    </div>
                    <div id="entity-out" class="input-hint"></div>
                </div>
                <div class="form-section">
                    <h2 class="card-title">Encrypt a Plain Link</h2>
                    <div class="form-group"><label for="plain-in">Plain link / hash</label><input type="text" id="plain-in" placeholder="Paste plain link or hash here..."/></div>
                    <div class="btn-group"><button class="btn btn--primary" id="btn-encrypt">Encrypt</button></div>
                    <div class="output-area is-empty" id="enc-out" aria-live="polite">
                        <div class="output-area__toolbar"><button class="btn btn--success" data-action="copy-direct" data-copy-target="enc-out"><svg><use href="#icon-copy"></use></svg>Copy</button></div>
                        <span>Encrypted result will appear here...</span>
                    </div>
                </div>
            </div>
        `;
    };
    
    injectDnsContent();
    injectEncryptorContent();


   
    const dnsGenerators = {
        a: (i) => i.domains.map((d,idx) => `${d},${i.subdomains[idx]||''},TXT,Arecords:${i.ips.join(';')}`),
        mx: (i) => i.domains.map((d,idx) => `${d},${i.subdomains[idx]||''},TXT,MXrecords:${i.ips.join(';')}`),
        spfip: (i) => i.domains.map((d,idx) => `${d},${i.subdomains[idx]||''},TXT,"v=spf1 ${i.ips.map(ip=>`ip4:${ip}`).join(' ')} -all"`),
        spfdomain: (i) => i.domains.map((d,idx) => `${d},${i.subdomains[idx]||''},TXT,"v=spf1 ${i.includes.map(dm=>`include:${dm}`).join(' ')} -all"`),
        dmarc: (i) => {
            const mode = dnsPanel.querySelector('[data-dmarc-mode][aria-pressed="true"]').dataset.dmarcMode;
            return i.domains.map(d => mode === 'quarantine'
                ? `${d},_dmarc.${d},TXT,v=DMARC1; p=quarantine; rua=mailto:${d}; ruf=mailto:${d}; fo=1`
                : `${d},_dmarc.${d},TXT,"v=DMARC1; p=reject; rua=mailto:dmarc@${d}; ruf=mailto:dmarc@${d}; adkim=r; aspf=s; pct=100; rf=afrf; ri=86400; sp=reject"`
            );
        }
    };
    
    dnsPanel.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        if (btn.hasAttribute('data-dmarc-mode')) {
             dnsPanel.querySelectorAll('[data-dmarc-mode]').forEach(b => b.setAttribute('aria-pressed', 'false'));
             btn.setAttribute('aria-pressed', 'true');
             return;
        }

        const action = btn.dataset.action;
        if (!action) return;

        const toolContainer = btn.closest('[data-dns-tool]');
        const toolId = toolContainer.dataset.dnsTool;
        const outputEl = toolContainer.querySelector('[data-output]');

        const getOutputText = (el) => el.querySelector('span')?.textContent || '';
        const setOutputText = (el, text, placeholder) => {
            const span = el.querySelector('span');
            if (text) { span.textContent = text; el.classList.remove('is-empty'); }
            else { span.textContent = placeholder; el.classList.add('is-empty'); }
        };

        if (action === 'generate') {
            const inputs = {};
            toolContainer.querySelectorAll('[data-input]').forEach(i => { inputs[i.dataset.input] = i.value.trim().split('\n').filter(Boolean); });
            if (Object.values(inputs).some(v => v.length === 0)) { showToast('Please fill in all required fields.'); return; }
            setOutputText(outputEl, dnsGenerators[toolId](inputs).join('\n'), `${toolId.toUpperCase()} records will appear here...`);
        } else if (action === 'clear') {
            toolContainer.querySelectorAll('[data-input]').forEach(el => el.value = '');
            setOutputText(outputEl, '', `${toolId.toUpperCase()} records will appear here...`);
        } else if (action === 'copy') {
            const text = getOutputText(outputEl);
            if (!text || outputEl.classList.contains('is-empty')) { showToast('Nothing to copy'); return; }
            navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!'));
        } else if (action === 'download') {
            const text = getOutputText(outputEl);
            if (!text || outputEl.classList.contains('is-empty')) { showToast('Nothing to download'); return; }
            const blob = new Blob([text], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = btn.dataset.filename || 'records.txt';
            a.click();
            URL.revokeObjectURL(a.href);
        }
    });

    encryptorPanel.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const decryptionMap = { a:'_', b:'0', c:'1', d:'2', e:'3', f:'4', g:'5', h:'6', i:'7', j:'8', k:'9' };
        const encryptionMap = Object.fromEntries(Object.entries(decryptionMap).map(([k, v]) => [v, k]));
        const entityMap = { 9:"EMS1",13:"VMS1",19:"ECM3",22:"ECM2",25:"TSS1",26:"EMK1",27:"EMK2",28:"EMS2",32:"EMH",34:"EMI",38:"VMS4",40:"TSS2",41:"ECM4",43:"EMS3",50:"VMS2",51:"TSS3",53:"VMS3",54:"CMH2",55:"CMH3",56:"CMH4",57:"CMH5",58:"CMH6",59:"CMH7",60:"CMH8",62:"CMH9",63:"CMH1",64:"CMHFO",66:"WMP",67:"EMT",68:"EMS4",69:"VMS5",70:"TSS4",71:"ECM5",72:"WMN1",73:"WMN2",74:"CMHW",75:"EMK3",76:"EMS5",77:"ECM6",78:"WMN3",79:"WMN4",80:"WMN",81:"WMNW",82:"WMN5",83:"EMS6",84:"EMK4",85:"CMH10",86:"CMH11",88:"CMHM",89:"DMS",90:"CMH12",91:"CMH13",92:"CMH14",93:"TSSW",94:"TSSH",96:"WMN6",97:"ECM7" };
        
        const setOutputText = (el, text, placeholder) => {
            const span = el.querySelector('span');
            if (text) { span.textContent = text; el.classList.remove('is-empty'); }
            else { span.textContent = placeholder; el.classList.add('is-empty'); }
        };

        if (btn.id === 'btn-decrypt') {
            const input = document.getElementById('enc-in').value.trim();
            const decOut = document.getElementById('dec-out');
            const entityOut = document.getElementById('entity-out');
            const hashPart = input.split('#qs=r-')[1];
            if (!hashPart) {
                setOutputText(decOut, 'Invalid encrypted link.', 'Decrypted result will appear here...');
                entityOut.textContent = '';
                return;
            }
            const decryptedHash = [...hashPart].map(ch => decryptionMap[ch] ?? ch).join('');
            const output = '6ttps://80s352o49oy31sy633m40z25.0lo0.1or3.w7n2ows.n3t/80s352o49oy31sy633m40z25/M6.6tml#qs=r-' + decryptedHash;
            setOutputText(decOut, output, 'Decrypted result will appear here...');
            const code = parseInt(decryptedHash.split('_')[9], 10);
            entityOut.textContent = entityMap[code] ? `Entity Found: ${entityMap[code]}` : 'Entity: Unknown';
        } else if (btn.id === 'btn-encrypt') {
            const input = document.getElementById('plain-in').value;
            const encOut = document.getElementById('enc-out');
            const base = 'https://jbsegdofkoyecsyheemfbzdg.blob.core.windows.net/jbsegdofkoyecsyheemfbzdg/Mh.html#qs=r-';
            const encryptedHash = [...input].map(ch => encryptionMap[ch] ?? ch).join('');
            setOutputText(encOut, base + encryptedHash, 'Encrypted result will appear here...');
        } else if (btn.dataset.action === 'copy-direct') {
            const targetEl = document.getElementById(btn.dataset.copyTarget);
            const text = targetEl.querySelector('span')?.textContent || '';
            if (!text || targetEl.classList.contains('is-empty')) { showToast('Nothing to copy'); return; }
            navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!'));
        }
    });




    const gmailPanel = document.getElementById('panel-gmail');
    if (gmailPanel) {
        const emailEl = gmailPanel.querySelector('#email');
        const passEl = gmailPanel.querySelector('#apppass');
        const startEl = gmailPanel.querySelector('#start');
        const countEl = gmailPanel.querySelector('#count');
        const folderEl = gmailPanel.querySelector('#folder');
        const extractBtn = gmailPanel.querySelector('#extract-btn');
        const loader = gmailPanel.querySelector('#loader');
        const tableHead = gmailPanel.querySelector('#tableHead');
        const tableBody = gmailPanel.querySelector('#tableBody');
        const resultsActions = gmailPanel.querySelector('#results-actions');
        const passwordToggle = gmailPanel.querySelector('#password-toggle');
        const eyeIcon = gmailPanel.querySelector('#eye-icon');

        const paramList = ["From", "Subject", "Date", "Message-ID", "From Email", "From Domain", "IP", "SPF", "DKIM", "DMARC", "Return Path", "To", "CC", "Content-Type", "List-Unsubscribe", "Sender"];
        const choices = new Choices('#params', {
            removeItemButton: true,
            choices: paramList.map(p => ({ value: p, label: p, selected: ["From", "Subject", "Date", "Message-ID"].includes(p) }))
        });

        const toggleLoading = (isLoading) => {
            extractBtn.disabled = isLoading;
            extractBtn.querySelector('span').textContent = isLoading ? 'Extracting...' : 'Extract Emails';
            loader.classList.toggle('active', isLoading);
        };
        
        const extractEmails = async () => {
            const params = choices.getValue(true);
            if (!emailEl.value || !passEl.value || params.length === 0) {
                showToast('Please fill in email, password, and select parameters.');
                return;
            }
            toggleLoading(true);
            try {
                const response = await fetch('/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: emailEl.value,
                        pass: passEl.value,
                        start: startEl.value,
                        count: countEl.value,
                        folder: folderEl.value,
                        params
                    })
                });
                const data = await response.json();
                if (!response.ok || data.error) { throw new Error(data.error || 'An unknown error occurred.'); }
                renderTable(data.headers, data.rows);
                showToast('Emails extracted successfully!');
            } catch (err) {
                showToast(`Error: ${err.message}`);
                renderTable([], []);
            } finally {
                toggleLoading(false);
            }
        };

        const renderTable = (headers, rows) => {
            tableHead.innerHTML = '';
            tableBody.innerHTML = '';
            resultsActions.innerHTML = '';
            resultsActions.classList.remove('active');

            if (headers.length === 0 || rows.length === 0) {
                tableBody.innerHTML = `<tr class="placeholder-row"><td colspan="1">${headers.length > 0 ? 'No emails found.' : 'Results will appear here.'}</td></tr>`;
                return;
            }

            headers.forEach(h => { tableHead.appendChild(document.createElement('th')).innerText = h; });
            rows.forEach(row => {
                const tr = tableBody.appendChild(document.createElement('tr'));
                headers.forEach(h => { tr.appendChild(document.createElement('td')).innerText = row[h] || ''; });
            });
            
            headers.forEach(header => {
                const btn = document.createElement('button');
                btn.className = 'btn btn--secondary';
                btn.innerHTML = `<svg><use href="#icon-copy"></use></svg> Copy ${header}`;
                btn.addEventListener('click', () => copyColumn(header));
                resultsActions.appendChild(btn);
            });
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn btn--secondary';
            downloadBtn.innerHTML = `<svg><use href="#icon-download"></use></svg> Download CSV`;
            downloadBtn.addEventListener('click', downloadCSV);
            resultsActions.appendChild(downloadBtn);
            resultsActions.classList.add('active');
        };

        const copyColumn = (colName) => {
            const idx = Array.from(tableHead.children).findIndex(th => th.innerText === colName);
            if (idx === -1) return showToast('Column not found.');
            const text = Array.from(tableBody.querySelectorAll('tr')).map(row => row.children[idx]?.innerText || '').join('\n');
            navigator.clipboard.writeText(text).then(() => showToast(`Copied "${colName}" column!`));
        };

        const downloadCSV = () => {
            const headers = Array.from(tableHead.children).map(th => th.innerText);
            if (headers.length === 0) return showToast('No data to download.');
            const rows = Array.from(tableBody.querySelectorAll('tr')).map(tr => Array.from(tr.children).map(td => `"${(td.innerText || '').replace(/"/g, '""')}"`));
            const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "gmail_extract.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };

        extractBtn.addEventListener('click', extractEmails);
        passwordToggle.addEventListener('click', () => {
            const isPassword = passEl.type === 'password';
            passEl.type = isPassword ? 'text' : 'password';
            eyeIcon.querySelector('use').setAttribute('href', isPassword ? '#icon-eye-off' : '#icon-eye');
        });
    }

    // ========================================
    // Spamhaus Reputation Checker
    // ========================================
    const spamhausPanel = document.getElementById('panel-spamhaus');
    if (spamhausPanel) {
        // State management
        let allDomainResults = [];
        let allIpResults = [];
        let domainSortState = { column: 'domain', direction: 'asc' };
        let ipSortState = { column: 'ip', direction: 'asc' };

        // Element references
        const domainInput = document.getElementById('spamhaus-domain-input');
        const domainCheckBtn = document.getElementById('spamhaus-check-domain');
        const domainClearBtn = document.getElementById('spamhaus-clear-domain');
        const domainExportBtn = document.getElementById('spamhaus-export-domain');
        const domainProgress = document.getElementById('spamhaus-domain-progress');
        const domainProgressBar = document.getElementById('spamhaus-domain-progress-bar');
        const domainProgressText = document.getElementById('spamhaus-domain-progress-text');
        const domainFilter = document.getElementById('spamhaus-domain-filter');
        const domainFilterInput = document.getElementById('spamhaus-domain-filter-input');
        const domainResults = document.getElementById('spamhaus-domain-results');
        const domainTbody = document.getElementById('spamhaus-domain-tbody');

        const ipInput = document.getElementById('spamhaus-ip-input');
        const ipCategory = document.getElementById('spamhaus-ip-category');
        const ipCheckBtn = document.getElementById('spamhaus-check-ip');
        const ipClearBtn = document.getElementById('spamhaus-clear-ip');
        const ipExportBtn = document.getElementById('spamhaus-export-ip');
        const ipProgress = document.getElementById('spamhaus-ip-progress');
        const ipProgressBar = document.getElementById('spamhaus-ip-progress-bar');
        const ipProgressText = document.getElementById('spamhaus-ip-progress-text');
        const ipFilter = document.getElementById('spamhaus-ip-filter');
        const ipFilterInput = document.getElementById('spamhaus-ip-filter-input');
        const ipResults = document.getElementById('spamhaus-ip-results');
        const ipTbody = document.getElementById('spamhaus-ip-tbody');

        // Utility functions
        const sleep = ms => new Promise(r => setTimeout(r, ms));

        const updateProgress = (progressBar, progressText, current, total) => {
            const percentage = total > 0 ? (current / total) * 100 : 0;
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${current} / ${total}`;
        };

        // Domain checking
        const fetchDomainReputation = async (domain) => {
            try {
                const response = await fetch(`/api/check?domain=${encodeURIComponent(domain)}`);
                if (!response.ok) throw new Error((await response.json()).message || `Server responded with status: ${response.status}`);
                const result = await response.json();
                const resultIndex = allDomainResults.findIndex(r => r.domain === domain);
                if (resultIndex !== -1) allDomainResults[resultIndex] = { ...result.data, status: 'success' };
            } catch (error) {
                console.error(`Fetch for ${domain} failed:`, error);
                const resultIndex = allDomainResults.findIndex(r => r.domain === domain);
                if (resultIndex !== -1) {
                    allDomainResults[resultIndex].status = 'error';
                    allDomainResults[resultIndex].error = error.message;
                }
            }
        };

        const renderDomainTable = () => {
            const filterText = domainFilterInput.value.toLowerCase();
            const filteredResults = allDomainResults.filter(res => res.domain.toLowerCase().includes(filterText));

            filteredResults.sort((a, b) => {
                const valA = a[domainSortState.column];
                const valB = b[domainSortState.column];
                if (valA < valB) return domainSortState.direction === 'asc' ? -1 : 1;
                if (valA > valB) return domainSortState.direction === 'asc' ? 1 : -1;
                return 0;
            });

            domainTbody.innerHTML = '';
            filteredResults.forEach(res => {
                let statusHtml, scoreHtml;
                const creationDate = res.details?.find(d => d.list === 'CREATION DATE')?.description || '-';

                if (res.status === 'processing') {
                    statusHtml = `<div class="spinner" style="width: 20px; height: 20px;"></div>`;
                    scoreHtml = `-`;
                } else if (res.status === 'error') {
                    statusHtml = `<span style="color: var(--error, #dc3545); font-weight: 600;" title="${res.error}">Error</span>`;
                    scoreHtml = `-`;
                } else {
                    statusHtml = `<span style="color: var(--success); font-weight: 600;">Success</span>`;
                    let scoreColor = 'var(--success)';
                    if (res.score > 75) scoreColor = '#dc3545';
                    else if (res.score > 25) scoreColor = '#ffc107';
                    scoreHtml = `<span style="color: ${scoreColor}; font-weight: 700;">${res.score}</span>`;
                }

                const row = domainTbody.insertRow();
                row.innerHTML = `<td style="font-weight: 500;">${res.domain}</td><td>${scoreHtml}</td><td>${creationDate}</td><td>${statusHtml}</td>`;
            });

            domainResults.style.display = filteredResults.length === 0 ? 'none' : 'block';
        };

        domainCheckBtn.addEventListener('click', async () => {
            const inputs = [...new Set(domainInput.value.split('\n').map(d => d.trim()).filter(d => d.length > 0))];
            if (inputs.length === 0) {
                showToast('Please enter at least one domain');
                return;
            }

            domainProgress.style.display = 'block';
            domainFilter.style.display = 'block';
            domainCheckBtn.disabled = true;
            domainCheckBtn.innerHTML = '<svg><use href="#icon-extract"></use></svg> Checking...';
            updateProgress(domainProgressBar, domainProgressText, 0, inputs.length);

            let completedCount = 0;
            allDomainResults = inputs.map(domain => ({ domain, status: 'processing' }));
            renderDomainTable();

            for (const domain of inputs) {
                await fetchDomainReputation(domain);
                completedCount++;
                updateProgress(domainProgressBar, domainProgressText, completedCount, inputs.length);
                renderDomainTable();
                if (completedCount < inputs.length) {
                    await sleep(1000);
                }
            }

            domainCheckBtn.disabled = false;
            domainCheckBtn.innerHTML = '<svg><use href="#icon-extract"></use></svg> Check Domains';
        });

        domainClearBtn.addEventListener('click', () => {
            domainInput.value = '';
            allDomainResults = [];
            domainProgress.style.display = 'none';
            domainFilter.style.display = 'none';
            domainFilterInput.value = '';
            renderDomainTable();
        });

        domainExportBtn.addEventListener('click', () => {
            const dataToExport = allDomainResults.filter(res => res.status === 'success');
            if (dataToExport.length === 0) {
                showToast('No domain results to export.');
                return;
            }

            const headers = ['Domain', 'Score', 'Creation Date'];
            const rows = dataToExport.map(res => {
                const score = res.score;
                const creationDate = res.details?.find(d => d.list === 'CREATION DATE')?.description || '';
                return `"${res.domain}",${score},"${creationDate}"`;
            });

            const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `domain_reputation_report.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('CSV exported successfully!');
        });

        domainFilterInput.addEventListener('keyup', renderDomainTable);

        // IP checking
        const fetchIpReputation = async (ip, category) => {
            const url = `/api/check_ip?ip=${encodeURIComponent(ip)}&category=${encodeURIComponent(category)}`;
            try {
                const response = await fetch(url);
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || `Server responded with status: ${response.status}`);
                const resultIndex = allIpResults.findIndex(r => r.ip === ip);
                if (resultIndex !== -1) allIpResults[resultIndex] = { ip, category, data: result.data, status: 'success' };
            } catch (error) {
                console.error(`Fetch for ${ip} failed:`, error);
                const resultIndex = allIpResults.findIndex(r => r.ip === ip);
                if (resultIndex !== -1) {
                    allIpResults[resultIndex].status = 'error';
                    allIpResults[resultIndex].error = error.message;
                }
            }
        };

        const renderIpTable = () => {
            const filterText = ipFilterInput.value.toLowerCase();
            const filteredResults = allIpResults.filter(res => res.ip.toLowerCase().includes(filterText));

            filteredResults.sort((a, b) => {
                const valA = a[ipSortState.column];
                const valB = b[ipSortState.column];
                if (valA < valB) return ipSortState.direction === 'asc' ? -1 : 1;
                if (valA > valB) return ipSortState.direction === 'asc' ? 1 : -1;
                return 0;
            });

            ipTbody.innerHTML = '';
            filteredResults.forEach(res => {
                if (res.status === 'processing') {
                    const row = ipTbody.insertRow();
                    row.innerHTML = `<td style="font-weight: 500;">${res.ip}</td><td>${res.category}</td><td colspan="3"><div class="spinner" style="width: 20px; height: 20px;"></div></td>`;
                } else if (res.status === 'error') {
                    const row = ipTbody.insertRow();
                    row.innerHTML = `<td style="font-weight: 500;">${res.ip}</td><td>${res.category}</td><td colspan="3"><span style="color: var(--error, #dc3545); font-weight: 600;" title="${res.error}">Error</span></td>`;
                } else if (res.data.listings.length === 0) {
                    const row = ipTbody.insertRow();
                    row.innerHTML = `<td style="font-weight: 500;">${res.ip}</td><td>${res.category}</td><td colspan="3"><span style="color: var(--success); font-weight: 600;">Not Listed</span></td>`;
                } else {
                    res.data.listings.forEach((listing, index) => {
                        const row = ipTbody.insertRow();
                        const ipCell = index === 0 ? `<td style="font-weight: 500;" rowspan="${res.data.listings.length}">${res.ip}</td>` : '';
                        const categoryCell = index === 0 ? `<td rowspan="${res.data.listings.length}">${res.category}</td>` : '';
                        row.innerHTML = `${ipCell}${categoryCell}<td>${listing.reason}</td><td>${listing.listed_on}</td><td>${listing.delisted_on}</td>`;
                    });
                }
            });

            ipResults.style.display = filteredResults.length === 0 ? 'none' : 'block';
        };

        ipCheckBtn.addEventListener('click', async () => {
            const inputs = [...new Set(ipInput.value.split('\n').map(d => d.trim()).filter(d => d.length > 0))];
            if (inputs.length === 0) {
                showToast('Please enter at least one IP address');
                return;
            }

            const category = ipCategory.value;
            ipProgress.style.display = 'block';
            ipFilter.style.display = 'block';
            ipCheckBtn.disabled = true;
            ipCheckBtn.innerHTML = '<svg><use href="#icon-extract"></use></svg> Checking...';
            updateProgress(ipProgressBar, ipProgressText, 0, inputs.length);

            let completedCount = 0;
            allIpResults = inputs.map(ip => ({ ip, category, status: 'processing' }));
            renderIpTable();

            for (const ip of inputs) {
                await fetchIpReputation(ip, category);
                completedCount++;
                updateProgress(ipProgressBar, ipProgressText, completedCount, inputs.length);
                renderIpTable();
                if (completedCount < inputs.length) {
                    await sleep(1000);
                }
            }

            ipCheckBtn.disabled = false;
            ipCheckBtn.innerHTML = '<svg><use href="#icon-extract"></use></svg> Check IPs';
        });

        ipClearBtn.addEventListener('click', () => {
            ipInput.value = '';
            allIpResults = [];
            ipProgress.style.display = 'none';
            ipFilter.style.display = 'none';
            ipFilterInput.value = '';
            renderIpTable();
        });

        ipExportBtn.addEventListener('click', () => {
            const dataToExport = allIpResults.filter(res => res.status === 'success');
            if (dataToExport.length === 0) {
                showToast('No IP results to export.');
                return;
            }

            const headers = ['IP', 'Category', 'Reason', 'Listed On', 'Delisted On'];
            const rows = [];
            dataToExport.forEach(res => {
                if (res.data.listings.length === 0) {
                    rows.push(`"${res.ip}","${res.category}","Not Listed","",""`);
                } else {
                    res.data.listings.forEach(listing => {
                        rows.push(`"${res.ip}","${res.category}","${listing.reason}","${listing.listed_on}","${listing.delisted_on}"`);
                    });
                }
            });

            const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `ip_reputation_report.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('CSV exported successfully!');
        });

        ipFilterInput.addEventListener('keyup', renderIpTable);

        // Setup tab switching to handle target correctly
        const spamhausTabs = spamhausPanel.querySelectorAll('.spamhaus-tabs .tab');
        spamhausTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = document.querySelector(tab.dataset.spamhausTarget);
                const panels = spamhausPanel.querySelectorAll('.spamhaus-content .panel');

                spamhausTabs.forEach(t => t.setAttribute('aria-selected', 'false'));
                tab.setAttribute('aria-selected', 'true');

                panels.forEach(panel => panel.classList.remove('active'));
                if (target) target.classList.add('active');
            });
        });
    }
});