let allPlayerInfractions = [];
let trikojisLimits = [];
let userSettings = {};
let creationTemplates = {};
let currentPage = 1;
const infractionsPerPage = 10;
let currentlySelectedRadar = null;
let confirmationData = null;
let batteryInterval = null;
let settingsClipboard = null;

let longPressTimer;
let isDragging = false;
let dragClone = null;
let currentDragTemplate = null;
let currentDragType = null;
let currentActiveTrashZone = null;
let pendingTemplateData = null;

let dragOffsetX = 0;
let dragOffsetY = 0;
let currentMouseX = 0;
let currentMouseY = 0;
let animationFrameId = null;

const licenseTypeTranslations = {
    'drive': 'Car',             // You can change 'Car' text
    'drive_bike': 'Motorcycle', // You can change 'Motorcyle' text
    'drive_truck': 'Truck',     // You can change 'Truck' text
};

// NUI CALLBACK HELPER FUNCTION
async function post(eventName, data = {}) {
    try {
        const response = await fetch(`https://${GetParentResourceName()}/${eventName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (e) { return null; }
}

// GENERAL NOTIFICATION HANDLING FUNCTION
window.addEventListener('message', function (event) {
    const item = event.data;
    const applyStyles = (settings) => {
        userSettings = settings;
        const detectorUI = document.getElementById('detector-ui');
        const editorPanel = document.getElementById('editor-panel');
        if (!detectorUI || !editorPanel) return;
        if (settings.y > 50) { detectorUI.style.top = 'auto'; detectorUI.style.bottom = (100 - settings.y) + 'vh'; }
        else { detectorUI.style.bottom = 'auto'; detectorUI.style.top = settings.y + 'vh'; }
        if (settings.x > 50) { detectorUI.style.left = 'auto'; detectorUI.style.right = (100 - settings.x) + 'vw'; detectorUI.style.transform = `translateX(50%) scale(${settings.scale})`; }
        else { detectorUI.style.left = settings.x + 'vw'; detectorUI.style.right = 'auto'; detectorUI.style.transform = `translateX(-50%) scale(${settings.scale})`; }
        syncThemeToggles(settings.theme === 'dark');
    };
    const updateEditorValues = (settings) => {
        userSettings = settings;
        document.getElementById('y-pos').value = settings.y;
        document.getElementById('x-pos').value = settings.x;
        document.getElementById('scale').value = settings.scale;
        document.getElementById('theme-toggle').checked = settings.theme === 'dark';
    };
    switch (item.action) {
        case 'showCollectPrompt':
            const promptData = item.data;
            const prompt = $('#collect-prompt');
            $('#radar-name').text(promptData.radarName);
            $('#radar-amount').text(promptData.amount.toFixed(2) + '$');
            $('#collect-key').text(promptData.key);
            $('#last-collector-name').text(promptData.lastCollector || 'N/A');
            const nameText = $('#radar-name').text();
            const lastCollectedText = $('#last-collector-name').text();
            const baseWidth = 320;
            const charWidth = 7;
            const longestTextLength = Math.max(nameText.length, lastCollectedText.length);
            const requiredWidth = Math.min(600, Math.max(baseWidth, (longestTextLength * charWidth) + 160)); 
            prompt.css('width', `${requiredWidth}px`);
            prompt.removeClass('hidden');
            break;

        case 'hideCollectPrompt':
            $('#collect-prompt').addClass('hidden');
            break;

        case 'set_detector_visibility':
            $('#detector-container').toggleClass('force-hidden', !item.visible);
            break;

        case 'toggleUI': document.getElementById('detector-ui').classList.toggle('hidden', !item.show); break;
        case 'showMockPlayerDetector':
            document.getElementById('detector-ui').classList.toggle('hidden', !item.show);
        break;
        case 'setUiVisibility': document.getElementById('detector-ui').classList.toggle('force-hidden', !item.visible); break;
        case 'update':
            document.querySelectorAll('.light').forEach(light => light.classList.remove('active'));
            if (item.inRange) {
                document.querySelector('.main-display').style.display = 'none';
                document.querySelector('.info-display').style.display = 'block';
                document.getElementById('distance').innerText = item.distance;
                document.getElementById('limit').innerText = item.limit;
                document.getElementById('type').innerText = item.type;
                if (item.light && item.light !== 'none') {
                    const activeLight = document.getElementById('light-' + item.light);
                    if (activeLight) activeLight.classList.add('active');
                }
            } else {
                document.querySelector('.main-display').style.display = 'flex';
                document.querySelector('.info-display').style.display = 'none';
            }
            break;
        case 'toggleEditor':
            document.getElementById('editor-panel').classList.toggle('hidden', !item.show);
            const policeBtn = document.getElementById('police-menu-btn');
            if (policeBtn) {
                policeBtn.classList.toggle('hidden', !item.isPolice);
            }
            if (item.show) {
                applyStyles(item.settings);
                updateEditorValues(item.settings);
                const saveBtn = document.getElementById('save-settings');
                if (saveBtn) {
                    saveBtn.innerHTML = 'Save';
                    saveBtn.classList.remove('success');
                    saveBtn.disabled = false;
                }
            }
            break;
            case 'updateTemplates':
            creationTemplates = item.templates;
            if (creationTemplates.Stationary) {
                populateTemplateButtons('Stationary', creationTemplates.Stationary);
            }
            if (creationTemplates.AverageZone) {
                populateTemplateButtons('AverageZone', creationTemplates.AverageZone);
            }
            break;
        case 'applyStyles':
            applyStyles(item.settings);
            if (!document.getElementById('editor-panel').classList.contains('hidden')) { updateEditorValues(item.settings); }
            break;
        case 'toggleLogsMenu':
            const logsApp = document.getElementById('radar-logs-app');
            logsApp.classList.toggle('hidden', !item.show);

            if (item.show) {
                void logsApp.offsetHeight;
                document.getElementById('statistics-view').classList.add('hidden');
                document.querySelector('.sidebar').style.display = 'flex';
                document.getElementById('player-details-placeholder').classList.remove('hidden');
                post('requestSummary');
            }
            else {
                document.getElementById('player-list').innerHTML = '<li class="no-results">No data.</li>';
                document.getElementById('player-details-placeholder').classList.remove('hidden');
                document.getElementById('player-details-view').classList.add('hidden');
                document.getElementById('player-search').value = '';
            }
            break;
        case 'updateSummaryList': updatePlayerList(item.summary); break;
        case 'updatePlayerDetails': updatePlayerDetails(item); break;
        case 'updateStatistics': renderStatistics(item.statistics); break;
        case 'showAvgZoneCreator': {
            document.getElementById('avg-zone-creator').classList.remove('hidden');
            document.getElementById('avg-zone-creator').classList.remove('is-finalizing');
            const topBtn = document.getElementById('place-object-btn');
            if (topBtn) {
                topBtn.innerHTML = `<i class="fa-solid fa-cube"></i> Place Object (0/2)`;
                topBtn.classList.remove('success');
                topBtn.disabled = false;
            }
            const bottomBtn = document.getElementById('add-objects-btn');
            if (bottomBtn) {
                bottomBtn.innerHTML = `<i class="fa-solid fa-cube"></i> Place Object (0/2)`;
                bottomBtn.classList.remove('success');
                bottomBtn.disabled = false;
            }
            const saveBtn = document.getElementById('save-zone-btn');
            if (saveBtn) {
                saveBtn.innerHTML = `Save Zone`;
                saveBtn.classList.remove('success');
                saveBtn.disabled = true;
            }
            
            creationTemplates.AverageZone = item.templates || [];
            populateTemplateButtons('AverageZone', creationTemplates.AverageZone);
            document.getElementById('avg-templates-container').classList.add('hidden');
            break;
        }
        case 'showStationaryRadarCreator': {
            document.getElementById('stationary-radar-creator').classList.remove('hidden');
            const placeObjBtn = document.getElementById('place-stationary-object');
            if (placeObjBtn) {
                placeObjBtn.innerHTML = `<i class="fa-solid fa-cube"></i> Place Object`;
                placeObjBtn.classList.remove('success');
            }
            const saveBtn = document.getElementById('save-stationary-btn');
            if (saveBtn) {
                saveBtn.innerHTML = `Save Radar`;
                saveBtn.classList.remove('success');
                saveBtn.disabled = true;
            }

            creationTemplates.Stationary = item.templates || [];
            populateTemplateButtons('Stationary', creationTemplates.Stationary);
            document.getElementById('stationary-templates-container').classList.add('hidden');
            break;
        }
        
        case 'promptAvgZoneDetails':
            document.getElementById('avg-zone-creator').classList.add('is-finalizing');
            const placeBtnFinalize = document.getElementById('place-object-btn');
            if (placeBtnFinalize) placeBtnFinalize.disabled = true;
            break;
        case 'hideAvgZoneCreator':
            document.getElementById('avg-zone-creator').classList.add('hidden');
            document.getElementById('zone-name').value = '';
            document.getElementById('zone-limit').value = '';
            for (let i = 1; i <= 3; i++) {
                document.getElementById(`p${i}_from`).value = '';
                document.getElementById(`p${i}_to`).value = '';
                document.getElementById(`p${i}_points`).value = '';
                document.getElementById(`p${i}_fine`).value = '';
            }
            const placeBtnHide = document.getElementById('place-object-btn');
            if (placeBtnHide) placeBtnHide.disabled = false;
            break;
        case 'hideStationaryRadarCreator':
            document.getElementById('stationary-radar-creator').classList.add('hidden');
            document.getElementById('new-radar-name').value = '';
            document.getElementById('radar-limit').value = '';
            document.getElementById('new-radar-threshold').value = '';
            for (let i = 1; i <= 3; i++) {
                document.getElementById(`sr_p${i}_from`).value = '';
                document.getElementById(`sr_p${i}_to`).value = '';
                document.getElementById(`sr_p${i}_points`).value = '';
                document.getElementById(`sr_p${i}_fine`).value = '';
            }
            break;
        case 'toggleStationaryCreator':
            const creator = document.getElementById('stationary-radar-creator');
            creator.classList.toggle('hidden', !item.show);
            if (item.objectPlaced) {
                const btn = document.getElementById('place-stationary-object');
                btn.innerHTML = `<i class="fa-solid fa-check"></i> Object Placed`;
                btn.classList.add('success');
            }
            break;
        case 'toggleStationaryPlacementBar':
            document.getElementById('stationary-object-placement-bar').classList.toggle('hidden', !item.show);
            break;
        case 'toggleAdminMenu':
            document.getElementById('radar-admin-app').classList.toggle('hidden', !item.show);
            if (item.show) {
                post('admin:requestRadarList');
                syncThemeToggles(userSettings.theme === 'dark');
                } else {
                document.getElementById('changelog-modal').classList.add('hidden');
            }
            break;
        case 'updateRadarList':
            updateRadarList(item.radars, item.zones);
            break;
        case 'updateObjectCount':
            const topBtn = document.getElementById('place-object-btn');
            const bottomBtn = document.getElementById('add-objects-btn');
            const updateButton = (button) => {
                if (button) {
                    if (item.count >= 2) {
                        button.innerHTML = `<i class="fa-solid fa-check"></i> Objects Placed`;
                        button.classList.add('success');
                        button.disabled = true;
                    } else {
                        button.innerHTML = `<i class="fa-solid fa-cube"></i> Place Object (${item.count}/2)`;
                        button.classList.remove('success');
                        button.disabled = false;
                    }
                }
            };
            updateButton(topBtn);
            updateButton(bottomBtn);
            break;
        case 'toggleAvgZoneBar':
            document.getElementById('avg-zone-creator')?.classList.toggle('hidden', !item.show);
            break;
        case 'toggleObjectPlacementBar':
            const objBar = document.getElementById('object-placement-bar');
            if (objBar) {
                objBar.classList.toggle('hidden', !item.show);
                if (item.show) {
                    const counter = document.getElementById('object-placement-counter');
                    if (counter) {
                        counter.innerHTML = `<i class="fa-solid fa-cube"></i> Objects: ${item.count}/2`;
                    }
                }
            }
            break;
        case 'toggleHeightBar':
            document.getElementById('polyzone-height-bar').classList.toggle('hidden', !item.show);
            if (item.show) {
                document.getElementById('polyzone-height-value').textContent = `Height: ${item.value.toFixed(1)}m`;
            }
            break;
        case 'toggleTriggerBar':
            document.getElementById('trigger-regulation-bar').classList.toggle('hidden', !item.show);
            if (item.show) {
                document.getElementById('trigger-size-value').textContent = `Width: ${item.radius.toFixed(1)}m | Height: ${item.height.toFixed(1)}m`;
            }
            break;
        case 'updatePolyzoneHeight':
            document.getElementById('polyzone-height-value').textContent = `Height: ${item.value.toFixed(1)}m`;
            break;
        case 'updateTriggerSize':
            document.getElementById('trigger-size-value').textContent = `Width: ${item.radius.toFixed(1)}m | Height: ${item.height.toFixed(1)}m`;
            break;
        case 'showConfirmation':
            confirmationData = item;
            const dialog = document.getElementById('confirmation-dialog');
            const textEl = document.getElementById('confirmation-text');
            let message = '';

            if (item.type === 'stationary') {
                message = "We recommend placing the object where it is visible to players. You can also collect money from objects. Are you sure you want to save without it?";
            } else if (item.type === 'avg') {
                const remaining = 2 - item.objectCount;
                message = `You have only placed ${item.objectCount}/2 objects. We recommend placing the remaining ${remaining} object(s). Are you sure you want to save?`;
            }

            textEl.textContent = message;
            dialog.classList.remove('hidden');
            break;
        
        case 'toggleTrikojisPlacementBar':
            document.getElementById('trikojis-object-placement-bar').classList.toggle('hidden', !item.show);
            break;
        
    case 'showTrikojisConfig':
        const panel = document.getElementById('trikojis-creator-panel');
        document.getElementById('trikojis-error-message').classList.add('hidden');

        trikojisLimits = item.limits;
        
        document.getElementById('trikojis-limit').value = item.currentLimit || '';
        document.getElementById('trikojis-blip').checked = item.currentBlip || false;

        const defaults = item.defaults || [];
        for (let i = 0; i < 3; i++) {
            document.getElementById(`trikojis_p${i + 1}_from`).value = defaults[i]?.from || '';
            document.getElementById(`trikojis_p${i + 1}_to`).value = defaults[i]?.to || '';
            document.getElementById(`trikojis_p${i + 1}_points`).value = defaults[i]?.points || '';
            document.getElementById(`trikojis_p${i + 1}_fine`).value = defaults[i]?.fine || '';
        }

        const saveBtn = document.getElementById('trikojis-save');
        if (saveBtn) {
            saveBtn.innerHTML = 'Activate radar';
            saveBtn.classList.remove('success');
            saveBtn.disabled = false;
        }

        panel.classList.remove('hidden');
        break;
        case 'hideTrikojisConfig':
            document.getElementById('trikojis-creator-panel').classList.add('hidden');
            document.getElementById('trikojis-error-message').classList.add('hidden');
            break;

        case 'showTrikojisValidationError':
            const errorBox = document.getElementById('trikojis-error-message');
            if (errorBox) {
                errorBox.textContent = item.error;
                errorBox.classList.remove('hidden');
            }
            break;
        case 'toggle_police_editor':
            $('#police-editor-panel').toggleClass('hidden', !item.show);
            if (item.show) {
                $('#police-y-pos').val(item.settings.y);
                $('#police-x-pos').val(item.settings.x);
                $('#police-scale').val(item.settings.scale);
            }
            break;
        
        case 'apply_police_styles':
            const policeDetector = document.getElementById('detector-container');
            const settings = item.settings;
            if (!policeDetector) return;
            
            if (settings.y > 50) {
                policeDetector.style.top = 'auto';
                policeDetector.style.bottom = (100 - settings.y) + 'vh';
            } else {
                policeDetector.style.bottom = 'auto';
                policeDetector.style.top = settings.y + 'vh';
            }
            
            if (settings.x > 50) {
                policeDetector.style.left = 'auto';
                policeDetector.style.right = (100 - settings.x) + 'vw';
            } else {
                policeDetector.style.left = settings.x + 'vw';
                policeDetector.style.right = 'auto';
            }
            policeDetector.style.transform = `translate(-50%, -50%) scale(${settings.scale})`;
            break;
        case 'hideMockPlayerDetector':
            if (!$('#detector-ui').hasClass('force-hidden')) {
                $('#detector-ui').addClass('hidden');
            }
            $('#mock-detector-toggle').prop('checked', false);
            break;

        case 'hideMockPoliceDetector':
            if (!$('#detector-container').hasClass('force-hidden')) {
                $('#detector-container').addClass('hidden');
            }
            $('#mock-police-detector-toggle').prop('checked', false);
            break;

        case 'showTrikojisInfo': {
            const infoPanel = document.getElementById('trikojis-info-panel');
            const radarInfo = item.data;

            document.getElementById('trikojis-info-limit').textContent = `${radarInfo.limit} ${item.speedLabel}`;
            document.getElementById('trikojis-info-owner').textContent = radarInfo.ownerName;
            document.getElementById('trikojis-info-fines').textContent = radarInfo.stats.finesCount;
            document.getElementById('trikojis-edit-text').innerHTML = `Press <kbd>${item.editKeyName}</kbd> to edit`;
            document.getElementById('trikojis-remove-text').innerHTML = `Press <kbd>${item.removeKeyName}</kbd> to remove`;

            infoPanel.dataset.isAutomatic = item.isAutomatic;
            const moneyEl = document.getElementById('trikojis-info-money');
            if (moneyEl) {
                if (item.isAutomatic) {
                    moneyEl.textContent = `${radarInfo.stats.moneyCollected}$ (society)`;
                } else {
                    moneyEl.textContent = `${radarInfo.stats.moneyCollected}$`;
                }
            }

            const collectEl = document.getElementById('trikojis-collect-text');
            if (collectEl) {
                if (item.collectKeyName) {
                    collectEl.innerHTML = `Press <kbd>${item.collectKeyName}</kbd> to collect`;
                    collectEl.style.display = 'inline-block';
                } else {
                    collectEl.innerHTML = '';
                    collectEl.style.display = 'none';
                }
            }

            if (batteryInterval) clearInterval(batteryInterval);
            const endTime = radarInfo.creationTime + item.batteryLife;
            const batteryEl = document.getElementById('trikojis-info-battery');
            function updateTimer() {
                const now = Math.floor(Date.now() / 1000);
                const remaining = endTime - now;
                batteryEl.classList.remove('discharged');
                if (remaining <= 0) {
                    batteryEl.textContent = 'Discharged';
                    batteryEl.classList.add('discharged');
                    clearInterval(batteryInterval);
                    return;
                }
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;
                batteryEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            updateTimer();
            batteryInterval = setInterval(updateTimer, 1000);

            infoPanel.classList.remove('hidden');
            break;
        }

        case 'hideTrikojisInfo':
            document.getElementById('trikojis-info-panel').classList.add('hidden');
            if (batteryInterval) clearInterval(batteryInterval);
            batteryInterval = null;
            break;
        case 'updateTrikojisStats':
            const stats = item.data;
            if (stats) {
                const finesEl = document.getElementById('trikojis-info-fines');
                const moneyEl = document.getElementById('trikojis-info-money');
                if (finesEl) finesEl.textContent = stats.finesCount;

                if (moneyEl) {
                    const infoPanel = document.getElementById('trikojis-info-panel');
                    const isAutomatic = infoPanel.dataset.isAutomatic === 'true';
                    if (isAutomatic) {
                        moneyEl.textContent = `${stats.moneyCollected}$`;
                    } else {
                        moneyEl.textContent = `${stats.moneyCollected}$`;
                    }
                }
            }
            break;
        case 'flashRequiredAction':
            const removeEl = document.getElementById('trikojis-remove-text');
            const collectEl = document.getElementById('trikojis-collect-text');

            if (removeEl && collectEl) {
                removeEl.classList.add('flash-red');
                collectEl.classList.add('flash-green');

                setTimeout(() => {
                    removeEl.classList.remove('flash-red');
                    collectEl.classList.remove('flash-green');
                }, 1500);
            }
            break;
        case 'showViolationSnapshot':
            const snap = document.getElementById('snapshot-container');
            const data = item.data;

            document.getElementById('snap-radar-name').textContent = data.radarName;
            document.getElementById('snap-vehicle-model').textContent = data.model;
            document.getElementById('snap-vehicle-plate').textContent = data.plate;
            document.getElementById('snap-timestamp').textContent = new Date(data.timestamp * 1000).toLocaleString('lt-LT');
            document.getElementById('snap-speed-clocked').textContent = data.speed;
            document.getElementById('snap-speed-limit').textContent = data.limit;

            snap.classList.remove('hidden');
            snap.classList.add('visible');

            setTimeout(() => {
                snap.classList.remove('visible');
                setTimeout(() => snap.classList.add('hidden'), 500);
            }, 10000);
            break;
        case 'show_detector':
            $('#detector-container').removeClass('hidden');
            $('#distance-value').text('--');
            $('#plate-value').text('--');
            $('#signal-bars .bar').removeClass('active');
            $('#detector-display').removeClass('found-animation');
            break;
        case 'hide_detector':
            $('#detector-container').addClass('hidden');
            break;
        case 'found_detector':
            var distance = item.distance ? Math.round(item.distance) + 'm' : '--';
            var signalStrength = item.distance ? Math.max(1, Math.min(5, Math.ceil((75 - item.distance) / 15))) : 0;

            $('#distance-value').text(distance);
            $('#plate-value').text(item.plate);
            $('#detector-display').addClass('found-animation');
            $('#signal-bars .bar').removeClass('active');
            for (var i = 0; i < signalStrength; i++) {
                $('#signal-bars .bar').eq(i).addClass('active');
            }
            break;
        case 'notFound_detector':
            $('#distance-value').text('--');
            $('#plate-value').text('NO SIGNAL');
            $('#signal-bars .bar').removeClass('active');
            $('#detector-display').removeClass('found-animation');

            setTimeout(function() {
                if (!$('#detector-container').hasClass('hidden') && $('#plate-value').text() === 'NO SIGNAL') {
                    $('#plate-value').text(' ');
                }
            }, 1500);
            break;
        case 'showCreationSaveSuccess': {
            let button;
            if (item.type === 'avg') {
                button = document.getElementById('save-zone-btn');
            } else if (item.type === 'stationary') {
                button = document.getElementById('save-stationary-btn');
            }
            if (button) {
                button.innerHTML = `<i class="fa-solid fa-check"></i> Saved!`;
                button.classList.add('success');
                button.disabled = true;
            }
            break;
        }
        case 'showTrikojisSaveSuccess': {
            const button = document.getElementById('trikojis-save');
            if (button) {
                button.innerHTML = `<i class="fa-solid fa-check"></i> Saved!`;
                button.classList.add('success');
                button.disabled = true;
            }
            break;
        }
        case 'updateVersionInfo':
            const vData = item.data;
            const statusEl = document.getElementById('version-status-text');
            
            if (!statusEl) return;

            statusEl.dataset.latest = vData.latest;
            statusEl.dataset.current = vData.current;
            statusEl.dataset.changelog = vData.changelog;

            statusEl.classList.remove('loading', 'latest', 'outdated');
            statusEl.innerHTML = '';

            if (vData.status === 'latest') {
                statusEl.classList.add('latest');
                statusEl.innerHTML = `<i class="fa-solid fa-shield-check"></i> System Up-to-Date <span class="v-tag">v${vData.current}</span>`;
                statusEl.onclick = null;
            } else if (vData.status === 'outdated') {
                statusEl.classList.add('outdated');
                statusEl.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> New Update Available <span class="v-tag">v${vData.latest}</span>`;
                
                statusEl.onclick = () => {
                    document.getElementById('modal-current-ver').textContent = vData.current;
                    document.getElementById('modal-new-ver').textContent = vData.latest;
                    
                    const ul = document.getElementById('modal-changelog-text');
                    ul.innerHTML = '';
                    
                    if (vData.changelog) {
                        const lines = vData.changelog.split('\n');
                        lines.forEach(line => {
                            if(line.trim() !== "") {
                                const li = document.createElement('li');
                                li.textContent = line.replace(/^\s*-\s*/, '').replace(/^\s*\+\s*/, '');
                                ul.appendChild(li);
                            }
                        });
                    }

                    document.getElementById('changelog-modal').classList.remove('hidden');
                };
            } else {
                statusEl.innerHTML = '<i class="fa-solid fa-circle-question"></i> Status Unknown';
            }
            break;
    }
});

