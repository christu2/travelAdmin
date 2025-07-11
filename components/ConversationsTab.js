/**
 * ConversationsTab Component
 * 
 * Handles trip-specific conversations and feedback from users
 * Allows admin to respond to messages and manage conversation status
 * 
 * @param {Object} conversations - Array of conversation objects
 * @param {Function} onSendResponse - Function to send admin response
 * @param {Function} onUpdateStatus - Function to update conversation status
 */

window.ConversationsTab = ({ selectedTrip }) => {
    const [conversations, setConversations] = React.useState([]);
    const [selectedConversation, setSelectedConversation] = React.useState(null);
    const [messages, setMessages] = React.useState([]);
    const [responseText, setResponseText] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [showResponseTemplates, setShowResponseTemplates] = React.useState(false);

    // Load conversations on component mount and when selectedTrip changes
    React.useEffect(() => {
        if (selectedTrip) {
            loadConversations();
        }
        
        // Set up real-time listener for new messages
        const unsubscribe = setupConversationListener();
        return () => unsubscribe && unsubscribe();
    }, [selectedTrip]);

    const loadConversations = async () => {
        try {
            setLoading(true);
            console.log('🚀 Starting to load conversations for trip:', selectedTrip?.id);
            
            if (!selectedTrip || !selectedTrip.id) {
                console.log('❌ No selected trip, skipping conversation load');
                setConversations([]);
                setLoading(false);
                return;
            }
            
            // Query conversations for the selected trip only
            const conversationsQuery = firebase.firestore()
                .collection('tripConversations')
                .where('tripId', '==', selectedTrip.id);
            
            console.log('📡 Executing Firestore query...');
            const snapshot = await conversationsQuery.get();
            console.log('📊 Query completed successfully');
            const conversationsList = [];
            
            console.log('🔍 Found conversations:', snapshot.docs.length);
            
            for (const doc of snapshot.docs) {
                const conversationData = { id: doc.id, ...doc.data() };
                console.log('📝 Conversation:', doc.id, 'Status:', conversationData.status, 'Last message:', conversationData.lastMessageAt);
                
                // Get trip details for context
                try {
                    const tripDoc = await firebase.firestore()
                        .collection('trips')
                        .doc(conversationData.tripId)
                        .get();
                    
                    if (tripDoc.exists) {
                        conversationData.trip = { id: tripDoc.id, ...tripDoc.data() };
                    }
                } catch (tripError) {
                    console.warn('Could not load trip details:', tripError);
                }
                
                // Get latest message for preview
                try {
                    const messagesSnapshot = await firebase.firestore()
                        .collection('tripConversations')
                        .doc(doc.id)
                        .collection('messages')
                        .orderBy('timestamp', 'desc')
                        .limit(1)
                        .get();
                    
                    if (!messagesSnapshot.empty) {
                        conversationData.latestMessage = {
                            id: messagesSnapshot.docs[0].id,
                            ...messagesSnapshot.docs[0].data()
                        };
                    }
                } catch (messageError) {
                    console.warn('Could not load latest message:', messageError);
                }
                
                conversationsList.push(conversationData);
            }
            
            setConversations(conversationsList);
        } catch (err) {
            setError('Failed to load conversations: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const setupConversationListener = () => {
        // Set up real-time listener for new messages
        return firebase.firestore()
            .collection('adminNotifications')
            .where('type', '==', 'new_user_message')
            .where('isRead', '==', false)
            .onSnapshot((snapshot) => {
                if (!snapshot.empty) {
                    // Reload conversations when new messages arrive
                    loadConversations();
                }
            });
    };

    const loadMessages = async (conversationId) => {
        try {
            const messagesSnapshot = await firebase.firestore()
                .collection('tripConversations')
                .doc(conversationId)
                .collection('messages')
                .orderBy('timestamp', 'asc')
                .get();
            
            const messagesList = messagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setMessages(messagesList);
        } catch (err) {
            setError('Failed to load messages: ' + err.message);
        }
    };

    const selectConversation = async (conversation) => {
        setSelectedConversation(conversation);
        await loadMessages(conversation.id);
        
        // Mark admin notifications as read for this conversation
        try {
            const notificationsSnapshot = await firebase.firestore()
                .collection('adminNotifications')
                .where('conversationId', '==', conversation.id)
                .where('isRead', '==', false)
                .get();
            
            const batch = firebase.firestore().batch();
            notificationsSnapshot.docs.forEach(doc => {
                batch.update(doc.ref, { isRead: true });
            });
            await batch.commit();
        } catch (err) {
            console.warn('Failed to mark notifications as read:', err);
        }
    };

    const sendResponse = async (newStatus = 'waiting_for_user') => {
        if (!selectedConversation || !responseText.trim()) return;
        
        try {
            const messageData = {
                conversationId: selectedConversation.id,
                senderId: 'admin',
                senderType: 'admin',
                messageType: 'text',
                content: responseText.trim(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                isRead: false
            };
            
            // Add message to subcollection
            await firebase.firestore()
                .collection('tripConversations')
                .doc(selectedConversation.id)
                .collection('messages')
                .add(messageData);
            
            // Update conversation status
            await firebase.firestore()
                .collection('tripConversations')
                .doc(selectedConversation.id)
                .update({
                    lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: newStatus,
                    unreadUserCount: firebase.firestore.FieldValue.increment(1),
                    unreadAdminCount: 0
                });
            
            setResponseText('');
            setShowResponseTemplates(false);
            
            // Reload messages and conversations
            await loadMessages(selectedConversation.id);
            await loadConversations();
            
        } catch (err) {
            setError('Failed to send response: ' + err.message);
        }
    };

    const updateConversationStatus = async (conversationId, newStatus) => {
        try {
            await firebase.firestore()
                .collection('tripConversations')
                .doc(conversationId)
                .update({ status: newStatus });
            
            await loadConversations();
            
            if (selectedConversation && selectedConversation.id === conversationId) {
                setSelectedConversation({
                    ...selectedConversation,
                    status: newStatus
                });
            }
        } catch (err) {
            setError('Failed to update status: ' + err.message);
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return date.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'needs_response': return '#FF6B35';
            case 'waiting_for_user': return '#8B5CF6';
            case 'resolved': return '#10B981';
            case 'active': return '#3B82F6';
            default: return '#6B7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'needs_response': return 'Needs Response';
            case 'waiting_for_user': return 'Waiting for User';
            case 'resolved': return 'Resolved';
            case 'active': return 'Active';
            default: return status;
        }
    };

    const responseTemplates = [
        {
            id: 'acknowledged',
            title: 'Request Acknowledged',
            content: "Thanks for your feedback! I'm looking into this and will get back to you with options within 24 hours.",
            status: 'needs_response'
        },
        {
            id: 'options_provided',
            title: 'Options Provided',
            content: "I've found some alternatives for you. Please review the updated options and let me know which you prefer.",
            status: 'waiting_for_user'
        },
        {
            id: 'clarification',
            title: 'Need Clarification',
            content: "To find the best options for you, could you provide more details about [SPECIFIC QUESTION]?",
            status: 'waiting_for_user'
        },
        {
            id: 'changes_made',
            title: 'Changes Completed',
            content: "Great news! I've updated your itinerary with the changes you requested. Please review and let me know if you need any adjustments.",
            status: 'resolved'
        }
    ];

    if (loading) {
        return React.createElement('div', {
            style: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }
        }, [
            React.createElement('div', { key: 'loading' }, 'Loading conversations...')
        ]);
    }

    return React.createElement('div', {
        style: { display: 'flex', height: '80vh', border: '1px solid #e2e8f0', borderRadius: '8px' }
    }, [
        // Conversations sidebar
        React.createElement('div', {
            key: 'sidebar',
            style: {
                width: '350px',
                borderRight: '1px solid #e2e8f0',
                background: '#f8f9fa',
                overflowY: 'auto'
            }
        }, [
            React.createElement('div', {
                key: 'sidebar-header',
                style: { 
                    padding: '20px',
                    borderBottom: '1px solid #e2e8f0',
                    background: 'white'
                }
            }, [
                React.createElement('h3', {
                    key: 'title',
                    style: { margin: '0 0 8px 0' }
                }, `Trip Conversations (${conversations.length})`),
                React.createElement('p', {
                    key: 'subtitle',
                    style: { margin: 0, color: '#6b7280', fontSize: '14px' }
                }, 'Messages from your travelers')
            ]),
            
            React.createElement('div', { key: 'conversations-list' },
                conversations.length === 0 ? [
                    React.createElement('div', {
                        key: 'empty',
                        style: {
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#6b7280'
                        }
                    }, [
                        React.createElement('p', { key: 'empty-text' }, 'No conversations for this trip yet'),
                        React.createElement('p', { 
                            key: 'empty-subtitle',
                            style: { fontSize: '14px', marginTop: '8px' }
                        }, 'Users can send feedback from their trip details')
                    ])
                ] : conversations.map(conversation => 
                    React.createElement('div', {
                        key: conversation.id,
                        onClick: () => selectConversation(conversation),
                        style: {
                            padding: '16px 20px',
                            borderBottom: '1px solid #e2e8f0',
                            cursor: 'pointer',
                            background: selectedConversation?.id === conversation.id ? '#e0f2fe' : 'white',
                            borderLeft: selectedConversation?.id === conversation.id ? '4px solid #0ea5e9' : '4px solid transparent'
                        }
                    }, [
                        React.createElement('div', {
                            key: 'conv-header',
                            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }
                        }, [
                            React.createElement('div', {
                                key: 'trip-info',
                                style: { fontWeight: '600', fontSize: '14px' }
                            }, conversation.trip?.destinations?.join(' → ') || conversation.trip?.destination || 'Unknown Trip'),
                            
                            React.createElement('div', {
                                key: 'status-badge',
                                style: {
                                    fontSize: '11px',
                                    padding: '2px 6px',
                                    borderRadius: '12px',
                                    background: getStatusColor(conversation.status) + '20',
                                    color: getStatusColor(conversation.status),
                                    fontWeight: '600'
                                }
                            }, getStatusText(conversation.status))
                        ]),
                        
                        React.createElement('div', {
                            key: 'conv-preview',
                            style: {
                                fontSize: '13px',
                                color: '#6b7280',
                                marginBottom: '8px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }
                        }, conversation.latestMessage?.content || 'No messages yet'),
                        
                        React.createElement('div', {
                            key: 'conv-meta',
                            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
                        }, [
                            React.createElement('span', {
                                key: 'timestamp',
                                style: { fontSize: '12px', color: '#9ca3af' }
                            }, formatTimestamp(conversation.lastMessageAt)),
                            
                            conversation.unreadAdminCount > 0 && React.createElement('div', {
                                key: 'unread-badge',
                                style: {
                                    background: '#ef4444',
                                    color: 'white',
                                    fontSize: '11px',
                                    padding: '2px 6px',
                                    borderRadius: '12px',
                                    minWidth: '18px',
                                    textAlign: 'center'
                                }
                            }, conversation.unreadAdminCount.toString())
                        ])
                    ])
                )
            )
        ]),
        
        // Messages panel
        React.createElement('div', {
            key: 'messages-panel',
            style: { flex: 1, display: 'flex', flexDirection: 'column' }
        }, selectedConversation ? [
            // Messages header
            React.createElement('div', {
                key: 'messages-header',
                style: {
                    padding: '20px',
                    borderBottom: '1px solid #e2e8f0',
                    background: 'white'
                }
            }, [
                React.createElement('div', {
                    key: 'header-content',
                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
                }, [
                    React.createElement('div', { key: 'trip-details' }, [
                        React.createElement('h4', {
                            key: 'trip-name',
                            style: { margin: '0 0 4px 0' }
                        }, selectedConversation.trip?.destinations?.join(' → ') || selectedConversation.trip?.destination || 'Trip Conversation'),
                        
                        React.createElement('p', {
                            key: 'trip-dates',
                            style: { margin: 0, color: '#6b7280', fontSize: '14px' }
                        }, selectedConversation.trip?.startDate && selectedConversation.trip?.endDate 
                            ? `${window.DataHelpers.formatDate(selectedConversation.trip.startDate)} - ${window.DataHelpers.formatDate(selectedConversation.trip.endDate)}`
                            : 'Trip dates not available')
                    ]),
                    
                    React.createElement('div', {
                        key: 'status-controls',
                        style: { display: 'flex', gap: '8px', alignItems: 'center' }
                    }, [
                        React.createElement('select', {
                            key: 'status-select',
                            value: selectedConversation.status,
                            onChange: (e) => updateConversationStatus(selectedConversation.id, e.target.value),
                            style: {
                                padding: '4px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '13px'
                            }
                        }, [
                            React.createElement('option', { key: 'active', value: 'active' }, 'Active'),
                            React.createElement('option', { key: 'needs_response', value: 'needs_response' }, 'Needs Response'),
                            React.createElement('option', { key: 'waiting_for_user', value: 'waiting_for_user' }, 'Waiting for User'),
                            React.createElement('option', { key: 'resolved', value: 'resolved' }, 'Resolved')
                        ])
                    ])
                ])
            ]),
            
            // Messages list
            React.createElement('div', {
                key: 'messages-list',
                style: {
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    background: '#f8f9fa'
                }
            }, messages.length === 0 ? [
                React.createElement('div', {
                    key: 'no-messages',
                    style: {
                        textAlign: 'center',
                        color: '#6b7280',
                        marginTop: '100px'
                    }
                }, 'No messages in this conversation')
            ] : messages.map(message => 
                React.createElement('div', {
                    key: message.id,
                    style: {
                        display: 'flex',
                        marginBottom: '16px',
                        justifyContent: message.senderType === 'admin' ? 'flex-end' : 'flex-start'
                    }
                }, [
                    React.createElement('div', {
                        key: 'message-bubble',
                        style: {
                            maxWidth: '70%',
                            padding: '12px 16px',
                            borderRadius: '16px',
                            background: message.senderType === 'admin' ? '#0ea5e9' : 'white',
                            color: message.senderType === 'admin' ? 'white' : '#1f2937',
                            border: message.senderType === 'admin' ? 'none' : '1px solid #e5e7eb'
                        }
                    }, [
                        message.messageType !== 'text' && React.createElement('div', {
                            key: 'message-type',
                            style: {
                                fontSize: '12px',
                                opacity: 0.8,
                                marginBottom: '4px',
                                fontWeight: '600'
                            }
                        }, message.messageType === 'change_request' ? '🔄 Change Request' : '💬 Feedback'),
                        
                        React.createElement('div', {
                            key: 'message-content',
                            style: { marginBottom: '4px' }
                        }, message.content),
                        
                        React.createElement('div', {
                            key: 'message-time',
                            style: {
                                fontSize: '11px',
                                opacity: 0.7,
                                textAlign: message.senderType === 'admin' ? 'right' : 'left'
                            }
                        }, formatTimestamp(message.timestamp))
                    ])
                ])
            )),
            
            // Response input
            React.createElement('div', {
                key: 'response-input',
                style: {
                    padding: '20px',
                    borderTop: '1px solid #e2e8f0',
                    background: 'white'
                }
            }, [
                React.createElement('div', {
                    key: 'response-area',
                    style: { marginBottom: '12px' }
                }, [
                    React.createElement('textarea', {
                        key: 'response-textarea',
                        value: responseText,
                        onChange: (e) => setResponseText(e.target.value),
                        placeholder: 'Type your response...',
                        style: {
                            width: '100%',
                            minHeight: '80px',
                            padding: '12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            fontSize: '14px'
                        }
                    })
                ]),
                
                React.createElement('div', {
                    key: 'response-controls',
                    style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
                }, [
                    React.createElement('button', {
                        key: 'templates-btn',
                        onClick: () => setShowResponseTemplates(!showResponseTemplates),
                        style: {
                            padding: '8px 16px',
                            border: '1px solid #d1d5db',
                            background: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }
                    }, showResponseTemplates ? 'Hide Templates' : 'Quick Templates'),
                    
                    React.createElement('div', {
                        key: 'send-controls',
                        style: { display: 'flex', gap: '8px', alignItems: 'center' }
                    }, [
                        React.createElement('select', {
                            key: 'status-after-send',
                            style: {
                                padding: '8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '13px'
                            }
                        }, [
                            React.createElement('option', { key: 'waiting', value: 'waiting_for_user' }, 'Mark as: Waiting for User'),
                            React.createElement('option', { key: 'resolved', value: 'resolved' }, 'Mark as: Resolved'),
                            React.createElement('option', { key: 'needs_response', value: 'needs_response' }, 'Mark as: Needs Response')
                        ]),
                        
                        React.createElement('button', {
                            key: 'send-btn',
                            onClick: () => sendResponse(),
                            disabled: !responseText.trim(),
                            className: 'btn btn-primary',
                            style: {
                                opacity: responseText.trim() ? 1 : 0.5,
                                cursor: responseText.trim() ? 'pointer' : 'not-allowed'
                            }
                        }, 'Send Response')
                    ])
                ]),
                
                // Quick templates
                showResponseTemplates && React.createElement('div', {
                    key: 'templates-panel',
                    style: {
                        marginTop: '16px',
                        padding: '16px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                    }
                }, [
                    React.createElement('h5', {
                        key: 'templates-title',
                        style: { margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }
                    }, 'Quick Response Templates'),
                    
                    React.createElement('div', {
                        key: 'templates-grid',
                        style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }
                    }, responseTemplates.map(template => 
                        React.createElement('button', {
                            key: template.id,
                            onClick: () => {
                                setResponseText(template.content);
                                setShowResponseTemplates(false);
                            },
                            style: {
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                background: 'white',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '13px'
                            }
                        }, [
                            React.createElement('div', {
                                key: 'template-title',
                                style: { fontWeight: '600', marginBottom: '4px' }
                            }, template.title),
                            React.createElement('div', {
                                key: 'template-preview',
                                style: { 
                                    fontSize: '12px', 
                                    color: '#6b7280',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }
                            }, template.content)
                        ])
                    ))
                ])
            ])
        ] : [
            React.createElement('div', {
                key: 'no-selection',
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: '#6b7280'
                }
            }, [
                React.createElement('div', {
                    key: 'icon',
                    style: { fontSize: '48px', marginBottom: '16px' }
                }, '💬'),
                React.createElement('h3', {
                    key: 'title',
                    style: { margin: '0 0 8px 0' }
                }, 'Select a conversation'),
                React.createElement('p', {
                    key: 'subtitle',
                    style: { margin: 0, textAlign: 'center' }
                }, 'Choose a conversation from the sidebar to view messages and respond to travelers')
            ])
        ])
    ]);
};

console.log('✅ ConversationsTab component loaded');