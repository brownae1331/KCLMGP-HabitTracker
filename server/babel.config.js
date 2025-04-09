// Babel setup to make modern JavaScript work in Node
export const presets = [
    ['@babel/preset-env', { targets: { node: 'current' } }],
];