function populateTemplateButtons(type, templates) {
    const containerId = type === 'Stationary' ? 'stationary-templates-container' : 'avg-templates-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    
    if (!templates || templates.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; opacity: 0.6; padding: 10px;">No templates available.</div>';
        return;
    }

    const hintDiv = document.createElement('div');
    hintDiv.className = 'template-grid-hint';
    hintDiv.innerHTML = '<i class="fa-regular fa-hand-pointer"></i> Press & hold to delete';
    container.appendChild(hintDiv);

    templates.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        const iconClass = type === 'Stationary' ? 'fa-camera' : 'fa-road';
        const limitDisplay = template.limit ? `${template.limit}` : 'N/A';

        card.innerHTML = `
            <div class="t-icon"><i class="fa-solid ${iconClass}"></i></div>
            <div class="t-name">${template.name}</div>
            <div class="t-limit"><i class="fa-solid fa-gauge-high"></i> ${limitDisplay}</div>
        `;

        card.addEventListener('mousedown', (e) => {
            longPressTimer = setTimeout(() => {
                startDrag(e, card, template, type);
            }, 400); 
        });

        card.addEventListener('click', (e) => {
            if (!isDragging) {
                applyTemplate(type, template);
                const originalBorder = card.style.borderColor;
                card.style.borderColor = '#2ecc71';
                setTimeout(() => {
                    card.style.borderColor = originalBorder;
                    container.classList.add('hidden');
                }, 300);
            }
        });

        card.addEventListener('mouseup', () => clearTimeout(longPressTimer));
        card.addEventListener('mouseleave', () => clearTimeout(longPressTimer));

        container.appendChild(card);
    });
}

