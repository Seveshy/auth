import { api } from '../services/api';
import { createContext, ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import { setCookie } from 'nookies';

type User = {
    email: string;
    permissions: string[];
    roles: string[];
};
  

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn(credentials: SignInCredentials): Promise<void>;
    isAuthenticated: boolean;
};

type AuthProviderProps = {
    children: ReactNode;
}


export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>();
    const isAuthenticated = !!user;

    const history = useRouter();

   async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post('sessions', {
                email, 
                password,
            });

            const { permissions, roles, token, refreshToken } = response.data;

            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 30 * 24 * 30,
                path: '/'
            });

            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 30 * 24 * 30,
                path: '/'
            });

            setUser({
                email,
                permissions,
                roles
            });

            history.push('/dashboard');


        } catch (err) {
            console.log(err);
        }
    }

    return (
        <AuthContext.Provider value={{ signIn, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    )
}

