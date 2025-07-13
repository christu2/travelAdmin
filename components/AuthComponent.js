/**
 * Authentication Component
 * 
 * Handles user authentication with Firebase Auth
 * Provides Google sign-in and manages user state
 */

window.AuthComponent = () => {
    const [currentUser, setCurrentUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await firebase.auth().signInWithPopup(provider);
        } catch (error) {
            console.error('Sign-in error:', error);
        }
    };

    const signOut = async () => {
        try {
            await firebase.auth().signOut();
        } catch (error) {
            console.error('Sign-out error:', error);
        }
    };

    if (loading) {
        return React.createElement('div', { className: 'loading' }, 'Loading...');
    }

    if (!currentUser) {
        return React.createElement('div', { className: 'container' }, [
            React.createElement('div', {
                key: 'signin-header',
                className: 'header',
                style: { textAlign: 'center' }
            }, [
                React.createElement('h1', { key: 'title' }, 'WanderMint Admin Dashboard'),
                React.createElement('p', { key: 'subtitle' }, 'Please sign in to access the dashboard'),
                React.createElement('button', {
                    key: 'signin-btn',
                    className: 'btn btn-primary',
                    onClick: signInWithGoogle,
                    style: { marginTop: '20px' }
                }, 'Sign in with Google')
            ])
        ]);
    }

    return React.createElement(window.Dashboard, {
        currentUser: currentUser,
        onSignOut: signOut
    });
};

console.log('✅ AuthComponent loaded');