function startDrag(e, cardElement, template, type) {
    isDragging = true;
    currentDragTemplate = template;
    currentDragType = type;

    document.body.classList.add('no-select');
    cardElement.classList.add('dragging');

    const rect = cardElement.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    dragClone = cardElement.cloneNode(true);
    dragClone.classList.add('template-card-clone');
    dragClone.style.width = rect.width + 'px'; 
    document.body.appendChild(dragClone);
    let activeContainerId = type === 'Stationary' ? 'stationary-radar-creator' : 'avg-zone-creator';
    let activeContainer = document.getElementById(activeContainerId);
    
    if (activeContainer) {
        currentActiveTrashZone = activeContainer.querySelector('.integrated-trash-zone');
        if (currentActiveTrashZone) {
            currentActiveTrashZone.classList.remove('hidden');
        }
    }

    currentMouseX = e.clientX;
    currentMouseY = e.clientY;
    updateVisuals();

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
}

function onDragMove(e) {
    if (!isDragging) return;
    currentMouseX = e.clientX;
    currentMouseY = e.clientY;

    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(updateVisuals);
    }
}

function updateVisuals() {
    if (!isDragging || !dragClone) return;

    const posX = currentMouseX - dragOffsetX;
    const posY = currentMouseY - dragOffsetY;
    dragClone.style.transform = `translate3d(${posX}px, ${posY}px, 0) rotate(3deg) scale(1.05)`;

    if (currentActiveTrashZone) {
        const trashRect = currentActiveTrashZone.getBoundingClientRect();
        if (currentMouseX >= trashRect.left && currentMouseX <= trashRect.right &&
            currentMouseY >= trashRect.top && currentMouseY <= trashRect.bottom) {
            currentActiveTrashZone.classList.add('drag-over');
        } else {
            currentActiveTrashZone.classList.remove('drag-over');
        }
    }

    animationFrameId = null;
}

