import { formatFiles, generateFiles, installPackagesTask, Tree } from '@nx/devkit';

import { PresetGeneratorSchema } from './schema';
import { promptConfiguration } from './prompts';
import { createFrontend } from './frontend';
import * as path from 'node:path';
import { createBackend } from './backend';


export async function presetGenerator(
    tree: Tree,
    options: PresetGeneratorSchema
) {

    // await lintProjectGenerator(tree, {
    //   project: 'your-project-name',
    //   linter: 'eslint',
    //   // Other options as needed
    // });


    const response = await promptConfiguration();

    if (response.type.includes('frontend')) {
        await createFrontend(tree, response, options.name);
    }

    if (response.type.includes('backend')) {
        await createBackend(tree, response, options.name);
    }

    // addFiles(tree, options,{}, {}); // Adjusted for clarity

    // generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);


    generateFiles(tree, path.join(__dirname, 'files', 'root'), `/`, {});

    await formatFiles(tree);

    return () => {
        installPackagesTask(tree);
    };
}

export default presetGenerator;
