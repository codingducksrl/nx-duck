import { Configuration } from './prompts.types';
import {
    applicationGenerator,
    libraryGenerator,
    setupTailwindGenerator,
    storybookConfigurationGenerator
} from '@nx/react';
import { configurationGenerator } from '@nx/storybook';
import { applicationGenerator as nextApplicationGenerator } from '@nx/next';
import { Linter } from '@nx/eslint';
import { generateFiles, Tree, updateJson } from '@nx/devkit';
import * as path from 'node:path';

export function getFrontendApplicationPath(configuration: Configuration) {
    return configuration.type.includes('backend') ? 'apps/frontend' : 'app';
}

export async function createFrontend(tree: Tree, configuration: Configuration, workspaceName: string) {

    const libsRoot = configuration.type.includes('backend') ? 'fe-libs' : 'libs';

    const applicationName = configuration.type.includes('backend') ? 'frontend' : 'app';
    const applicationPath = getFrontendApplicationPath(configuration);

    if (configuration.frontend.framework === 'react') {
        await applicationGenerator(tree, {
            name: applicationName,
            style: 'tailwind',
            linter: Linter.EsLint,
            bundler: 'vite',
            skipFormat: true,
            unitTestRunner: 'jest',
            e2eTestRunner: 'none',
            projectNameAndRootFormat: 'as-provided',
            directory: applicationPath
        });

        tree.delete(`${applicationPath}/src/app`);

        updateJson(tree, 'package.json', (pkgJson) => {

            pkgJson.devDependencies['react-router-dom'] = '^6.23.1';

            return pkgJson;
        });

        generateFiles(tree, path.join(__dirname, 'files', 'frontend', 'app'), applicationPath, {
            workspaceName: workspaceName,
            translations: configuration.frontend.services.includes('translations')
        });
    }

    if (configuration.frontend.framework === 'next') {
        await nextApplicationGenerator(tree, {
            name: applicationName,
            style: 'tailwind',
            linter: Linter.EsLint,
            unitTestRunner: 'jest',
            e2eTestRunner: 'none',
            projectNameAndRootFormat: 'as-provided',
            directory: applicationPath
        });

        tree.delete(`${applicationPath}/src/app`);

        if (configuration.frontend.services.includes('translations')) {
            generateFiles(tree, path.join(__dirname, 'files', 'frontend', 'next-translation'), applicationPath, {
                workspaceName: workspaceName,
                translations: true
            });
        } else {
            generateFiles(tree, path.join(__dirname, 'files', 'frontend', 'next'), applicationPath, {
                workspaceName: workspaceName,
                translations: false
            });
        }


    }



    await generateSettings(tree, libsRoot);

    if (configuration.frontend.services.includes('ui')) {
        await generateUi(tree, libsRoot, configuration.frontend.framework, applicationPath);
    }

    if (configuration.frontend.services.includes('translations')) {
        await generateTranslations(tree, libsRoot, configuration.frontend.framework);
    }

    if (configuration.frontend.services.includes('sdk')) {
        await generateSdk(tree, libsRoot, workspaceName, configuration.frontend.framework);
    }
}

async function generateSettings(tree: Tree, libsRoot: string) {
    await libraryGenerator(tree, {
        name: 'config',
        style: 'none',
        linter: Linter.EsLint,
        unitTestRunner: 'jest',
        projectNameAndRootFormat: 'as-provided',
        directory: `${libsRoot}/config`,
        strict: true
    });

    generateFiles(tree, path.join(__dirname, 'files', 'frontend', 'libs', 'config'), `${libsRoot}/config`, {});
}