function onDragEnd(e) {
    if (!isDragging) return;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);

    let isOverTrash = false;
    if (currentActiveTrashZone) {
        isOverTrash = currentActiveTrashZone.classList.contains('drag-over');
        currentActiveTrashZone.classList.remove('drag-over');
        const zoneToHide = currentActiveTrashZone;
        setTimeout(() => {
            if (zoneToHide) zoneToHide.classList.add('hidden');
        }, 100);
        
        currentActiveTrashZone = null;
    }

    if (isOverTrash) {
        post('admin:deleteTemplate', { 
            name: currentDragTemplate.name, 
            type: currentDragType 
        });
    }

    document.body.classList.remove('no-select');
    if (dragClone) dragClone.remove();
    dragClone = null;

    document.querySelectorAll('.template-card.dragging').forEach(el => el.classList.remove('dragging'));
    
    isDragging = false;
}

function moveClone(x, y) {
    if (dragClone) {
        const posX = x - dragOffsetX;
        const posY = y - dragOffsetY;
        dragClone.style.transform = `translate3d(${posX}px, ${posY}px, 0) rotate(3deg) scale(1.05)`;
    }
}

function applyTemplate(type, template) {
    const prefix = type === 'Stationary' ? 'sr_' : '';
    const limitId = type === 'Stationary' ? 'radar-limit' : 'zone-limit';
    const thresholdId = type === 'Stationary' ? 'new-radar-threshold' : 'zone-threshold';

    document.getElementById(limitId).value = template.limit;
    document.getElementById(thresholdId).value = template.speedingThreshold || '';

    for (let i = 1; i <= 3; i++) {
        document.getElementById(`${prefix}p${i}_from`).value = '';
        document.getElementById(`${prefix}p${i}_to`).value = '';
        document.getElementById(`${prefix}p${i}_points`).value = '';
        document.getElementById(`${prefix}p${i}_fine`).value = '';
    }

    template.penalties.forEach((p, index) => {
        if (index < 3) {
            document.getElementById(`${prefix}p${index + 1}_from`).value = p.from;
            document.getElementById(`${prefix}p${index + 1}_to`).value = p.to;
            document.getElementById(`${prefix}p${index + 1}_points`).value = p.points;
            document.getElementById(`${prefix}p${index + 1}_fine`).value = p.fine;
        }
    });
}

function syncThemeToggles(isDark) {
    document.body.classList.toggle('dark-theme', isDark);
    const editorToggle = document.getElementById('theme-toggle');
    if (editorToggle) editorToggle.checked = isDark;
    const adminToggle = document.getElementById('admin-theme-toggle');
    if (adminToggle) adminToggle.checked = isDark;
}

function gatherCurrentSettings() {
    const isDark = document.body.classList.contains('dark-theme');
    userSettings.theme = isDark ? 'dark' : 'light';

    const editorPanel = document.getElementById('editor-panel');
    const yPos = document.getElementById('y-pos');
    if (editorPanel && !editorPanel.classList.contains('hidden') && yPos) {
        userSettings.y = parseFloat(yPos.value);
        userSettings.x = parseFloat(document.getElementById('x-pos').value);
        userSettings.scale = parseFloat(document.getElementById('scale').value);
    }
    return userSettings;
}

