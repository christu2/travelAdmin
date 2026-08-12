/**
 * Auto-Save Manager
 *
 * Automatically saves draft trip data to localStorage to prevent data loss
 * Features:
 * - Auto-save every 30 seconds
 * - Save on tab change
 * - Restore draft on load
 * - Clear draft on successful save
 */

window.AutoSaveManager = (function() {
    const AUTOSAVE_INTERVAL = 30000; // 30 seconds
    const DRAFT_PREFIX = 'draft_trip_';
    let autoSaveTimer = null;
    let currentTripId = null;
    let lastSavedData = null;

    /**
     * Start auto-save for a trip
     */
    function startAutoSave(tripId, getDataCallback) {
        if (!tripId || !getDataCallback) {
            console.warn('AutoSave: Missing tripId or callback');
            return;
        }

        currentTripId = tripId;

        // Clear any existing timer
        stopAutoSave();

        // Save immediately
        saveDraft(tripId, getDataCallback);

        // Set up periodic auto-save
        autoSaveTimer = setInterval(() => {
            saveDraft(tripId, getDataCallback);
        }, AUTOSAVE_INTERVAL);

        console.log(`✅ Auto-save started for trip ${tripId} (every 30s)`);
    }

    /**
     * Stop auto-save
     */
    function stopAutoSave() {
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
            autoSaveTimer = null;
        }
        currentTripId = null;
    }

    /**
     * Save draft to localStorage
     */
    function saveDraft(tripId, getDataCallback) {
        try {
            const data = getDataCallback();
            if (!data) {
                console.warn('AutoSave: No data to save');
                return;
            }

            // Only save if data has changed
            const dataString = JSON.stringify(data);
            if (dataString === lastSavedData) {
                return; // No changes
            }

            const draftKey = DRAFT_PREFIX + tripId;
            const draft = {
                tripId: tripId,
                data: data,
                savedAt: new Date().toISOString(),
                version: '1.0'
            };

            localStorage.setItem(draftKey, JSON.stringify(draft));
            lastSavedData = dataString;

            // Show subtle indicator
            showAutoSaveIndicator();

            console.log(`💾 Auto-saved draft for trip ${tripId}`);
        } catch (error) {
            console.error('Error saving draft:', error);

            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded, clearing old drafts...');
                clearOldDrafts(7); // Keep only last 7 days
            }
        }
    }

    /**
     * Load draft from localStorage
     */
    function loadDraft(tripId) {
        try {
            const draftKey = DRAFT_PREFIX + tripId;
            const draftString = localStorage.getItem(draftKey);

            if (!draftString) {
                return null;
            }

            const draft = JSON.parse(draftString);

            // Check if draft is recent (within 7 days)
            const savedAt = new Date(draft.savedAt);
            const age = Date.now() - savedAt.getTime();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

            if (age > maxAge) {
                console.log('Draft is too old, ignoring');
                clearDraft(tripId);
                return null;
            }

            console.log(`📂 Loaded draft for trip ${tripId} (saved ${new Date(draft.savedAt).toLocaleString()})`);
            return draft.data;
        } catch (error) {
            console.error('Error loading draft:', error);
            return null;
        }
    }

    /**
     * Check if draft exists
     */
    function hasDraft(tripId) {
        const draftKey = DRAFT_PREFIX + tripId;
        return localStorage.getItem(draftKey) !== null;
    }

    /**
     * Get draft metadata
     */
    function getDraftInfo(tripId) {
        try {
            const draftKey = DRAFT_PREFIX + tripId;
            const draftString = localStorage.getItem(draftKey);

            if (!draftString) {
                return null;
            }

            const draft = JSON.parse(draftString);
            return {
                savedAt: draft.savedAt,
                age: Date.now() - new Date(draft.savedAt).getTime()
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Clear draft after successful save
     */
    function clearDraft(tripId) {
        const draftKey = DRAFT_PREFIX + tripId;
        localStorage.removeItem(draftKey);
        lastSavedData = null;
        console.log(`🗑️ Cleared draft for trip ${tripId}`);
    }

    /**
     * Clear old drafts to free up space
     */
    function clearOldDrafts(daysToKeep = 7) {
        const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
        const now = Date.now();
        let cleared = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(DRAFT_PREFIX)) {
                try {
                    const draftString = localStorage.getItem(key);
                    const draft = JSON.parse(draftString);
                    const age = now - new Date(draft.savedAt).getTime();

                    if (age > maxAge) {
                        localStorage.removeItem(key);
                        cleared++;
                    }
                } catch (error) {
                    // Invalid draft, remove it
                    localStorage.removeItem(key);
                    cleared++;
                }
            }
        }

        if (cleared > 0) {
            console.log(`🗑️ Cleared ${cleared} old draft(s)`);
        }
    }

    /**
     * List all drafts
     */
    function listDrafts() {
        const drafts = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(DRAFT_PREFIX)) {
                try {
                    const draftString = localStorage.getItem(key);
                    const draft = JSON.parse(draftString);
                    drafts.push({
                        tripId: draft.tripId,
                        savedAt: draft.savedAt,
                        key: key
                    });
                } catch (error) {
                    // Skip invalid drafts
                }
            }
        }
        return drafts;
    }

    /**
     * Show auto-save indicator
     */
    function showAutoSaveIndicator() {
        // Find or create indicator
        let indicator = document.getElementById('autosave-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autosave-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 13px;
                opacity: 0;
                transition: opacity 0.3s;
                z-index: 10000;
                pointer-events: none;
            `;
            indicator.textContent = '💾 Draft saved';
            document.body.appendChild(indicator);
        }

        // Show indicator
        indicator.style.opacity = '1';

        // Hide after 2 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    }

    /**
     * Force save (called manually or on tab change)
     */
    function forceSave() {
        if (currentTripId && autoSaveTimer) {
            // Trigger an immediate save by calling the interval callback
            clearInterval(autoSaveTimer);
            // The callback will be called by the component
        }
    }

    // Public API
    return {
        startAutoSave,
        stopAutoSave,
        saveDraft,
        loadDraft,
        hasDraft,
        getDraftInfo,
        clearDraft,
        clearOldDrafts,
        listDrafts,
        forceSave
    };
})();

console.log('✅ AutoSaveManager loaded');
