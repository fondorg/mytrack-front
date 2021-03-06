import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import {terser} from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy'
import sveltePreprocess from 'svelte-preprocess';

const production = !process.env.ROLLUP_WATCH;

const OIDC_ISSUER = process.env.OIDC_ISSUER;
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
const OIDC_REDIRECT_URL = process.env.OIDC_REDIRECT_URL;
const OIDC_LOGOUT_REDIRECT_URL = process.env.OIDC_LOGOUT_REDIRECT_URL;
const API_BASE_URL = process.env.API_BASE_URL.replace(/\/$/, "");
const OIDC_ACCOUNT_SERVICE = process.env.OIDC_ACCOUNT_SERVICE

function serve() {
    let server;

    function toExit() {
        if (server) server.kill(0);
    }

    return {
        writeBundle() {
            if (server) return;
            server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
                stdio: ['ignore', 'inherit', 'inherit'],
                shell: true
            });

            process.on('SIGTERM', toExit);
            process.on('exit', toExit);
        }
    };
}

export default {
    input: 'src/main.js',
    output: {
        sourcemap: true,
        format: 'iife',
        name: 'app',
        file: 'public/build/bundle.js'
    },
    plugins: [
        replace({
            OIDC_ISSUER,
            OIDC_CLIENT_ID,
            OIDC_REDIRECT_URL,
            OIDC_LOGOUT_REDIRECT_URL,
            API_BASE_URL,
            OIDC_ACCOUNT_SERVICE
        }),
        svelte({
            preprocess: sveltePreprocess({postcss: true}),
            // enable run-time checks when not in production
            dev: !production,
            // we'll extract any component CSS out into
            // a separate file - better for performance
            css: css => {
                css.write('bundle.css');
            }
        }),

        // If you have external dependencies installed from
        // npm, you'll most likely need these plugins. In
        // some cases you'll need additional configuration -
        // consult the documentation for details:
        // https://github.com/rollup/plugins/tree/master/packages/commonjs
        resolve({
            browser: true,
            //dedupe: ['svelte']
            dedupe: ['svelte']
        }),
        commonjs(),

        copy({
            targets: [
                {src: 'public/*', dest: '../src/main/resources/static/'}
            ],
            verbose: true,
            hook: 'writeBundle'
        }),

        // In dev mode, call `npm run start` once
        // the bundle has been generated
        !production && serve(),

        // Watch the `public` directory and refresh the
        // browser on changes when not in production
        !production && livereload('public'),

        // If we're building for production (npm run build
        // instead of npm run dev), minify
        production && terser()
    ],
    watch: {
        clearScreen: false
    }
};