document.addEventListener('DOMContentLoaded', () => {
    const yPosSlider = document.getElementById('y-pos');
    const xPosSlider = document.getElementById('x-pos');
    const scaleSlider = document.getElementById('scale');
    function updatePreview() {
        const settings = { y: parseFloat(yPosSlider.value), x: parseFloat(xPosSlider.value), scale: parseFloat(scaleSlider.value) };
        const detectorUI = document.getElementById('detector-ui');
        if (settings.y > 50) { detectorUI.style.top = 'auto'; detectorUI.style.bottom = (100 - settings.y) + 'vh'; }
        else { detectorUI.style.bottom = 'auto'; detectorUI.style.top = settings.y + 'vh'; }
        if (settings.x > 50) { detectorUI.style.left = 'auto'; detectorUI.style.right = (100 - settings.x) + 'vw'; detectorUI.style.transform = `translateX(50%) scale(${settings.scale})`; }
        else { detectorUI.style.left = settings.x + 'vw'; detectorUI.style.right = 'auto'; detectorUI.style.transform = `translateX(-50%) scale(${settings.scale})`; }
    }
    if (yPosSlider && xPosSlider && scaleSlider) {
        [yPosSlider, xPosSlider, scaleSlider].forEach(slider => { slider.addEventListener('input', updatePreview); });
    }
    document.getElementById('save-settings')?.addEventListener('click', function() {
        const latestSettings = gatherCurrentSettings();
        post('saveRadarSettings', latestSettings);
        
        this.innerHTML = `<i class="fa-solid fa-check"></i> Saved!`;
        this.classList.add('success');
        this.disabled = true;
    });
    document.getElementById('place-object-btn')?.addEventListener('click', () => {
        post('startObjectPlacement');
    });
    document.getElementById('police-menu-btn')?.addEventListener('click', () => {
        post('openPoliceMenu');
    });
    document.getElementById('reset-settings')?.addEventListener('click', () => post('resetRadarSettings'));
    document.getElementById('close-editor-btn')?.addEventListener('click', () => post('closeEditor'));

    const themeToggle = document.getElementById('theme-toggle');
    const adminThemeToggle = document.getElementById('admin-theme-toggle');
    function handleThemeChange(e) {
        syncThemeToggles(e.target.checked);
        const latestSettings = gatherCurrentSettings();
        post('saveUiSettingsBackground', latestSettings);
    }
    if (themeToggle) themeToggle.addEventListener('change', handleThemeChange);
    if (adminThemeToggle) adminThemeToggle.addEventListener('change', handleThemeChange);

    const playerSearchInput = document.getElementById('player-search');
    const searchButton = document.getElementById('search-button');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const showStatsBtn = document.getElementById('show-statistics-btn');
    const backToLogsBtn = document.getElementById('back-to-logs-btn');
    showStatsBtn?.addEventListener('click', () => {
        document.querySelector('.sidebar').style.display = 'none';
        document.getElementById('player-details-placeholder').classList.add('hidden');
        document.getElementById('player-details-view').classList.add('hidden');
        document.getElementById('statistics-view').classList.remove('hidden');
        post('requestStatistics');
    });
    backToLogsBtn?.addEventListener('click', () => {
        document.getElementById('statistics-view').classList.add('hidden');
        document.querySelector('.sidebar').style.display = 'flex';
        if (document.querySelector('#player-list li.active')) {
            document.getElementById('player-details-view').classList.remove('hidden');
        } else {
            document.getElementById('player-details-placeholder').classList.remove('hidden');
        }
    });
    searchButton?.addEventListener('click', () => { post('searchPlayers', { query: playerSearchInput.value.trim() }); });
    playerSearchInput?.addEventListener('keyup', (event) => { if (event.key === 'Enter') { searchButton.click(); } });
    document.getElementById('close-logs-app')?.addEventListener('click', () => { post('closeLogsMenu'); });
    prevPageBtn?.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderInfractionsPage(currentPage); }
    });
    nextPageBtn?.addEventListener('click', () => {
        const totalPages = Math.ceil(allPlayerInfractions.length / infractionsPerPage);
        if (currentPage < totalPages) { currentPage++; renderInfractionsPage(currentPage); }
    });

    const saveZoneBtn = document.getElementById('save-zone-btn');
    const cancelZoneBtn = document.getElementById('cancel-zone-creation');
    saveZoneBtn?.addEventListener('click', () => {
        const zoneData = {
            name: document.getElementById('zone-name').value.trim(),
            limit: parseInt(document.getElementById('zone-limit').value, 10),
            speedingThreshold: parseInt(document.getElementById('zone-threshold').value, 10) || null,
            penalties: [
                { from: parseInt(document.getElementById('p1_from').value, 10), to: parseInt(document.getElementById('p1_to').value, 10), points: parseInt(document.getElementById('p1_points').value, 10), fine: parseInt(document.getElementById('p1_fine').value, 10) },
                { from: parseInt(document.getElementById('p2_from').value, 10), to: parseInt(document.getElementById('p2_to').value, 10), points: parseInt(document.getElementById('p2_points').value, 10), fine: parseInt(document.getElementById('p2_fine').value, 10) },
                { from: parseInt(document.getElementById('p3_from').value, 10), to: parseInt(document.getElementById('p3_to').value, 10), points: parseInt(document.getElementById('p3_points').value, 10), fine: parseInt(document.getElementById('p3_fine').value, 10) }
            ].filter(p => !isNaN(p.from) && !isNaN(p.to) && !isNaN(p.points) && !isNaN(p.fine))
        };
        if (!zoneData.name || isNaN(zoneData.limit)) { return; }
        post('saveNewAverageZone', zoneData);
    });
    cancelZoneBtn?.addEventListener('click', () => post('cancelAverageZoneCreation'));
    document.getElementById('add-objects-btn')?.addEventListener('click', () => {
        document.getElementById('avg-zone-creator').classList.remove('is-finalizing');
        post('startObjectPlacement');
        post('unfocusNuiForPlacement');
    });

    const saveStationaryBtn = document.getElementById('save-stationary-btn');
    const cancelStationaryBtn = document.getElementById('cancel-stationary-creation');
    const placeStationaryObjBtn = document.getElementById('place-stationary-object');
    placeStationaryObjBtn?.addEventListener('click', () => post('startStationaryObjectPlacement'));
    saveStationaryBtn?.addEventListener('click', () => {
        const radarData = {
            name: document.getElementById('new-radar-name').value.trim(),
            limit: parseInt(document.getElementById('radar-limit').value, 10),
            speedingThreshold: parseInt(document.getElementById('new-radar-threshold').value, 10) || null,
            penalties: [
                { from: parseInt(document.getElementById('sr_p1_from').value, 10), to: parseInt(document.getElementById('sr_p1_to').value, 10), points: parseInt(document.getElementById('sr_p1_points').value, 10), fine: parseInt(document.getElementById('sr_p1_fine').value, 10) },
                { from: parseInt(document.getElementById('sr_p2_from').value, 10), to: parseInt(document.getElementById('sr_p2_to').value, 10), points: parseInt(document.getElementById('sr_p2_points').value, 10), fine: parseInt(document.getElementById('sr_p2_fine').value, 10) },
                { from: parseInt(document.getElementById('sr_p3_from').value, 10), to: parseInt(document.getElementById('sr_p3_to').value, 10), points: parseInt(document.getElementById('sr_p3_points').value, 10), fine: parseInt(document.getElementById('sr_p3_fine').value, 10) }
            ].filter(p => !isNaN(p.from) && !isNaN(p.to) && !isNaN(p.points) && !isNaN(p.fine))
        };
        if (!radarData.name || isNaN(radarData.limit)) { return; }
        post('saveNewStationaryRadar', radarData);
    });
    cancelStationaryBtn?.addEventListener('click', () => post('cancelStationaryRadarCreation'));

    document.getElementById('close-admin-app')?.addEventListener('click', () => {
        document.getElementById('radar-details-view').classList.add('hidden');
        document.getElementById('radar-details-placeholder').classList.remove('hidden');
        currentlySelectedRadar = null;
        post('admin:closeMenu');
    });
    document.getElementById('admin-create-stationary')?.addEventListener('click', () => post('admin:startStationaryCreation'));
    document.getElementById('admin-create-avg-zone')?.addEventListener('click', () => post('admin:startAvgZoneCreation'));
    document.getElementById('teleport-to-radar')?.addEventListener('click', () => {
        if (currentlySelectedRadar) { post('admin:teleportToRadar', { radar: currentlySelectedRadar }); }
    });
    
    document.getElementById('set-gps-location')?.addEventListener('click', () => {
        if (currentlySelectedRadar) { post('admin:setGpsLocation', { radar: currentlySelectedRadar }); }
    });
    document.getElementById('delete-radar')?.addEventListener('click', () => {
        if (currentlySelectedRadar) { post('admin:deleteRadar', { radar: currentlySelectedRadar }); }
    });
    document.getElementById('close-changelog')?.addEventListener('click', () => {
        document.getElementById('changelog-modal').classList.add('hidden');
    });
    document.getElementById('edit-radar-position')?.addEventListener('click', () => {
        if (!currentlySelectedRadar) return;

        confirmationData = { type: 'move_action', radar: currentlySelectedRadar };
        const textEl = document.getElementById('confirmation-text');
        const titleEl = document.querySelector('#confirmation-dialog h3');
        const yesBtn = document.getElementById('confirm-btn-yes');

        if (titleEl) titleEl.textContent = "Move Radar Position?";
        if (textEl) textEl.textContent = "You are about to move this radar to a new location. You will need to place the object marker to set the new coordinates. Continue?";
        if (yesBtn) yesBtn.textContent = "Yes, start moving";
        document.getElementById('confirmation-dialog').classList.remove('hidden');
    });
    document.getElementById('save-radar-changes')?.addEventListener('click', function() {
            if (!currentlySelectedRadar) return;

            const btn = this;
            const originalHTML = btn.innerHTML;
            const newPenalties = [];
            for (let i = 1; i <= 3; i++) {
                const from = parseInt(document.getElementById(`edit_p${i}_from`).value, 10);
                const to = parseInt(document.getElementById(`edit_p${i}_to`).value, 10);
                const points = parseInt(document.getElementById(`edit_p${i}_points`).value, 10);
                const fine = parseInt(document.getElementById(`edit_p${i}_fine`).value, 10);
                if (!isNaN(from) && !isNaN(to) && !isNaN(points) && !isNaN(fine)) {
                    newPenalties.push({ from, to, points, fine });
                }
            }
            const updatedData = {
                originalName: currentlySelectedRadar.name,
                type: currentlySelectedRadar.type,
                limit: parseInt(document.getElementById('edit-radar-limit').value, 10),
                speedingThreshold: parseInt(document.getElementById('edit-radar-threshold').value, 10) || null,
                penalties: newPenalties,
                enabled: document.getElementById('edit-radar-enabled').checked
            };

            post('admin:saveRadarChanges', { data: updatedData });

            btn.innerHTML = `<i class="fa-solid fa-check"></i> Saved!`;
            btn.classList.add('success');
            btn.disabled = true;

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('success');
                btn.disabled = false;
            }, 2000);

            currentlySelectedRadar.enabled = updatedData.enabled;
            const radarListItem = document.querySelector(`#radar-list li[data-name="${currentlySelectedRadar.name}"]`);
            if (radarListItem) {
                radarListItem.classList.toggle('disabled-radar', !updatedData.enabled);
            }
        });
        document.getElementById('confirm-btn-no')?.addEventListener('click', () => {
        document.getElementById('confirmation-dialog').classList.add('hidden');
        
        const yesBtn = document.getElementById('confirm-btn-yes');
        if (yesBtn) yesBtn.textContent = "Yes, save";
        const titleEl = document.querySelector('#confirmation-dialog h3');
        if (titleEl) titleEl.textContent = "Are you sure you want to continue?";
        
        confirmationData = null;
    });
    document.getElementById('confirm-btn-yes')?.addEventListener('click', () => {
        document.getElementById('confirmation-dialog').classList.add('hidden');
        
        const yesBtn = document.getElementById('confirm-btn-yes');
        if (yesBtn) yesBtn.textContent = "Yes, save";
        const titleEl = document.querySelector('#confirmation-dialog h3');
        if (titleEl) titleEl.textContent = "Are you sure you want to continue?";

        if (confirmationData) {
            if (confirmationData.type === 'stationary') { 
                post('proceedWithStationarySave', confirmationData.data); 
            }
            else if (confirmationData.type === 'avg') { 
                post('proceedWithAvgZoneSave', confirmationData.data); 
            }
            else if (confirmationData.type === 'move_action') {
                post('admin:editRadarPosition', { radar: confirmationData.radar });
            }
        }
        confirmationData = null;
    });
    let debounceTimer;
    const handleNameValidation = async (inputElement, saveButtonElement, type) => {
        const name = inputElement.value.trim();
        const errorElement = inputElement.nextElementSibling;
        const symbolLimitElement = errorElement.nextElementSibling;
        const maxLength = parseInt(inputElement.getAttribute('maxlength'), 10);
        inputElement.classList.remove('invalid');
        errorElement.classList.add('hidden');
        symbolLimitElement.classList.add('hidden');
        saveButtonElement.disabled = false;
        if (name === '') { saveButtonElement.disabled = true; return; }
        if (name.length >= maxLength) { symbolLimitElement.classList.remove('hidden'); }
        else { symbolLimitElement.classList.add('hidden'); }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const result = await post('checkNameExists', { name: name, type: type });
            if (result && result.exists) {
                inputElement.classList.add('invalid');
                errorElement.classList.remove('hidden');
                saveButtonElement.disabled = true;
            } else {
                inputElement.classList.remove('invalid');
                errorElement.classList.add('hidden');
                saveButtonElement.disabled = name.length > maxLength;
            }
        }, 300);
    };
    const newRadarNameInput = document.getElementById('new-radar-name');
    if (newRadarNameInput && saveStationaryBtn) {
        newRadarNameInput.addEventListener('input', () => { handleNameValidation(newRadarNameInput, saveStationaryBtn, 'stationary'); });
        saveStationaryBtn.disabled = true;
    }
    const zoneNameInput = document.getElementById('zone-name');
    if (zoneNameInput && saveZoneBtn) {
        zoneNameInput.addEventListener('input', () => { handleNameValidation(zoneNameInput, saveZoneBtn, 'avg'); });
        saveZoneBtn.disabled = true;
    }

    document.getElementById('trikojis-save')?.addEventListener('click', () => {
        const errorBox = document.getElementById('trikojis-error-message');
        errorBox.classList.add('hidden');

        const radarData = {
            limit: parseInt(document.getElementById('trikojis-limit').value, 10),
            showBlip: document.getElementById('trikojis-blip').checked,
            penalties: [
                { from: parseInt(document.getElementById('trikojis_p1_from').value, 10), to: parseInt(document.getElementById('trikojis_p1_to').value, 10), points: parseInt(document.getElementById('trikojis_p1_points').value, 10), fine: parseInt(document.getElementById('trikojis_p1_fine').value, 10) },
                { from: parseInt(document.getElementById('trikojis_p2_from').value, 10), to: parseInt(document.getElementById('trikojis_p2_to').value, 10), points: parseInt(document.getElementById('trikojis_p2_points').value, 10), fine: parseInt(document.getElementById('trikojis_p2_fine').value, 10) },
                { from: parseInt(document.getElementById('trikojis_p3_from').value, 10), to: parseInt(document.getElementById('trikojis_p3_to').value, 10), points: parseInt(document.getElementById('trikojis_p3_points').value, 10), fine: parseInt(document.getElementById('trikojis_p3_fine').value, 10) }
            ].filter(p => !isNaN(p.from) && !isNaN(p.to) && !isNaN(p.points) && !isNaN(p.fine))
        };
        
        const showError = (message) => {
            errorBox.textContent = message;
            errorBox.classList.remove('hidden');
        };

        if (isNaN(radarData.limit) || radarData.limit <= 0) {
            return showError('Error: The speed limit must be a valid number greater than zero.');
        }

        if (trikojisLimits && trikojisLimits.length > 0) {
            for (let i = 0; i < radarData.penalties.length; i++) {
                const tier = radarData.penalties[i];
                const limits = trikojisLimits[i]?.limits;
                if (!limits) continue;

                if (tier.from >= tier.to) {
                    return showError(`Error in Tier ${i + 1}: 'From' value (${tier.from}) must be less than 'To' value (${tier.to}).`);
                }
                if (i > 0) {
                    const prevTier = radarData.penalties[i - 1];
                    if (tier.from <= prevTier.to) {
                        return showError(`Error in Tier ${i + 1}: 'From' value (${tier.from}) must be greater than the previous tier's 'To' value (${prevTier.to}).`);
                    }
                }
                if (tier.from < limits.min_from) return showError(`Error in Tier ${i + 1}: 'From' value cannot be less than ${limits.min_from}.`);
                if (tier.to > limits.max_to) return showError(`Error in Tier ${i + 1}: 'To' value cannot be greater than ${limits.max_to}.`);
                if (tier.points < 0 || tier.points > limits.max_points) return showError(`Error in Tier ${i + 1}: Points cannot be more than ${limits.max_points}.`);
                if (tier.fine < 0 || tier.fine > limits.max_fine) return showError(`Error in Tier ${i + 1}: Fine cannot be more than ${limits.max_fine}.`);
            }
        }

        post('saveTrikojisConfig', radarData);
    });

    document.getElementById('trikojis-cancel')?.addEventListener('click', () => {
        post('cancelTrikojisPlacement');
    document.getElementById('trikojis-creator-panel').classList.add('hidden');
    document.getElementById('trikojis-error-message').classList.add('hidden');
    });

    document.getElementById('show-stationary-templates')?.addEventListener('click', () => {
        document.getElementById('stationary-templates-container').classList.toggle('hidden');
    });
    document.getElementById('show-avg-templates')?.addEventListener('click', () => {
        document.getElementById('avg-templates-container').classList.toggle('hidden');
    });
});

