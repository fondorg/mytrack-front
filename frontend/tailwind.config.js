module.exports = {
    purge: {
        mode: 'all',
        content: ['./**/**/*.html', './**/**/*.svelte'],

        options: {
            whitelistPatterns: [/svelte-/],
            defaultExtractor: (content) =>
                [...content.matchAll(/(?:class:)*([\w\d-/:%.]+)/gm)].map(([_match, group, ..._rest]) => group),
        },
    },

    theme: {
        extend: {
            colors: {
                mytrack: {
                    light: '#47f08f',
                    dark: '#13c760'
                }
            }
        },
    },
    variants: {
        backgroundColor: ['active'],
        extend: {
            outline: ['focus', 'active'],
            border: ['focus', 'active'],
            borderColor: ['focus', 'active'],
            backgroundColor: ['active']
        }
    },
    plugins: [],
    future: {
        // purgeLayersByDefault: true,
        // removeDeprecatedGapUtilities: true,
    },
};