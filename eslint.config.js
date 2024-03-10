// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config({
    files: ["src/**/*.js", "src/**/*.ts"],
    ignores: ["src/static/js/templates.js"],
    extends: [
        eslint.configs.recommended,
        ...tseslint.configs.recommendedTypeChecked,
        {
            languageOptions: {
                parserOptions: {
                    project: true,
                    tsconfigRootDir: import.meta.dirname,
                },
            },
        },
    ]
});