// HELPER FUNCTIONS FOR LOGS
function updatePlayerList(summary) {
    const playerList = document.getElementById('player-list');
    const tooltip = document.getElementById('custom-tooltip');
    if (!playerList || !tooltip) return;
    playerList.innerHTML = '';
    if (summary && summary.length > 0) {
        summary.forEach(player => {
            const li = document.createElement('li');
            li.setAttribute('data-identifier', player.identifier);
            li.innerHTML = `<span class="player-name">${player.player_name || 'Unknown'}</span>`;
            li.addEventListener('mouseenter', () => {
                tooltip.textContent = player.identifier;
                tooltip.classList.remove('hidden');
            });
            li.addEventListener('mousemove', (e) => {
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            });
            li.addEventListener('mouseleave', () => { tooltip.classList.add('hidden'); });
            li.addEventListener('click', () => {
                if (playerList.querySelector('li.active')) {
                    playerList.querySelector('li.active').classList.remove('active');
                }
                li.classList.add('active');
                document.getElementById('player-details-placeholder').classList.add('hidden');
                document.getElementById('player-details-view').classList.remove('hidden');
                document.getElementById('selected-player-name').textContent = player.player_name || 'Unknown';
                post('requestPlayerInfractions', { identifier: player.identifier });
            });
            playerList.appendChild(li);
        });
    } else {
        playerList.innerHTML = '<li class="no-results">No results found for the search.</li>';
    }
};

function updatePlayerDetails(data) {
    allPlayerInfractions = data.infractions || [];
    currentPage = 1;
    document.getElementById('revocation-count').textContent = `${data.revocationCount || 0} times.`;
    const licenseStatusEl = document.getElementById('license-status');
    if (data.revokedLicenses && data.revokedLicenses.length > 0) {
        const friendlyNames = data.revokedLicenses.map(type => licenseTypeTranslations[type] || type).join(', ');
        licenseStatusEl.textContent = `Revoked (${friendlyNames})`;
        licenseStatusEl.className = 'stat-value revoked';
    } else {
        licenseStatusEl.textContent = 'Valid';
        licenseStatusEl.className = 'stat-value valid';
    }
    document.getElementById('total-fines').textContent = `${data.totalFines || 0}$`;
    if (data.maxSpeeding && data.maxSpeeding.difference > 0) { document.getElementById('max-speeding').textContent = `${data.maxSpeeding.speed} / ${data.maxSpeeding.limit} km/h or mph`; }
    else { document.getElementById('max-speeding').textContent = 'N/A'; }
    if (data.mostFrequentZone && data.mostFrequentZone.count > 0) { document.getElementById('frequent-zone').textContent = `${data.mostFrequentZone.name} (${data.mostFrequentZone.count} times.)`; }
    else { document.getElementById('frequent-zone').textContent = 'N/A'; }
    renderInfractionsPage(currentPage);
};

function renderInfractionsPage(page) {
    const infractionsTableBody = document.getElementById('infractions-table-body');
    const pageInfoEl = document.getElementById('page-info');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    if (!infractionsTableBody || !pageInfoEl || !prevPageBtn || !nextPageBtn) return;
    infractionsTableBody.innerHTML = '';
    const totalPages = Math.ceil(allPlayerInfractions.length / infractionsPerPage);
    pageInfoEl.textContent = `Page ${page} of ${totalPages > 0 ? totalPages : 1}`;
    prevPageBtn.disabled = page === 1;
    nextPageBtn.disabled = page === totalPages || allPlayerInfractions.length === 0;
    if (allPlayerInfractions.length === 0) {
        infractionsTableBody.innerHTML = '<tr><td colspan="5" class="no-infractions">This player has no violations.</td></tr>';
        return;
    }
    const startIndex = (page - 1) * infractionsPerPage;
    const endIndex = startIndex + infractionsPerPage;
    const pageInfractions = allPlayerInfractions.slice(startIndex, endIndex);
    pageInfractions.forEach(infraction => {
        const date = new Date(infraction.timestamp).toLocaleString('lt-LT', { dateStyle: 'short', timeStyle: 'short' });
        const row = `
            <tr>
                <td>${date}</td>
                <td>${infraction.radar_name || 'N/A'} (${infraction.radar_type || 'N/A'})</td>
                <td><span class="log-speed-value">${infraction.player_speed}</span> / ${infraction.speed_limit} km/h or mph</td>
                <td>${infraction.fine_amount}$</td>
                <td>+${infraction.points_added}</td>
            </tr>
        `;
        infractionsTableBody.innerHTML += row;
    });
}

