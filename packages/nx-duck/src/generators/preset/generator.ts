import { Tree } from '@nx/devkit';

import { PresetGeneratorSchema } from './schema';
import { applicationGenerator, libraryGenerator } from '@nx/react';
import { Linter } from '@nx/eslint';


export async function presetGenerator(
    tree: Tree,
    options: PresetGeneratorSchema
) {
    const projectRoot = `apps/frontend`; // Adjusted for clarity

    // await lintProjectGenerator(tree, {
    //   project: 'your-project-name',
    //   linter: 'eslint',
    //   // Other options as needed
    // });


    await applicationGenerator(tree, {
        name: 'frontend',
        style: 'tailwind',
        linter: Linter.EsLint,
        skipFormat: true,
        unitTestRunner: 'jest',
        e2eTestRunner: 'none',
        projectNameAndRootFormat: 'as-provided',
        directory: projectRoot
    });

    await libraryGenerator(tree, {
        name: 'ui',
        style: 'tailwind',
        linter: Linter.EsLint,
        unitTestRunner: 'jest',
        projectNameAndRootFormat: 'as-provided',
        directory: 'libs/ui',
        strict: true
    });

    // addFiles(tree, options,{}, {}); // Adjusted for clarity

    // generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);
    // await formatFiles(tree);
}

export default presetGenerator;
