import { formatFiles, installPackagesTask, Tree } from '@nx/devkit';

import { PresetGeneratorSchema } from './schema';
import { promptConfiguration } from './prompts';
import { createFrontend } from './frontend';


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
        await createFrontend(tree, response);
    }

    // addFiles(tree, options,{}, {}); // Adjusted for clarity

    // generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);
    await formatFiles(tree);

    installPackagesTask(tree, true);
}

export default presetGenerator;