// HELPER FUNCTIONS FOR ADMIN MENU
function updateRadarList(radars, zones) {
    const radarListEl = document.getElementById('radar-list');
    radarListEl.innerHTML = '';

    document.getElementById('radar-details-view').classList.add('hidden');
    document.getElementById('radar-details-placeholder').classList.remove('hidden');
    currentlySelectedRadar = null;

    const allItems = [
        ...radars.map(r => ({ ...r, type: 'stationary' })),
        ...zones.map(z => ({ ...z, type: 'avg' }))
    ];

    if (allItems.length === 0) {
        radarListEl.innerHTML = '<li class="no-results">No radars or zones found.</li>';
        return;
    }

    allItems.sort((a, b) => a.name.localeCompare(b.name));

    allItems.forEach((item) => {
        const li = document.createElement('li');
        li.dataset.name = item.name;
        li.dataset.type = item.type;
        li.classList.toggle('disabled-radar', item.enabled === false);
        li.innerHTML = `
            <div class="radar-info-wrapper">
                <span class="radar-name">${item.name}</span>
                <div class="radar-stats">
                    <span><i class="fa-solid fa-video"></i> ${item.infraction_count || 0}</span>
                    <span><i class="fa-solid fa-sack-dollar"></i> $${item.total_fines || 0}</span>
                </div>
            </div>
            <span class="radar-type">${item.type === 'stationary' ? 'Stationary' : 'Average'}</span>
        `;

        li.addEventListener('click', () => {
            const currentActive = radarListEl.querySelector('li.active');
            if (currentActive) currentActive.classList.remove('active');
            li.classList.add('active');

            currentlySelectedRadar = item;
            displayRadarDetails(item);
        });

        radarListEl.appendChild(li);
    });
}

function displayRadarDetails(radar) {
    document.getElementById('radar-details-placeholder').classList.add('hidden');
    document.getElementById('radar-details-view').classList.remove('hidden');

    const iconClass = radar.type === 'stationary' ? 'fa-video' : 'fa-road';
    
    document.getElementById('selected-radar-name').innerHTML = 
        `<i class="fa-solid ${iconClass}"></i> ${radar.name}`;
    document.getElementById('edit-radar-limit').value = radar.limit;
    document.getElementById('edit-radar-threshold').value = radar.speedingThreshold || '';
    
    document.getElementById('edit-radar-enabled').checked = radar.enabled !== false;

    const addBtn = document.getElementById('add-radar-object');
    const delBtn = document.getElementById('delete-radar-object');
    const moveBtn = document.getElementById('edit-radar-position');

    if (radar.type === 'stationary') {
        moveBtn.classList.remove('hidden');
        
        if (radar.hasObject) {
            addBtn.classList.add('hidden');
            delBtn.classList.remove('hidden');
        } else {
            addBtn.classList.remove('hidden');
            delBtn.classList.add('hidden');
        }
    } else {
        moveBtn.classList.add('hidden'); 
        addBtn.classList.add('hidden');
        delBtn.classList.add('hidden');
    }

    for (let i = 1; i <= 3; i++) {
        document.getElementById(`edit_p${i}_from`).value = '';
        document.getElementById(`edit_p${i}_to`).value = '';
        document.getElementById(`edit_p${i}_points`).value = '';
        document.getElementById(`edit_p${i}_fine`).value = '';
    }

    if (radar.penalties) {
        radar.penalties.forEach((p, i) => {
            if (i < 3) {
                document.getElementById(`edit_p${i + 1}_from`).value = p.from;
                document.getElementById(`edit_p${i + 1}_to`).value = p.to;
                document.getElementById(`edit_p${i + 1}_points`).value = p.points;
                document.getElementById(`edit_p${i + 1}_fine`).value = p.fine;
            }
        });
    }
}

document.getElementById('delete-radar-object')?.addEventListener('click', () => {
    if (currentlySelectedRadar) {
        post('admin:deleteObject', { radarName: currentlySelectedRadar.name });
        document.getElementById('delete-radar-object').classList.add('hidden');
        document.getElementById('add-radar-object').classList.remove('hidden');
    }
});

document.getElementById('add-radar-object')?.addEventListener('click', () => {
    if (currentlySelectedRadar) {
        post('admin:addObject', { radarName: currentlySelectedRadar.name });
    }
});


// GENERAL CLOSE FUNCTION WITH THE "ESCAPE" KEY
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const changelogModal = document.getElementById('changelog-modal');
        if (changelogModal && !changelogModal.classList.contains('hidden')) {
            changelogModal.classList.add('hidden');
            return;
        }

        const confirmDialog = document.getElementById('confirmation-dialog');
        if (confirmDialog && !confirmDialog.classList.contains('hidden')) {
            confirmDialog.classList.add('hidden');
            confirmationData = null;
            return;
        }

        const editorPanel = document.getElementById('editor-panel');
        const logsApp = document.getElementById('radar-logs-app');
        const stationaryCreator = document.getElementById('stationary-radar-creator');
        const avgCreator = document.getElementById('avg-zone-creator');
        const adminApp = document.getElementById('radar-admin-app');
        const trikojisApp = document.getElementById('trikojis-creator-panel');

        if (editorPanel && !editorPanel.classList.contains('hidden')) { post('closeEditor'); }
        if (logsApp && !logsApp.classList.contains('hidden')) { post('closeLogsMenu'); }
        if (stationaryCreator && !stationaryCreator.classList.contains('hidden')) { post('cancelStationaryRadarCreation'); }
        if (avgCreator && !avgCreator.classList.contains('hidden')) { post('cancelAverageZoneCreation'); }
        if (trikojisApp && !trikojisApp.classList.contains('hidden')) { post('cancelTrikojisPlacement'); }
        if (adminApp && !adminApp.classList.contains('hidden')) { 
            post('admin:closeMenu'); 
        }
    }
});


// STATISTICS RENDERING FUNCTION
function renderStatistics(stats) {
    const lists = {
        topStationaryRadars: document.getElementById('top-stationary-radars-list'),
        topAverageZones: document.getElementById('top-average-zones-list'),
        topSpeeders: document.getElementById('top-speeders-list'),
        topFinePayers: document.getElementById('top-fine-payers-list'),
        topMobileRadars: document.getElementById('top-mobile-radars-list')
    };
    const tooltip = document.getElementById('custom-tooltip');

    const topOfficersList = document.getElementById('top-officers-radars-list');
    if (topOfficersList && stats.topOfficersByRadar) {
        topOfficersList.innerHTML = '';
        stats.topOfficersByRadar.forEach(item => {
            topOfficersList.innerHTML += `<li><span class="list-item-name">${item.owner_name || 'Unknown Officer'}</span><span class="list-item-value">${item.count} fines</span></li>`;
        });
    }

    for (const list of Object.values(lists)) {
        if (list) list.innerHTML = '';
    }

    stats.topStationaryRadars?.forEach(item => {
        lists.topStationaryRadars.innerHTML += `<li><span class="list-item-name">${item.radar_name || 'N/A'}</span><span class="list-item-value">${item.count} times</span></li>`;
    });
    stats.topAverageZones?.forEach(item => {
        lists.topAverageZones.innerHTML += `<li><span class="list-item-name">${item.radar_name || 'N/A'}</span><span class="list-item-value">${item.count} times</span></li>`;
    });
    stats.topSpeeders?.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="list-item-name">${item.player_name}</span><span class="list-item-value">+${item.max_over_speed} km/h</span>`;
        li.addEventListener('mouseenter', () => {
            tooltip.textContent = item.identifier;
            tooltip.classList.remove('hidden');
        });
        li.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY + 15) + 'px';
        });
        li.addEventListener('mouseleave', () => { tooltip.classList.add('hidden'); });
        lists.topSpeeders.appendChild(li);
    });
    stats.topFinePayers?.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="list-item-name">${item.player_name}</span><span class="list-item-value">${item.total_fines}$</span>`;
        li.addEventListener('mouseenter', () => {
            tooltip.textContent = item.identifier;
            tooltip.classList.remove('hidden');
        });
        li.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY + 15) + 'px';
        });
        li.addEventListener('mouseleave', () => { tooltip.classList.add('hidden'); });
        lists.topFinePayers.appendChild(li);
    });
    stats.topMobileRadars?.forEach(item => {
        lists.topMobileRadars.innerHTML += `<li><span class="list-item-name">${item.radar_name || 'N/A'}</span><span class="list-item-value">${item.count} times</span></li>`;
    });

    const topEarningRadarsList = document.getElementById('top-earning-radars-list');
    if (topEarningRadarsList && stats.topEarningRadars) {
        topEarningRadarsList.innerHTML = '';
        stats.topEarningRadars.forEach(item => {
            topEarningRadarsList.innerHTML += `<li><span class="list-item-name">${item.radar_name || 'N/A'}</span><span class="list-item-value">${item.total_collected}$</span></li>`;
        });
    }
    const dailyEarningsValue = document.getElementById('daily-earnings-value');
    if (dailyEarningsValue && stats.dailyEarnings && stats.dailyEarnings[0]) {
        dailyEarningsValue.textContent = `$${stats.dailyEarnings[0].daily_total || 0}`;
    } else if (dailyEarningsValue) {
        dailyEarningsValue.textContent = "$0";
    }
}