async function generateSdk(tree: Tree, libsRoot: string, workspaceName: string, framework: 'next' | 'react') {
    await libraryGenerator(tree, {
        name: 'sdk',
        style: 'none',
        linter: Linter.EsLint,
        unitTestRunner: 'jest',
        projectNameAndRootFormat: 'as-provided',
        directory: `${libsRoot}/sdk`,
        strict: true
    });

    updateJson(tree, `${libsRoot}/sdk/project.json`, (pkgJson) => {

        pkgJson.targets['build-types'] = {
            'executor': 'nx:run-commands',
            'options': {
                'commands': [
                    `npx openapi-typescript http://localhost:3000/docs-yaml -o ${libsRoot}/sdk/src/schema.d.ts`
                ]
            }
        };

        return pkgJson;
    });

    updateJson(tree, 'package.json', (pkgJson) => {

        pkgJson.devDependencies['openapi-typescript'] = '^6.7.6';

        if (framework === 'next') {
            pkgJson.dependencies['ky'] = '^1.7.2';
        } else {
            pkgJson.devDependencies['axios'] = '^1.7.2';
        }

        return pkgJson;
    });

    if (framework === 'next') {
        generateFiles(tree, path.join(__dirname, 'files', 'frontend', 'libs', 'sdk-next'), `${libsRoot}/sdk`, {
            workspaceName: workspaceName
        });
    } else {
        generateFiles(tree, path.join(__dirname, 'files', 'frontend', 'libs', 'sdk'), `${libsRoot}/sdk`, {
            workspaceName: workspaceName
        });
    }
}

async function generateTranslations(tree: Tree, libsRoot: string, framework: 'next' | 'react') {
    await libraryGenerator(tree, {
        name: 'translations',
        style: 'none',
        linter: Linter.EsLint,
        unitTestRunner: 'jest',
        projectNameAndRootFormat: 'as-provided',
        directory: `${libsRoot}/translations`,
        strict: true
    });

    updateJson(tree, 'package.json', (pkgJson) => {

        pkgJson.devDependencies['i18next'] = '^23.11.5';
        pkgJson.devDependencies['i18next-browser-languagedetector'] = '^8.0.0';
        pkgJson.devDependencies['i18next-resources-to-backend'] = '^1.2.1';
        pkgJson.devDependencies['react-i18next'] = '^14.1.2';

        if (framework === 'next') {
            pkgJson.dependencies['next-i18n-router'] = '^5.5.1';
            pkgJson.dependencies['negotiator'] = '^0.6.3';
            pkgJson.dependencies['accept-language'] = '^3.0.20';
            pkgJson.dependencies['@formatjs/intl-localematcher'] = '^0.5.4';
            pkgJson.devDependencies['@types/negotiator'] = '^0.6.3';
        }

        return pkgJson;
    });

    if (framework === 'next') {
        generateFiles(tree, path.join(__dirname, 'files', 'frontend', 'libs', 'translations-next'), `${libsRoot}/translations`, {});
    } else {
        generateFiles(tree, path.join(__dirname, 'files', 'frontend', 'libs', 'translations'), `${libsRoot}/translations`, {});
    }

}

async function generateUi(tree: Tree, libsRoot: string, framework: 'next' | 'react', applicationPath: string) {
    await libraryGenerator(tree, {
        name: 'ui',
        style: 'tailwind',
        linter: Linter.EsLint,
        unitTestRunner: 'jest',
        projectNameAndRootFormat: 'as-provided',
        directory: `${libsRoot}/ui`,
        strict: true
    });

    if (framework === 'next') {
        await configurationGenerator(tree, {
            project: 'ui',
            tsConfiguration: true,
            linter: Linter.EsLint,
            interactionTests: false,
            uiFramework: '@storybook/nextjs'
        });
        await setupTailwindGenerator(tree, {
            project: 'ui',
            skipFormat: false
        });
    }

    if (framework === 'react') {
        await storybookConfigurationGenerator(tree, {
            project: 'ui',
            generateStories: true,
            generateCypressSpecs: false,
            interactionTests: false,
            configureStaticServe: false
        });
    }

    updateJson(tree, 'package.json', (pkgJson) => {

        pkgJson.devDependencies.formik = '^2.4.6';
        pkgJson.devDependencies['@headlessui/react'] = '^2.0.4';
        pkgJson.devDependencies['@heroicons/react'] = '^2.1.3';
        pkgJson.devDependencies['yup'] = '^1.4.0';

        return pkgJson;
    });

    generateFiles(tree, path.join(__dirname, 'files', 'frontend', 'libs', 'ui'), `${libsRoot}/ui`, {
        applicationPath: applicationPath
    });

    const mainStorybookTs = `${libsRoot}/ui/.storybook/main.ts`;
    const contents = tree.read(mainStorybookTs).toString();
    const newContents = contents.replace(/\.\.\/src\/lib\/\*\*\/\*.stories.@\(js\|jsx\|ts\|tsx\|mdx\)/g, '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)');
    tree.write(mainStorybookTs, newContents);
}
