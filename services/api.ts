import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';
import { SignOut } from '../context/AuthContext';

type FailedRequest = {
    onSuccess(token: string): void;
    onFailure(err: AxiosError): void;
};


let isRefreshing = false;
let failedRequestsQueue: FailedRequest[] = [];

export function setupApiClient(ctx = undefined) {
    let cookies = parseCookies(ctx);

    const api = axios.create({
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
                cookies = parseCookies(ctx);

                const { 'nextauth.refreshToken': refreshToken } = cookies;
                const originalConfig = error.config;

                if (!isRefreshing) {
                    isRefreshing = true;

                    api.post('/refresh', {
                        refreshToken,
                    }).then(response => {
                        const { token } = response.data;

                        setCookie(ctx, 'nextauth.token', token, {
                            maxAge: 60 * 30 * 24 * 30,
                            path: '/'
                        });

                        setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
                            maxAge: 60 * 30 * 24 * 30,
                            path: '/'
                        });

                        api.defaults.headers['Authorization'] = `Berear ${token}`;

                        failedRequestsQueue.forEach(request => request.onSuccess(token));
                        failedRequestsQueue = [];
                    }).catch(err => {
                        failedRequestsQueue.forEach(request => request.onFailure(err));
                        failedRequestsQueue = [];

                        if (process.browser) {
                            SignOut();
                        }

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
                if (process.browser) {
                    SignOut();
                }
            }
        }
    })

    return api;

}