function applyPoliceStylesJS(settings) {
    const policeDetector = document.getElementById('detector-container');
    if (!policeDetector) return;

    policeDetector.style.top = settings.y + 'vh';
    policeDetector.style.left = settings.x + 'vw';
    policeDetector.style.bottom = 'auto';
    policeDetector.style.right = 'auto';
    policeDetector.style.transform = `translate(-50%, -50%) scale(${settings.scale})`;
}

function updatePolicePreview() {
    const settings = {
        y: parseFloat(document.getElementById('police-y-pos').value),
        x: parseFloat(document.getElementById('police-x-pos').value),
        scale: parseFloat(document.getElementById('police-scale').value)
    };
    applyPoliceStylesJS(settings);
}

const policePosSliders = ['police-y-pos', 'police-x-pos', 'police-scale'];
policePosSliders.forEach(id => {
    const slider = document.getElementById(id);
    if (slider) {
        slider.addEventListener('input', updatePolicePreview);
    }
});

    document.getElementById('police-save-settings')?.addEventListener('click', function() {
        const settings = {
            y: parseFloat(document.getElementById('police-y-pos').value),
            x: parseFloat(document.getElementById('police-x-pos').value),
            scale: parseFloat(document.getElementById('police-scale').value)
        };
        post('police_editor:save', settings);
        const btn = this;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-check"></i> Saved!`;
        btn.classList.add('success');
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('success');
            btn.disabled = false;
        }, 2000);
    });

document.getElementById('police-reset-settings')?.addEventListener('click', () => {
    post('police_editor:reset', {});
});

document.getElementById('police-close-editor-btn')?.addEventListener('click', () => {
    post('police_editor:close', {});
});

document.getElementById('mock-detector-toggle')?.addEventListener('change', (event) => {
    post('toggleMockPlayerDetector', { show: event.target.checked });
});

document.getElementById('mock-police-detector-toggle')?.addEventListener('change', (event) => {
    post('toggleMockPoliceDetector', { show: event.target.checked });
});

document.getElementById('police-back-btn')?.addEventListener('click', () => {
    post('goBackToPlayerMenu');
});

 const exportBtn = document.getElementById('export-radar-settings');
    const importBtn = document.getElementById('import-radar-settings');
    
    function gatherRadarSettingsFromForm() {
        const penalties = [];
        for (let i = 1; i <= 3; i++) {
            const from = parseInt(document.getElementById(`edit_p${i}_from`).value, 10);
            const to = parseInt(document.getElementById(`edit_p${i}_to`).value, 10);
            const points = parseInt(document.getElementById(`edit_p${i}_points`).value, 10);
            const fine = parseInt(document.getElementById(`edit_p${i}_fine`).value, 10);
            if (!isNaN(from) && !isNaN(to) && !isNaN(points) && !isNaN(fine)) {
                penalties.push({ from, to, points, fine });
            }
        }
        return {
            limit: parseInt(document.getElementById('edit-radar-limit').value, 10),
            speedingThreshold: parseInt(document.getElementById('edit-radar-threshold').value, 10) || null,
            penalties: penalties,
        };
    }

    function applyRadarSettingsToForm(settings) {
        if (!settings) return;

        document.getElementById('edit-radar-limit').value = settings.limit || '';
        document.getElementById('edit-radar-threshold').value = settings.speedingThreshold || '';
        for (let i = 1; i <= 3; i++) {
            document.getElementById(`edit_p${i}_from`).value = '';
            document.getElementById(`edit_p${i}_to`).value = '';
            document.getElementById(`edit_p${i}_points`).value = '';
            document.getElementById(`edit_p${i}_fine`).value = '';
        }

        settings.penalties.forEach((p, i) => {
            if (i < 3) {
                document.getElementById(`edit_p${i + 1}_from`).value = p.from;
                document.getElementById(`edit_p${i + 1}_to`).value = p.to;
                document.getElementById(`edit_p${i + 1}_points`).value = p.points;
                document.getElementById(`edit_p${i + 1}_fine`).value = p.fine;
            }
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!currentlySelectedRadar) return;
            settingsClipboard = gatherRadarSettingsFromForm();
            if (importBtn) importBtn.disabled = false;
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
            exportBtn.classList.add('success');
            setTimeout(() => {
                exportBtn.innerHTML = originalText;
                exportBtn.classList.remove('success');
            }, 2000);

            const activeListItem = document.querySelector('#radar-list li.active');
            if (activeListItem) {
                activeListItem.classList.add('copied-source');

                setTimeout(() => {
                    activeListItem.classList.remove('copied-source');
                }, 3500);
            }
        });
    }

    if (importBtn) {
        importBtn.addEventListener('click', () => {
            if (!settingsClipboard) return;
            applyRadarSettingsToForm(settingsClipboard);
            const originalText = importBtn.innerHTML;
            importBtn.innerHTML = `<i class="fa-solid fa-check"></i> Pasted!`;
            importBtn.classList.add('success');
            setTimeout(() => {
                importBtn.innerHTML = originalText;
                importBtn.classList.remove('success');
            }, 2000);
        });
    }

function getFormData(type) {
    const prefix = type === 'Stationary' ? 'sr_' : '';
    const limitId = type === 'Stationary' ? 'radar-limit' : 'zone-limit';
    const thresholdId = type === 'Stationary' ? 'new-radar-threshold' : 'zone-threshold';

    const limitEl = document.getElementById(limitId);
    if (!limitEl) return null;

    limitEl.style.borderColor = '';

    const limitVal = limitEl.value.trim();
    const limit = parseInt(limitVal, 10);
    const threshold = parseInt(document.getElementById(thresholdId).value, 10) || 0;

    if (limitVal === '' || isNaN(limit)) {
        console.log(`[DEBUG] Validation failed: Limit is empty or NaN. Value: "${limitVal}"`);
        limitEl.style.borderColor = '#e74c3c';
        limitEl.classList.add('shake-animation');
        limitEl.addEventListener('input', function() {
            this.style.borderColor = '';
        }, { once: true });

        return null;
    }

    const penalties = [];
    for (let i = 1; i <= 3; i++) {
        const fromEl = document.getElementById(`${prefix}p${i}_from`);
        const toEl = document.getElementById(`${prefix}p${i}_to`);
        const pointsEl = document.getElementById(`${prefix}p${i}_points`);
        const fineEl = document.getElementById(`${prefix}p${i}_fine`);

        if (fromEl && toEl && pointsEl && fineEl) {
            const from = parseInt(fromEl.value, 10);
            const to = parseInt(toEl.value, 10);
            const points = parseInt(pointsEl.value, 10);
            const fine = parseInt(fineEl.value, 10);

            if (!isNaN(from) && !isNaN(to) && !isNaN(points) && !isNaN(fine)) {
                penalties.push({ from, to, points, fine });
            }
        }
    }

    if (penalties.length === 0) {
        console.log("[DEBUG] Validation failed: No valid penalty tiers found.");
        return null; 
    }

    return { limit, speedingThreshold: threshold, penalties };
}

// TEMPLATE SAVING LOGIC

function openTemplateModal(data, type) {
    pendingTemplateData = { ...data, type: type };
    document.getElementById('template-input-name').value = '';
    document.getElementById('template-save-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('template-input-name').focus(), 100);
}

function closeTemplateModal() {
    document.getElementById('template-save-modal').classList.add('hidden');
    pendingTemplateData = null;
}

document.getElementById('create-stationary-template')?.addEventListener('click', () => {
    const data = getFormData('Stationary');
    if (!data) {
        console.log("Please fill in the limit and penalties first."); 
        return;
    }
    openTemplateModal(data, 'Stationary');
});

document.getElementById('create-avg-template')?.addEventListener('click', () => {
    const data = getFormData('AverageZone');
    if (!data) return;
    openTemplateModal(data, 'AverageZone');
});

document.getElementById('confirm-template-save')?.addEventListener('click', () => {
    const nameInput = document.getElementById('template-input-name');
    const name = nameInput.value.trim();

    if (!name) {
        nameInput.classList.add('invalid');
        return;
    }

    if (pendingTemplateData) {
        pendingTemplateData.name = name;
        post('admin:saveNewTemplate', pendingTemplateData);
        closeTemplateModal();
    }
});

document.getElementById('cancel-template-save')?.addEventListener('click', closeTemplateModal);
document.getElementById('close-template-modal')?.addEventListener('click', closeTemplateModal);

document.getElementById('template-input-name')?.addEventListener('input', function() {
    this.classList.remove('invalid');
});

document.getElementById('template-input-name')?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('confirm-template-save').click();
    }
});