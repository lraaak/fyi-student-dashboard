import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }, [token]);

    const login = async (email, password) => {
        console.log('AuthContext: Creating FormData...');
        const formData = new FormData();
        formData.append('username', email);  // OAuth2 uses 'username' field
        formData.append('password', password);

        console.log('AuthContext: Sending request to http://localhost:8000/login');
        try {
            const response = await fetch('http://localhost:8000/login', {
                method: 'POST',
                body: formData
            });

            console.log('AuthContext: Response received:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('AuthContext: Login failed:', errorData);
                throw new Error(errorData.detail || 'Login failed');
            }

            const data = await response.json();
            console.log('AuthContext: Login successful, setting token');
            setToken(data.access_token);
            return data;
        } catch (error) {
            console.error('AuthContext: Fetch error:', error);
            throw error;
        }
    };

    const register = async (email, password, name) => {
        const response = await fetch('http://localhost:8000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        const data = await response.json();
        setToken(data.access_token);
        return data;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, login, register, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
