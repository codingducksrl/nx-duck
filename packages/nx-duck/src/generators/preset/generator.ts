import { formatFiles, generateFiles, installPackagesTask, Tree } from '@nx/devkit';

import { PresetGeneratorSchema } from './schema';
import { promptConfiguration } from './prompts';
import { createFrontend, getFrontendApplicationPath } from './frontend';
import * as path from 'node:path';
import { createBackend, getBackendApplicationPath } from './backend';


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

    const deployFrontend = response.frontend && response.frontend.deployment;
    const deployBackend = response.backend && response.backend.deployment;

    generateFiles(tree, path.join(__dirname, 'files', 'root'), `/`, {
        mariadb: response.backend && response.backend.database === 'mysql',
        mongodb: response.backend && response.backend.database === 'mongodb',
        redis: response.backend && response.backend.services.includes('redis'),
        mailpit: response.backend && response.backend.services.includes('email'),
        fs: response.backend && response.backend.services.includes('fs'),
        db: response.backend && !!response.backend.database,
        backend: response.type.includes('backend'),
        frontend: response.type.includes('frontend'),
        backendPath: getBackendApplicationPath(response),
        frontendPath: getFrontendApplicationPath(response),
        deployFrontend: deployFrontend,
        deployBackend: deployBackend
    });

    const env = tree.read('.env', 'utf-8');
    tree.write('.env.example', env);

    if (!response.type.includes('backend')) {
        tree.delete('docker');
        tree.delete('docker-compose.yaml');
    }

    if (!(response.backend && !!response.backend.database)) {
        tree.delete('docker');
    }

    if (!deployFrontend) {
        tree.delete('.github/workflows/build-and-push-frontend.yml');
    }

    if (!deployBackend) {
        tree.delete('.github/workflows/build-and-push-backend.yml');
    }

    if (!deployFrontend && !deployBackend) {
        tree.delete('.github/workflows/production.yml');
        tree.delete('.github/workflows/staging.yml');
    } else {
        if (!response.staging) {
            tree.delete('.github/workflows/staging.yml');
        }
    }

    await formatFiles(tree);

    return () => {
        installPackagesTask(tree);
    };
}

export default presetGenerator;
