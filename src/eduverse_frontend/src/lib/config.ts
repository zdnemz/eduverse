export const IS_LOCAL = window.location.hostname === 'localhost';
export const HTTP_HOST = IS_LOCAL ? 'http://localhost:4943' : 'https://ic0.app';
