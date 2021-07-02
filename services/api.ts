import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';
import { SignOut } from '../context/AuthContext';

type FailedRequest = {
    onSuccess(token: string): void;
    onFailure(err: AxiosError): void;
  };


let cookies = parseCookies();
let isRefreshing = false;
let failedRequestsQueue: FailedRequest[] = [];

export const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
        Authorization: `Barear ${cookies['nextauth.token']}`
    }
});

api.interceptors.response.use(response => {
    return response;
}, (error: AxiosError) => {
    if (error.response?.status === 401) {
        if (error.response.data?.code === 'token.expired') {
            cookies = parseCookies();

            const { 'nextauth.refreshToken': refreshToken } = cookies;
            const originalConfig = error.config;

            if (!isRefreshing) {
                isRefreshing = true;

                api.post('/refresh', {
                    refreshToken,
                }).then(response => {
                    const { token } = response.data;

                    setCookie(undefined, 'nextauth.token', token, {
                        maxAge: 60 * 30 * 24 * 30,
                        path: '/'
                    });

                    setCookie(undefined, 'nextauth.refreshToken', response.data.refreshToken, {
                        maxAge: 60 * 30 * 24 * 30,
                        path: '/'
                    });

                    api.defaults.headers['Authorization'] = `Berear ${token}`;

                    failedRequestsQueue.forEach(request => request.onSuccess(token));
                    failedRequestsQueue = [];
                }).catch(err => {
                    
                }).finally(() => {
                    isRefreshing = false;
                })

          
                return new Promise((resolve, reject) => {
                    failedRequestsQueue.push({
                        onSuccess: (token: string) => {
                            originalConfig.headers['Authorization'] = `Bearear ${token}`

                            resolve(api(originalConfig));
                        },

                        onFailure: (err: AxiosError) => {
                            reject(err);
                        }
                    })
                }); 
          
            } 
        } else {
            SignOut();
        }
    } 

    return Promise.reject(error);
})