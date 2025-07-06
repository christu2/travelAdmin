/**
 * OverviewTab Component
 * 
 * Provides trip overview editing functionality
 * Simple textarea for entering comprehensive trip description
 * 
 * @param {Object} recommendation - Trip recommendation data
 * @param {Function} updateRecommendation - Function to update recommendation data
 */

window.OverviewTab = ({ recommendation, updateRecommendation }) => {
    return React.createElement('div', { className: 'form-section' }, [
        React.createElement('div', { key: 'overview-group', className: 'form-group' }, [
            React.createElement('label', { key: 'label' }, 'Trip Overview'),
            React.createElement('textarea', {
                key: 'textarea',
                value: recommendation.tripOverview || '',
                onChange: (e) => updateRecommendation('tripOverview', e.target.value),
                placeholder: 'Provide a comprehensive overview of this multi-city trip...',
                rows: 6
            })
        ])
    ]);
};

console.log('✅ OverviewTab component loaded');