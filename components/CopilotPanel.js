/**
 * CopilotPanel Component
 * 
 * Interactive Conversational AI Assistant & Dictation Panel
 * Allows consultants to chat naturally, dictate changes, and auto-populate
 * recommendations in real time using Gemini AI.
 * 
 * @param {Object} selectedTrip - Currently selected trip intake data
 * @param {Object} newRecommendation - Current recommendation state
 * @param {Function} setNewRecommendation - Function to update the entire recommendation
 * @param {Function} updateRecommendation - Function to update a nested property
 */

window.CopilotPanel = ({ selectedTrip, newRecommendation, setNewRecommendation, updateRecommendation }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [inputMessage, setInputMessage] = React.useState('');
    const [isListening, setIsListening] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [messages, setMessages] = React.useState([
        {
            role: 'assistant',
            text: `👋 Hi! I'm your WanderMint AI Copilot. You can chat with me, dictate changes (e.g., "Add Terramor in Bar Harbor at $380/night" or "Find 3 craft breweries in Portland"), or click below to generate an initial preliminary draft.`
        }
    ]);
    const [lastAction, setLastAction] = React.useState(null);

    const messagesEndRef = React.useRef(null);
    const recognitionRef = React.useRef(null);

    // Auto-scroll messages
    React.useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Setup Web Speech API for voice dictation
    React.useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputMessage(prev => prev ? `${prev} ${transcript}` : transcript);
                setIsListening(false);
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
            alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
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

    const sendMessage = async (textToSend = null) => {
        const text = (textToSend || inputMessage).trim();
        if (!text || isLoading) return;

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

            const response = await fetch(`${hotelProxyUrl}/api/copilot/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history,
                    tripContext: selectedTrip || {},
                    currentRecommendation: newRecommendation || {}
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    text: data.reply,
                    actionSummary: data.actionSummary
                }]);

                if (data.updatedRecommendation && typeof setNewRecommendation === 'function') {
                    setNewRecommendation(data.updatedRecommendation);
                    setLastAction(data.actionSummary || 'Recommendation updated live in dashboard');
                }
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    text: data.reply || `⚠️ ${data.error || 'Failed to process request'}`
                }]);
            }
        } catch (error) {
            console.error('Copilot request failed:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: `⚠️ Error connecting to Copilot: ${error.message}. Ensure hotel proxy server is running on port 3002.`
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

    const quickActions = [
        { label: '✨ Generate Full AI Draft', prompt: 'Please generate a complete preliminary recommendation for this trip request, analyzing the best gateway airports, splitting destinations, recommending TripAdvisor 4.5+ hotels/glamping, and tailoring activities.' },
        { label: '🏨 TripAdvisor 4.5+ Hotels', prompt: 'Suggest 2 top TripAdvisor 4.5+ or unique boutique/glamping accommodation options for each destination.' },
        { label: '✈️ Airport Logistics & Route', prompt: 'Analyze which airport makes the most sense to fly into and recommend the best flight route for this client.' },
        { label: '🍺 Curate Breweries & Food', prompt: 'Add top local craft brewery tours and fresh seafood spots to the recommended activities and restaurants.' }
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
                React.createElement('span', { key: 'icon', style: { fontSize: '18px' } }, '🤖'),
                React.createElement('span', { key: 'text' }, 'AI Copilot'),
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
            width: '420px',
            maxWidth: 'calc(100vw - 40px)',
            height: '620px',
            maxHeight: 'calc(100vh - 40px)',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
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
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }
        }, [
            React.createElement('div', {
                key: 'header-title',
                style: { display: 'flex', alignItems: 'center', gap: '8px' }
            }, [
                React.createElement('span', { key: 'icon', style: { fontSize: '20px' } }, '🤖'),
                React.createElement('div', { key: 'title-info' }, [
                    React.createElement('div', { key: 'name', style: { fontWeight: '700', fontSize: '15px' } }, 'WanderMint AI Copilot'),
                    React.createElement('div', { key: 'sub', style: { fontSize: '11px', opacity: 0.85 } }, 'Gemini 2.0 • Real-time Dictation')
                ])
            ]),
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
                gap: '6px'
            }
        }, [
            React.createElement('span', { key: 'check' }, '⚡'),
            React.createElement('span', { key: 'text' }, lastAction)
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
                        maxWidth: '85%',
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
            }, '🤖 Thinking and drafting...'),
            React.createElement('div', { key: 'anchor', ref: messagesEndRef })
        ]),

        // Quick Actions Chips
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
        }, quickActions.map((qa, idx) =>
            React.createElement('button', {
                key: `qa-${idx}`,
                onClick: () => sendMessage(qa.prompt),
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
            }, qa.label)
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
                placeholder: 'Type or dictate instructions...',
                rows: 2,
                style: {
                    flex: 1,
                    resize: 'none',
                    border: '1px solid #cbd5e1',
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
                title: isListening ? 'Stop listening' : 'Voice dictation',
                style: {
                    background: isListening ? '#ef4444' : '#f1f5f9',
                    color: isListening ? '#ffffff' : '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontSize: '15px'
                }
            }, isListening ? '🔴' : '🎤'),
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
            }, 'Send')
        ])
    ]);
};

console.log('✅ CopilotPanel component loaded');
