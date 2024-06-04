import { Configuration } from './prompts.types';
import { applicationGenerator, libraryGenerator, storybookConfigurationGenerator } from '@nx/react';
import { Linter } from '@nx/eslint';
import { generateFiles, Tree } from '@nx/devkit';
import * as path from 'node:path';

export async function createFrontend(tree: Tree, configuration: Configuration) {

    const libsRoot = configuration.type.includes('backend') ? 'fe-libs' : 'libs';

    await applicationGenerator(tree, {
        name: 'frontend',
        style: 'tailwind',
        linter: Linter.EsLint,
        skipFormat: true,
        unitTestRunner: 'jest',
        e2eTestRunner: 'none',
        projectNameAndRootFormat: 'as-provided',
        directory: 'apps/frontend'
    });

    await libraryGenerator(tree, {
        name: 'ui',
        style: 'tailwind',
        linter: Linter.EsLint,
        unitTestRunner: 'jest',
        projectNameAndRootFormat: 'as-provided',
        directory: `${libsRoot}/ui`,
        strict: true
    });

    await storybookConfigurationGenerator(tree, {
        project: 'ui',
        generateStories: true,
        generateCypressSpecs: false,
        interactionTests: false,
        configureStaticServe: false
    });

    generateFiles(tree, path.join(__dirname, 'files', 'frontend', 'libs'), `${libsRoot}/`, {});

    const mainStorybookTs = `${libsRoot}/ui/.storybook/main.ts`;
    const contents = tree.read(mainStorybookTs).toString();
    const newContents = contents.replace(/\.\.\/src\/lib\/\*\*\/\*.stories.@\(js\|jsx\|ts\|tsx\|mdx\)/g, '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)');
    tree.write(mainStorybookTs, newContents);
}
