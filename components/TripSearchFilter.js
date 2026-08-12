/**
 * Trip Search and Filter Component
 *
 * Provides UI for searching and filtering trips
 */

window.TripSearchFilter = ({ onFilterChange, stats }) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedStatus, setSelectedStatus] = React.useState('all');
    const [selectedSort, setSelectedSort] = React.useState('newest');
    const [showAdvanced, setShowAdvanced] = React.useState(false);
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');

    // Apply filters when any input changes
    React.useEffect(() => {
        const filters = {
            searchQuery,
            status: selectedStatus === 'all' ? null : selectedStatus,
            sortBy: selectedSort,
            startDate: startDate || null,
            endDate: endDate || null
        };

        onFilterChange(filters);
    }, [searchQuery, selectedStatus, selectedSort, startDate, endDate]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setSelectedStatus('all');
        setSelectedSort('newest');
        setStartDate('');
        setEndDate('');
    };

    const hasActiveFilters = searchQuery || selectedStatus !== 'all' ||
                            startDate || endDate || selectedSort !== 'newest';

    return React.createElement('div', {
        className: 'trip-search-filter',
        style: {
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
        }
    }, [
        // Main search bar
        React.createElement('div', {
            key: 'main-search',
            style: {
                display: 'flex',
                gap: '10px',
                marginBottom: '15px',
                flexWrap: 'wrap'
            }
        }, [
            // Search input
            React.createElement('div', {
                key: 'search',
                style: { flex: '1', minWidth: '200px', position: 'relative' }
            }, [
                React.createElement('span', {
                    key: 'icon',
                    style: {
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '18px',
                        color: '#999'
                    }
                }, '🔍'),
                React.createElement('input', {
                    key: 'input',
                    id: 'trip-search',
                    type: 'search',
                    placeholder: 'Search trips (user, email, destination, ID)...',
                    value: searchQuery,
                    onChange: (e) => setSearchQuery(e.target.value),
                    style: {
                        width: '100%',
                        padding: '10px 10px 10px 40px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        transition: 'border-color 0.2s'
                    },
                    onFocus: (e) => {
                        e.target.style.borderColor = '#2196F3';
                    },
                    onBlur: (e) => {
                        e.target.style.borderColor = '#e0e0e0';
                    }
                })
            ]),

            // Status filter
            React.createElement('select', {
                key: 'status',
                value: selectedStatus,
                onChange: (e) => setSelectedStatus(e.target.value),
                style: {
                    padding: '10px 15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                }
            }, [
                React.createElement('option', { key: 'all', value: 'all' },
                    `All Status${stats?.total ? ` (${stats.total})` : ''}`),
                React.createElement('option', { key: 'pending', value: 'pending' },
                    `Pending${stats?.byStatus?.pending ? ` (${stats.byStatus.pending})` : ''}`),
                React.createElement('option', { key: 'in_progress', value: 'in_progress' },
                    `In Progress${stats?.byStatus?.in_progress ? ` (${stats.byStatus.in_progress})` : ''}`),
                React.createElement('option', { key: 'completed', value: 'completed' },
                    `Completed${stats?.byStatus?.completed ? ` (${stats.byStatus.completed})` : ''}`),
                React.createElement('option', { key: 'cancelled', value: 'cancelled' },
                    `Cancelled${stats?.byStatus?.cancelled ? ` (${stats.byStatus.cancelled})` : ''}`),
                React.createElement('option', { key: 'failed', value: 'failed' },
                    `Failed${stats?.byStatus?.failed ? ` (${stats.byStatus.failed})` : ''}`)
            ]),

            // Sort by
            React.createElement('select', {
                key: 'sort',
                value: selectedSort,
                onChange: (e) => setSelectedSort(e.target.value),
                style: {
                    padding: '10px 15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                }
            }, [
                React.createElement('option', { key: 'newest', value: 'newest' }, '↓ Newest First'),
                React.createElement('option', { key: 'oldest', value: 'oldest' }, '↑ Oldest First'),
                React.createElement('option', { key: 'budget-high', value: 'budget-high' }, '💰 Budget: High to Low'),
                React.createElement('option', { key: 'budget-low', value: 'budget-low' }, '💸 Budget: Low to High'),
                React.createElement('option', { key: 'destinations', value: 'destinations' }, '🌍 Most Destinations'),
                React.createElement('option', { key: 'user', value: 'user' }, '👤 User A-Z')
            ]),

            // Advanced filters toggle
            React.createElement('button', {
                key: 'advanced',
                onClick: () => setShowAdvanced(!showAdvanced),
                style: {
                    padding: '10px 20px',
                    background: showAdvanced ? '#2196F3' : 'white',
                    color: showAdvanced ? 'white' : '#666',
                    border: `2px solid ${showAdvanced ? '#2196F3' : '#e0e0e0'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }
            }, showAdvanced ? '📅 Hide Dates' : '📅 Filter Dates'),

            // Clear filters button
            hasActiveFilters && React.createElement('button', {
                key: 'clear',
                onClick: clearFilters,
                style: {
                    padding: '10px 20px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                },
                onMouseOver: (e) => {
                    e.target.style.background = '#d32f2f';
                },
                onMouseOut: (e) => {
                    e.target.style.background = '#f44336';
                }
            }, '✕ Clear')
        ]),

        // Advanced filters (date range)
        showAdvanced && React.createElement('div', {
            key: 'advanced-filters',
            style: {
                display: 'flex',
                gap: '10px',
                padding: '15px',
                background: '#f5f5f5',
                borderRadius: '6px',
                alignItems: 'center'
            }
        }, [
            React.createElement('label', {
                key: 'from-label',
                style: { fontSize: '14px', color: '#666' }
            }, 'From:'),
            React.createElement('input', {
                key: 'from-date',
                type: 'date',
                value: startDate,
                onChange: (e) => setStartDate(e.target.value),
                style: {
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                }
            }),
            React.createElement('label', {
                key: 'to-label',
                style: { fontSize: '14px', color: '#666' }
            }, 'To:'),
            React.createElement('input', {
                key: 'to-date',
                type: 'date',
                value: endDate,
                onChange: (e) => setEndDate(e.target.value),
                style: {
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                }
            })
        ]),

        // Active filters summary
        hasActiveFilters && React.createElement('div', {
            key: 'active-filters',
            style: {
                marginTop: '10px',
                padding: '10px',
                background: '#e3f2fd',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#1976d2'
            }
        }, [
            React.createElement('strong', { key: 'label' }, 'Active filters: '),
            searchQuery && React.createElement('span', { key: 'search' }, `Search: "${searchQuery}" • `),
            selectedStatus !== 'all' && React.createElement('span', { key: 'status' }, `Status: ${selectedStatus} • `),
            (startDate || endDate) && React.createElement('span', { key: 'dates' },
                `Dates: ${startDate || '...'} to ${endDate || '...'} • `),
            selectedSort !== 'newest' && React.createElement('span', { key: 'sort' }, `Sort: ${selectedSort}`)
        ])
    ]);
};

console.log('✅ TripSearchFilter component loaded');
