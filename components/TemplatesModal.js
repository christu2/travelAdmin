/**
 * Saved Destination Templates Modal & Pure Helpers
 *
 * Allows travel consultants to save any curated itinerary as a reusable template under
 * admin-only Firestore (`admin/templates/items/{id}`) and apply it to new client trips
 * in 1 click with automatic trip-date remapping and fresh IDs.
 */

(function (globalScope) {
    function formatDateOnly(val) {
        if (!val) return '';
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
            return val.slice(0, 10);
        }
        const d = typeof val?.toDate === 'function' ? val.toDate() : new Date(val);
        if (isNaN(d.getTime())) return '';
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function diffNights(startStr, endStr) {
        if (!startStr || !endStr) return null;
        const s = new Date(`${startStr}T12:00:00Z`);
        const e = new Date(`${endStr}T12:00:00Z`);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
        return Math.max(1, Math.round((e - s) / 86400000));
    }

    function addDays(startStr, offsetDays) {
        const d = new Date(`${startStr}T12:00:00Z`);
        if (isNaN(d.getTime())) return startStr;
        d.setUTCDate(d.getUTCDate() + offsetDays);
        return formatDateOnly(d);
    }

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj || {}));
    }

    /**
     * Extracts a clean, reusable template object from an existing recommendation.
     */
    function buildTemplateFromRecommendation({ name, tags = [], recommendation, createdBy = '' }) {
        const cleanRec = deepClone(recommendation || {});
        const destinations = Array.isArray(cleanRec.destinations) ? cleanRec.destinations : [];
        const cityNames = destinations.map(d => d.cityName).filter(Boolean);
        const hotelCount = destinations.reduce((acc, d) => acc + (d.accommodationOptions?.length || 0), 0);
        const activityCount = destinations.reduce((acc, d) => acc + (d.recommendedActivities?.length || 0), 0);
        const diningCount = destinations.reduce((acc, d) => acc + (d.recommendedRestaurants?.length || 0), 0);

        return {
            name: String(name || cityNames.join(' → ') || 'Untitled Template').trim(),
            tags: Array.isArray(tags)
                ? tags.map(t => String(t).trim()).filter(Boolean)
                : String(tags || '').split(',').map(t => t.trim()).filter(Boolean),
            cityNames,
            summary: {
                destinations: destinations.length,
                hotels: hotelCount,
                activities: activityCount,
                dining: diningCount
            },
            createdBy,
            recommendation: {
                tripOverview: cleanRec.tripOverview || '',
                costNotes: cleanRec.costNotes || '',
                destinations,
                logistics: cleanRec.logistics || { transportSegments: [], generalInstructions: '', bookingDeadlines: [] },
                totalCost: cleanRec.totalCost || {
                    totalEstimate: 0,
                    flights: 0,
                    accommodation: 0,
                    activities: 0,
                    food: 0,
                    localTransport: 0,
                    miscellaneous: 0,
                    currency: 'USD'
                }
            }
        };
    }

    /**
     * Clones a saved template onto a target client trip, assigning fresh IDs and
     * remapping destination dates to match the target trip's startDate/endDate.
     */
    function applyTemplateToTrip(template, targetTrip) {
        const cloned = deepClone(template?.recommendation || {});
        const stamp = Date.now().toString(36);
        const tripStart = formatDateOnly(targetTrip?.startDate);
        const tripEnd = formatDateOnly(targetTrip?.endDate);
        const totalTripNights = diffNights(tripStart, tripEnd);

        const rawDestinations = Array.isArray(cloned.destinations) ? cloned.destinations : [];
        let cursorDate = tripStart;

        const mappedDestinations = rawDestinations.map((dest, idx) => {
            const newDest = deepClone(dest);
            newDest.id = `dest_${stamp}_${idx + 1}`;

            if (tripStart) {
                const isSingle = rawDestinations.length === 1;
                const nights = isSingle && totalTripNights
                    ? totalTripNights
                    : Math.max(1, Number(dest.numberOfNights) || 2);
                const arrival = cursorDate;
                const departure = isSingle && tripEnd ? tripEnd : addDays(arrival, nights);
                newDest.arrivalDate = arrival;
                newDest.departureDate = departure;
                newDest.numberOfNights = diffNights(arrival, departure) || nights;
                cursorDate = departure;
            }

            if (Array.isArray(newDest.accommodationOptions)) {
                newDest.accommodationOptions = newDest.accommodationOptions.map((opt, i) => ({
                    ...opt,
                    id: `acc_${stamp}_${idx + 1}_${i + 1}`,
                    isBooked: false
                }));
            }
            if (Array.isArray(newDest.recommendedActivities)) {
                newDest.recommendedActivities = newDest.recommendedActivities.map((act, i) => ({
                    ...act,
                    id: `act_${stamp}_${idx + 1}_${i + 1}`
                }));
            }
            if (Array.isArray(newDest.recommendedRestaurants)) {
                newDest.recommendedRestaurants = newDest.recommendedRestaurants.map((rest, i) => ({
                    ...rest,
                    id: `rest_${stamp}_${idx + 1}_${i + 1}`
                }));
            }
            return newDest;
        });

        return {
            ...cloned,
            id: targetTrip?.id || `rec_${stamp}`,
            destinations: mappedDestinations,
            _appliedFromTemplate: template?.name || 'Template'
        };
    }

    const TemplateHelpers = {
        buildTemplateFromRecommendation,
        applyTemplateToTrip,
        formatDateOnly,
        diffNights
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = TemplateHelpers;
    }

    if (typeof window !== 'undefined') {
        window.TemplateHelpers = TemplateHelpers;

        window.TemplatesModal = ({ isOpen, onClose, selectedTrip, currentRecommendation, currentUser, onApplyTemplate }) => {
            const [templates, setTemplates] = React.useState([]);
            const [loading, setLoading] = React.useState(false);
            const [searchQuery, setSearchQuery] = React.useState('');
            const [templateName, setTemplateName] = React.useState('');
            const [templateTags, setTemplateTags] = React.useState('');
            const [statusMsg, setStatusMsg] = React.useState('');
            const [isSaving, setIsSaving] = React.useState(false);

            const collectionRef = () => firebase.firestore().collection('admin').doc('templates').collection('items');

            React.useEffect(() => {
                if (!isOpen) return;
                const defaultCities = (currentRecommendation?.destinations || [])
                    .map(d => d.cityName)
                    .filter(Boolean)
                    .join(' → ');
                setTemplateName(defaultCities ? `${defaultCities} Template` : (selectedTrip?.destination || 'New Template'));
                setStatusMsg('');

                setLoading(true);
                const unsubscribe = collectionRef()
                    .orderBy('createdAt', 'desc')
                    .onSnapshot((snap) => {
                        setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                        setLoading(false);
                    }, (err) => {
                        console.error('Failed to load templates:', err);
                        setStatusMsg('Could not load saved templates.');
                        setLoading(false);
                    });

                return () => unsubscribe();
            }, [isOpen]);

            if (!isOpen) return null;

            const handleSaveCurrentAsTemplate = async () => {
                if (!templateName.trim() || !currentRecommendation) return;
                setIsSaving(true);
                setStatusMsg('');
                try {
                    const tpl = buildTemplateFromRecommendation({
                        name: templateName,
                        tags: templateTags,
                        recommendation: currentRecommendation,
                        createdBy: currentUser?.email || ''
                    });
                    await collectionRef().add({
                        ...tpl,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    setTemplateTags('');
                    setStatusMsg(`✅ Saved "${tpl.name}" to your Template Library!`);
                } catch (err) {
                    console.error('Save template error:', err);
                    setStatusMsg(`❌ Failed to save template: ${err.message}`);
                } finally {
                    setIsSaving(false);
                }
            };

            const handleApply = (tpl) => {
                const applied = applyTemplateToTrip(tpl, selectedTrip);
                onApplyTemplate(applied);
                setStatusMsg(`✅ Applied "${tpl.name}" with dates remapped to this trip!`);
                setTimeout(() => onClose(), 400);
            };

            const handleDelete = async (tpl) => {
                if (!window.confirm(`Delete template "${tpl.name}"?`)) return;
                try {
                    await collectionRef().doc(tpl.id).delete();
                } catch (err) {
                    setStatusMsg(`❌ Could not delete template: ${err.message}`);
                }
            };

            const filtered = templates.filter(t => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (t.name || '').toLowerCase().includes(q) ||
                    (t.cityNames || []).join(' ').toLowerCase().includes(q) ||
                    (t.tags || []).join(' ').toLowerCase().includes(q);
            });

            return React.createElement('div', {
                style: {
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.55)', zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                },
                onClick: (e) => { if (e.target === e.currentTarget) onClose(); }
            }, React.createElement('div', {
                style: {
                    background: 'white', borderRadius: '14px', width: '100%', maxWidth: '720px',
                    maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden'
                }
            }, [
                // Header
                React.createElement('div', {
                    key: 'hdr',
                    style: {
                        padding: '18px 24px', borderBottom: '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'linear-gradient(135deg, #0f766e 0%, #0ea5e9 100%)', color: 'white'
                    }
                }, [
                    React.createElement('div', { key: 't' }, [
                        React.createElement('h3', { key: 'h', style: { margin: 0, fontSize: '18px' } }, '📚 Saved Destination Templates'),
                        React.createElement('p', { key: 's', style: { margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 } }, 'Reuse your best itineraries in 1 click — dates auto-adjust to this client.')
                    ]),
                    React.createElement('button', {
                        key: 'x',
                        onClick: onClose,
                        style: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: '600' }
                    }, '✕ Close')
                ]),

                // Body
                React.createElement('div', {
                    key: 'body',
                    style: { padding: '20px 24px', overflowY: 'auto', flex: 1 }
                }, [
                    statusMsg && React.createElement('div', {
                        key: 'status',
                        style: {
                            padding: '10px 14px', borderRadius: '8px', marginBottom: '14px',
                            background: statusMsg.startsWith('✅') ? '#ecfdf5' : '#fef2f2',
                            color: statusMsg.startsWith('✅') ? '#065f46' : '#991b1b',
                            fontSize: '13px', fontWeight: '500'
                        }
                    }, statusMsg),

                    // Save Current Itinerary as Template
                    React.createElement('div', {
                        key: 'save-box',
                        style: {
                            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
                            padding: '16px', marginBottom: '20px'
                        }
                    }, [
                        React.createElement('div', { key: 'st', style: { fontWeight: '600', marginBottom: '10px', color: '#0f172a' } }, '💾 Save Current Itinerary as Reusable Template'),
                        React.createElement('div', { key: 'row', style: { display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' } }, [
                            React.createElement('input', {
                                key: 'name',
                                type: 'text',
                                placeholder: 'Template name (e.g. Madison Weekend on Hyatt Pts)',
                                value: templateName,
                                onChange: (e) => setTemplateName(e.target.value),
                                style: { padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }
                            }),
                            React.createElement('input', {
                                key: 'tags',
                                type: 'text',
                                placeholder: 'Tags (comma-separated, e.g. Hyatt, Weekend)',
                                value: templateTags,
                                onChange: (e) => setTemplateTags(e.target.value),
                                style: { padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }
                            }),
                            React.createElement('button', {
                                key: 'btn',
                                className: 'btn btn-primary',
                                disabled: isSaving || !templateName.trim(),
                                onClick: handleSaveCurrentAsTemplate,
                                style: { whiteSpace: 'nowrap', padding: '8px 14px', fontSize: '13px' }
                            }, isSaving ? 'Saving...' : 'Save Template')
                        ])
                    ]),

                    // Search Library
                    React.createElement('div', { key: 'search-row', style: { marginBottom: '14px' } }, [
                        React.createElement('input', {
                            key: 'q',
                            type: 'text',
                            placeholder: '🔍 Filter templates by city, name, or tag...',
                            value: searchQuery,
                            onChange: (e) => setSearchQuery(e.target.value),
                            style: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }
                        })
                    ]),

                    // Templates List
                    loading ? React.createElement('p', { key: 'ld', style: { textAlign: 'center', color: '#64748b' } }, 'Loading templates...') :
                    filtered.length === 0 ? React.createElement('p', { key: 'empty', style: { textAlign: 'center', color: '#64748b', padding: '24px 0' } }, 'No templates saved yet. Save your current itinerary above to start your reusable library!') :
                    React.createElement('div', { key: 'list', style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
                        filtered.map(tpl => React.createElement('div', {
                            key: tpl.id,
                            style: {
                                border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'
                            }
                        }, [
                            React.createElement('div', { key: 'info' }, [
                                React.createElement('div', { key: 'nm', style: { fontWeight: '600', color: '#0f172a', fontSize: '15px' } }, tpl.name),
                                React.createElement('div', { key: 'meta', style: { fontSize: '12px', color: '#64748b', marginTop: '4px' } },
                                    `📍 ${(tpl.cityNames || []).join(' → ') || 'Custom'} · 🏨 ${tpl.summary?.hotels || 0} hotels · 🎯 ${tpl.summary?.activities || 0} activities · 🍽️ ${tpl.summary?.dining || 0} dining`
                                ),
                                (tpl.tags || []).length > 0 && React.createElement('div', { key: 'tags', style: { marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' } },
                                    tpl.tags.map((tag, i) => React.createElement('span', {
                                        key: i,
                                        style: { fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '999px' }
                                    }, tag))
                                )
                            ]),
                            React.createElement('div', { key: 'acts', style: { display: 'flex', gap: '8px', flexShrink: 0 } }, [
                                React.createElement('button', {
                                    key: 'apply',
                                    className: 'btn btn-primary',
                                    style: { padding: '6px 12px', fontSize: '13px' },
                                    onClick: () => handleApply(tpl)
                                }, 'Apply to Trip'),
                                React.createElement('button', {
                                    key: 'del',
                                    className: 'btn btn-secondary',
                                    style: { padding: '6px 10px', fontSize: '12px', color: '#dc2626' },
                                    onClick: () => handleDelete(tpl)
                                }, '🗑')
                            ])
                        ]))
                    )
                ])
            ]));
        };

        console.log('✅ TemplatesModal component loaded');
    }
})(typeof window !== 'undefined' ? window : global);
