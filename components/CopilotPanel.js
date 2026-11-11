/**
 * CopilotPanel Component
 * 
 * Precision "Dictate-to-Form" Conversational AI Assistant for WanderMint
 * Allows the consultant to dictate or type chosen flights, points strategies,
 * hotels, activities, and restaurants, and automatically populates every
 * nested dashboard field, calculates nights/costs, and enriches place details.
 */

window.CopilotPanel = ({ selectedTrip, newRecommendation, setNewRecommendation, updateRecommendation }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [inputMessage, setInputMessage] = React.useState('');
    const [isListening, setIsListening] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [userPointsProfile, setUserPointsProfile] = React.useState(null);
    const [undoStack, setUndoStack] = React.useState([]);
    const [messages, setMessages] = React.useState([
        {
            role: 'assistant',
            text: `👋 Ready for your dictation! Tell me the flights, points transfers, hotels, activities, or restaurants you picked (e.g., "Fly them JFK to CDG on Air France AF 11 May 12 at 7:30pm arriving 8:45am+1 in Business for 50k Flying Blue + $210, and put them at Park Hyatt Paris May 13-16 for 45k Hyatt pts/night"), and I'll fill out all the tabs, airport codes, hotel details, and cost math automatically.`
        }
    ]);
    const [lastAction, setLastAction] = React.useState(null);

    const messagesEndRef = React.useRef(null);
    const recognitionRef = React.useRef(null);

    // Listen for top-bar "Dictate to AI Copilot" button
    React.useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-wandermint-copilot', handleOpen);
        return () => window.removeEventListener('open-wandermint-copilot', handleOpen);
    }, []);

    // Load the user's points balance so Copilot knows what points programs they hold
    React.useEffect(() => {
        if (!selectedTrip?.userId || !window.firebase?.firestore) return;
        firebase.firestore().collection('userPoints').doc(selectedTrip.userId).get()
            .then(doc => {
                if (doc.exists) {
                    setUserPointsProfile(doc.data());
                }
            })
            .catch(err => console.warn('Could not load userPoints for Copilot context:', err));
    }, [selectedTrip?.userId]);

    // Auto-scroll messages
    React.useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Setup Web Speech API for continuous voice dictation
    React.useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let newTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        newTranscript += event.results[i][0].transcript + ' ';
                    }
                }
                if (newTranscript.trim()) {
                    setInputMessage(prev => prev ? `${prev.trim()} ${newTranscript.trim()}` : newTranscript.trim());
                }
            };

            recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Browser speech recognition is not supported here. Please use Chrome, Safari, or macOS dictation (Fn+Fn).');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error('Failed to start speech recognition:', err);
                setIsListening(false);
            }
        }
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        const previousRec = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, -1));
        setNewRecommendation(previousRec);
        setLastAction('Reverted last AI edit');
    };

    // Auto-enrich any newly added/updated hotels missing location/photo/links
    const enrichHotelsIfNeeded = async (rec) => {
        if (!rec?.destinations) return rec;
        let enriched = JSON.parse(JSON.stringify(rec));
        let changed = false;
        const hotelProxyUrl = window.HOTEL_PROXY_URL || 'http://localhost:3002';

        for (let dIdx = 0; dIdx < enriched.destinations.length; dIdx++) {
            const dest = enriched.destinations[dIdx];
            const options = dest.accommodationOptions || [];
            for (let aIdx = 0; aIdx < options.length; aIdx++) {
                const hotel = options[aIdx].hotel;
                if (!hotel?.name) continue;
                const needsEnrich = !hotel.photoUrl || !hotel.location || hotel.location === dest.cityName;
                if (!needsEnrich) continue;

                const query = `${hotel.name} ${dest.cityName || ''}`.trim();
                try {
                    let place = null;
                    try {
                        const res = await fetch(`${hotelProxyUrl}/api/places/enrich?query=${encodeURIComponent(query)}&type=lodging`);
                        if (res.ok) {
                            const data = await res.json();
                            place = data.place || (data.results && data.results[0]);
                        }
                    } catch (_) {
                        const token = window.firebase?.auth?.().currentUser
                            ? await window.firebase.auth().currentUser.getIdToken()
                            : '';
                        const cfUrl = `https://us-central1-wandermint-travel-app.cloudfunctions.net/googlePlacesProxy?query=${encodeURIComponent(query)}`;
                        const cfRes = await fetch(cfUrl, {
                            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                        });
                        if (cfRes.ok) {
                            const cfData = await cfRes.json();
                            place = cfData.place || (cfData.results && cfData.results[0]);
                        }
                    }

                    if (place) {
                        if (!hotel.location || hotel.location === dest.cityName) {
                            hotel.location = place.address || place.formatted_address || hotel.location;
                        }
                        if (!hotel.photoUrl && place.photoUrl) {
                            hotel.photoUrl = place.photoUrl;
                        }
                        if (!hotel.bookingUrl && place.website) {
                            hotel.bookingUrl = place.website;
                        }
                        if (!hotel.tripadvisorUrl && (place.tripadvisorUrl || place.mapsUrl)) {
                            hotel.tripadvisorUrl = place.tripadvisorUrl || place.mapsUrl;
                        }
                        if (place.rating && (!hotel.rating || hotel.rating === 4)) {
                            hotel.rating = Math.min(5, Math.max(1, parseFloat(place.rating)));
                        }
                        changed = true;
                    }
                } catch (e) {
                    console.warn('Auto-enrichment skipped for', hotel.name, e.message);
                }
            }
        }
        return changed ? enriched : rec;
    };

    const sendMessage = async (textToSend = null) => {
        const text = (textToSend || inputMessage).trim();
        if (!text || isLoading) return;

        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        const userMsg = { role: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        if (!textToSend) setInputMessage('');
        setIsLoading(true);
        setLastAction(null);

        try {
            const hotelProxyUrl = window.HOTEL_PROXY_URL || 'http://localhost:3002';
            const history = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                text: m.text
            }));

            const payload = {
                message: text,
                history,
                tripContext: {
                    ...(selectedTrip || {}),
                    userPointsProfile: userPointsProfile || null
                },
                currentRecommendation: newRecommendation || {}
            };

            let data = null;
            // Try local proxy first; if unavailable, fall back to Firebase Cloud Function
            try {
                const response = await fetch(`${hotelProxyUrl}/api/copilot/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                data = await response.json();
            } catch (localErr) {
                const token = window.firebase?.auth?.().currentUser
                    ? await window.firebase.auth().currentUser.getIdToken()
                    : '';
                const cfUrl = 'https://us-central1-wandermint-travel-app.cloudfunctions.net/copilotChat';
                const cfResponse = await fetch(cfUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(payload)
                });
                data = await cfResponse.json();
            }

            if (data && data.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    text: data.reply,
                    actionSummary: data.actionSummary
                }]);

                if (data.updatedRecommendation && typeof setNewRecommendation === 'function') {
                    // Save previous state to undo stack
                    if (newRecommendation) {
                        setUndoStack(prev => [...prev.slice(-9), JSON.parse(JSON.stringify(newRecommendation))]);
                    }

                    const normalized = window.DataHelpers?.normalizeAndCalculateRecommendation
                        ? window.DataHelpers.normalizeAndCalculateRecommendation(data.updatedRecommendation)
                        : data.updatedRecommendation;

                    setNewRecommendation(normalized);
                    setLastAction(data.actionSummary || 'All form tabs & costs updated');

                    // Background enrich hotels with photos/addresses/links if needed
                    enrichHotelsIfNeeded(normalized).then(enriched => {
                        if (enriched !== normalized) {
                            setNewRecommendation(enriched);
                        }
                    });
                }
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    text: data?.reply || `⚠️ ${data?.error || 'Failed to process request'}`
                }]);
            }
        } catch (error) {
            console.error('Copilot request failed:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: `⚠️ Error connecting to Copilot: ${error.message}. Start local proxy (node hotel-proxy-server.js) or deploy Cloud Functions.`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const quickTemplates = [
        {
            label: '✈️ Dictate Flights + Points',
            fill: 'Outbound flight: [Airline + Flight #] from [Origin] to [Dest] on [Date] departing [Time] arriving [Time], [Cabin Class], cost: [Points] [Program] pts + $[Tax] cash. Return flight: '
        },
        {
            label: '🏨 Dictate Hotels + Points',
            fill: 'In [City] ([Check-in] to [Check-out]), add Hotel Option 1: [Hotel Name] at $[Cash]/night or [Points] [Program] pts/night. Booking instructions: '
        },
        {
            label: '🍽️ Add Activities & Dining',
            fill: 'For [City], add these activities: [Activity 1, Activity 2] and these restaurants: [Restaurant 1, Restaurant 2], filling in descriptions, tips, and links.'
        },
        {
            label: '💳 Write Points Transfer Strategy',
            fill: 'Based on the flights and hotels currently in the recommendation and the user\'s points balance, write clear step-by-step points transfer & booking instructions in costNotes and generalInstructions.'
        }
    ];

    if (!isOpen) {
        return React.createElement('div', {
            style: {
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 1000
            }
        }, [
            React.createElement('button', {
                key: 'open-btn',
                onClick: () => setIsOpen(true),
                style: {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '600',
                    boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                }
            }, [
                React.createElement('span', { key: 'icon', style: { fontSize: '18px' } }, '🎙️'),
                React.createElement('span', { key: 'text' }, 'AI Dictation Copilot'),
                lastAction && React.createElement('span', {
                    key: 'badge',
                    style: {
                        background: '#10b981',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        marginLeft: '4px'
                    }
                }, 'Updated')
            ])
        ]);
    }

    return React.createElement('div', {
        style: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '450px',
            maxWidth: 'calc(100vw - 40px)',
            height: '650px',
            maxHeight: 'calc(100vh - 40px)',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
    }, [
        // Header
        React.createElement('div', {
            key: 'header',
            style: {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }
        }, [
            React.createElement('div', {
                key: 'header-title',
                style: { display: 'flex', alignItems: 'center', gap: '8px' }
            }, [
                React.createElement('span', { key: 'icon', style: { fontSize: '20px' } }, '🎙️'),
                React.createElement('div', { key: 'title-info' }, [
                    React.createElement('div', { key: 'name', style: { fontWeight: '700', fontSize: '15px' } }, 'WanderMint Dictation Copilot'),
                    React.createElement('div', { key: 'sub', style: { fontSize: '11px', opacity: 0.9 } }, 'Gemini 2.5 Flash • Auto-fills Flights, Hotels, Links & Math')
                ])
            ]),
            React.createElement('div', {
                key: 'header-actions',
                style: { display: 'flex', alignItems: 'center', gap: '8px' }
            }, [
                undoStack.length > 0 && React.createElement('button', {
                    key: 'undo-btn',
                    onClick: handleUndo,
                    title: 'Revert last AI update',
                    style: {
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.35)',
                        color: 'white',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600'
                    }
                }, '↩️ Undo'),
                React.createElement('button', {
                    key: 'close-btn',
                    onClick: () => setIsOpen(false),
                    style: {
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }
                }, '✕')
            ])
        ]),

        // Last Action Alert
        lastAction && React.createElement('div', {
            key: 'last-action',
            style: {
                background: '#ecfdf5',
                color: '#065f46',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                borderBottom: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }
        }, [
            React.createElement('span', { key: 'text' }, `⚡ ${lastAction}`),
            undoStack.length > 0 && React.createElement('button', {
                key: 'inline-undo',
                onClick: handleUndo,
                style: {
                    background: 'transparent',
                    border: 'none',
                    color: '#047857',
                    textDecoration: 'underline',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: '600'
                }
            }, 'Undo')
        ]),

        // Messages Container
        React.createElement('div', {
            key: 'messages-list',
            style: {
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: '#f8fafc'
            }
        }, [
            ...messages.map((m, idx) =>
                React.createElement('div', {
                    key: `msg-${idx}`,
                    style: {
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '88%',
                        background: m.role === 'user' ? '#4f46e5' : '#ffffff',
                        color: m.role === 'user' ? '#ffffff' : '#1e293b',
                        padding: '10px 14px',
                        borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        fontSize: '13.5px',
                        lineHeight: '1.45',
                        whiteSpace: 'pre-wrap'
                    }
                }, [
                    m.text,
                    m.actionSummary && React.createElement('div', {
                        key: 'action-tag',
                        style: {
                            marginTop: '8px',
                            padding: '4px 8px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600'
                        }
                    }, `⚡ ${m.actionSummary}`)
                ])
            ),
            isLoading && React.createElement('div', {
                key: 'typing-indicator',
                style: {
                    alignSelf: 'flex-start',
                    background: '#ffffff',
                    color: '#64748b',
                    padding: '8px 14px',
                    borderRadius: '14px',
                    fontSize: '12px',
                    fontStyle: 'italic'
                }
            }, '🤖 Filling out form fields, enriching details & calculating costs...'),
            React.createElement('div', { key: 'anchor', ref: messagesEndRef })
        ]),

        // Quick Starter Chips
        React.createElement('div', {
            key: 'quick-actions',
            style: {
                padding: '8px 12px',
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
            }
        }, quickTemplates.map((qt, idx) =>
            React.createElement('button', {
                key: `qt-${idx}`,
                onClick: () => {
                    if (qt.label.includes('Points Transfer Strategy')) {
                        sendMessage(qt.fill);
                    } else {
                        setInputMessage(prev => prev ? `${prev}\n${qt.fill}` : qt.fill);
                    }
                },
                disabled: isLoading,
                style: {
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    color: '#334155',
                    cursor: 'pointer',
                    flexShrink: 0
                }
            }, qt.label)
        )),

        // Input Box
        React.createElement('div', {
            key: 'input-box',
            style: {
                padding: '12px',
                background: '#ffffff',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
            }
        }, [
            React.createElement('textarea', {
                key: 'input-textarea',
                value: inputMessage,
                onChange: (e) => setInputMessage(e.target.value),
                onKeyDown: handleKeyDown,
                placeholder: isListening ? '🎙️ Listening... speak your flights, hotels, points & notes...' : 'Dictate or type your flight, hotel, points & activity picks...',
                rows: 3,
                style: {
                    flex: 1,
                    resize: 'none',
                    border: isListening ? '2px solid #ef4444' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit'
                }
            }),
            React.createElement('button', {
                key: 'mic-btn',
                onClick: toggleListening,
                title: isListening ? 'Stop dictation' : 'Start continuous voice dictation',
                style: {
                    background: isListening ? '#ef4444' : '#f1f5f9',
                    color: isListening ? '#ffffff' : '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontSize: '15px'
                }
            }, isListening ? '⏹️' : '🎙️'),
            React.createElement('button', {
                key: 'send-btn',
                onClick: () => sendMessage(),
                disabled: !inputMessage.trim() || isLoading,
                style: {
                    background: inputMessage.trim() && !isLoading ? '#4f46e5' : '#94a3b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed'
                }
            }, 'Fill')
        ])
    ]);
};

console.log('✅ CopilotPanel component loaded');
