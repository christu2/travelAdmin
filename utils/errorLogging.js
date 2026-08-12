/**
 * Error Logging and Monitoring
 *
 * Provides comprehensive error tracking and logging
 * Integrates with Sentry for production error monitoring
 *
 * Features:
 * - Automatic error capture
 * - Console error tracking
 * - User context capture
 * - Breadcrumb tracking
 * - Performance monitoring
 */

window.ErrorLoggingManager = (function() {
    let sentryInitialized = false;
    let errorLog = [];
    const MAX_LOG_SIZE = 100;

    // Configuration
    const config = {
        sentryDsn: null, // Set this via environment variable
        environment: window.location.hostname === 'localhost' ? 'development' : 'production',
        enabled: true,
        logToConsole: true,
        captureUnhandledRejections: true
    };

    /**
     * Initialize error logging
     */
    function initialize(options = {}) {
        Object.assign(config, options);

        // Initialize Sentry if DSN is provided
        if (config.sentryDsn && window.Sentry) {
            try {
                Sentry.init({
                    dsn: config.sentryDsn,
                    environment: config.environment,
                    integrations: [
                        new Sentry.BrowserTracing(),
                        new Sentry.Replay()
                    ],
                    // Performance Monitoring
                    tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
                    // Session Replay
                    replaysSessionSampleRate: 0.1,
                    replaysOnErrorSampleRate: 1.0,
                    beforeSend(event, hint) {
                        // Filter out non-critical errors
                        if (shouldIgnoreError(event, hint)) {
                            return null;
                        }
                        return event;
                    }
                });

                sentryInitialized = true;
                console.log('✅ Sentry initialized:', config.environment);
            } catch (error) {
                console.error('Failed to initialize Sentry:', error);
            }
        } else {
            console.log('ℹ️ Error logging initialized (local mode - no Sentry)');
        }

        // Set up global error handlers
        setupGlobalHandlers();

        // Track initial page load
        trackBreadcrumb('Page Loaded', {
            url: window.location.href,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Set up global error handlers
     */
    function setupGlobalHandlers() {
        // Catch unhandled errors
        window.addEventListener('error', (event) => {
            logError(event.error || new Error(event.message), {
                type: 'unhandled_error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Catch unhandled promise rejections
        if (config.captureUnhandledRejections) {
            window.addEventListener('unhandledrejection', (event) => {
                logError(event.reason || new Error('Unhandled Promise Rejection'), {
                    type: 'unhandled_rejection',
                    promise: event.promise
                });
            });
        }

        // Override console.error to capture errors
        const originalConsoleError = console.error;
        console.error = function(...args) {
            // Log to our system
            const errorMsg = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');

            trackBreadcrumb('console.error', { message: errorMsg });

            // Call original
            originalConsoleError.apply(console, args);
        };
    }

    /**
     * Log an error
     */
    function logError(error, context = {}) {
        if (!config.enabled) return;

        // Create error object if needed
        if (!(error instanceof Error)) {
            error = new Error(String(error));
        }

        // Add to local log
        errorLog.push({
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });

        // Trim log if too large
        if (errorLog.length > MAX_LOG_SIZE) {
            errorLog = errorLog.slice(-MAX_LOG_SIZE);
        }

        // Log to console in development
        if (config.logToConsole || config.environment === 'development') {
            console.error('❌ Error logged:', error.message, context);
            console.error(error);
        }

        // Send to Sentry
        if (sentryInitialized && window.Sentry) {
            Sentry.captureException(error, {
                contexts: {
                    custom: context
                }
            });
        }
    }

    /**
     * Log a warning
     */
    function logWarning(message, context = {}) {
        trackBreadcrumb('warning', { message, ...context }, 'warning');

        if (sentryInitialized && window.Sentry) {
            Sentry.captureMessage(message, {
                level: 'warning',
                contexts: { custom: context }
            });
        }

        if (config.logToConsole) {
            console.warn('⚠️', message, context);
        }
    }

    /**
     * Log an info message
     */
    function logInfo(message, context = {}) {
        trackBreadcrumb('info', { message, ...context }, 'info');

        if (config.logToConsole && config.environment === 'development') {
            console.log('ℹ️', message, context);
        }
    }

    /**
     * Track breadcrumb for debugging
     */
    function trackBreadcrumb(message, data = {}, level = 'info') {
        if (sentryInitialized && window.Sentry) {
            Sentry.addBreadcrumb({
                message,
                data,
                level,
                timestamp: Date.now() / 1000
            });
        }
    }

    /**
     * Track user context
     */
    function setUserContext(user) {
        if (!user) return;

        const userInfo = {
            id: user.uid || user.id,
            email: user.email,
            username: user.displayName || user.email?.split('@')[0]
        };

        if (sentryInitialized && window.Sentry) {
            Sentry.setUser(userInfo);
        }

        trackBreadcrumb('User Context Set', userInfo);
    }

    /**
     * Clear user context (on logout)
     */
    function clearUserContext() {
        if (sentryInitialized && window.Sentry) {
            Sentry.setUser(null);
        }

        trackBreadcrumb('User Context Cleared');
    }

    /**
     * Set custom context
     */
    function setContext(key, value) {
        if (sentryInitialized && window.Sentry) {
            Sentry.setContext(key, value);
        }
    }

    /**
     * Track trip-related context
     */
    function setTripContext(trip) {
        if (!trip) return;

        const tripInfo = {
            tripId: trip.id,
            status: trip.status,
            destinations: trip.destinations,
            budget: trip.budget
        };

        setContext('trip', tripInfo);
        trackBreadcrumb('Trip Context Set', { tripId: trip.id });
    }

    /**
     * Determine if error should be ignored
     */
    function shouldIgnoreError(event, hint) {
        const error = hint?.originalException || event;

        // Ignore browser extension errors
        if (error?.stack && (
            error.stack.includes('chrome-extension://') ||
            error.stack.includes('moz-extension://') ||
            error.stack.includes('safari-extension://')
        )) {
            return true;
        }

        // Ignore specific known errors
        const ignoredMessages = [
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
            'Network request failed' // Often transient
        ];

        const errorMessage = error?.message || String(error);
        if (ignoredMessages.some(msg => errorMessage.includes(msg))) {
            return true;
        }

        return false;
    }

    /**
     * Get error log
     */
    function getErrorLog() {
        return [...errorLog];
    }

    /**
     * Clear error log
     */
    function clearErrorLog() {
        errorLog = [];
    }

    /**
     * Get error statistics
     */
    function getErrorStats() {
        const stats = {
            total: errorLog.length,
            byType: {},
            recent: errorLog.slice(-10)
        };

        errorLog.forEach(entry => {
            const type = entry.context?.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Track custom event
     */
    function trackEvent(eventName, properties = {}) {
        trackBreadcrumb(eventName, properties);

        if (sentryInitialized && window.Sentry) {
            Sentry.captureMessage(eventName, {
                level: 'info',
                contexts: {
                    event: properties
                }
            });
        }
    }

    /**
     * Wrap async function with error handling
     */
    function wrapAsync(fn, context = {}) {
        return async function(...args) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                logError(error, {
                    ...context,
                    function: fn.name,
                    arguments: args
                });
                throw error;
            }
        };
    }

    /**
     * Wrap function with error handling
     */
    function wrapFunction(fn, context = {}) {
        return function(...args) {
            try {
                return fn.apply(this, args);
            } catch (error) {
                logError(error, {
                    ...context,
                    function: fn.name,
                    arguments: args
                });
                throw error;
            }
        };
    }

    // Public API
    return {
        initialize,
        logError,
        logWarning,
        logInfo,
        trackBreadcrumb,
        setUserContext,
        clearUserContext,
        setContext,
        setTripContext,
        getErrorLog,
        clearErrorLog,
        getErrorStats,
        trackEvent,
        wrapAsync,
        wrapFunction
    };
})();

console.log('✅ ErrorLoggingManager loaded');

// Instructions for Sentry setup:
// 1. Sign up at sentry.io
// 2. Create a new project for "JavaScript Browser"
// 3. Get your DSN from Settings > Projects > [Your Project] > Client Keys (DSN)
// 4. Add to your .env file: SENTRY_DSN=your_dsn_here
// 5. In start-services.sh, inject DSN into template
// 6. Initialize in Dashboard: ErrorLoggingManager.initialize({ sentryDsn: '{{SENTRY_DSN}}' });
