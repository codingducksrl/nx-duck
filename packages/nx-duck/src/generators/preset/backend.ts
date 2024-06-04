import { Configuration } from './prompts.types';
import { applicationGenerator, libraryGenerator } from '@nx/nest';
import { Linter } from '@nx/eslint';
import { addDependenciesToPackageJson, generateFiles, Tree, updateJson } from '@nx/devkit';
import * as path from 'node:path';

import { configurationGenerator as prismaGenerator } from '../prisma/generator';

export async function createBackend(tree: Tree, configuration: Configuration, workspaceName: string) {


    const applicationPath = configuration.type.includes('frontend') ? 'apps/backend' : 'backend';

    await applicationGenerator(tree, {
        name: 'backend',
        linter: Linter.EsLint,
        unitTestRunner: 'jest',
        e2eTestRunner: 'none',
        strict: true,
        projectNameAndRootFormat: 'as-provided',
        directory: applicationPath
    });

    generateFiles(tree, path.join(__dirname, 'files', 'backend', 'app'), applicationPath, {
        workspaceName: workspaceName,
        db: !!configuration.backend.database
    });

    // tree.delete(`${applicationPath}/src/app`);
    //
    addDependenciesToPackageJson(tree, {
        '@nestjs/swagger': '^7.3.1',
        '@nestjs/config': '^3.2.2',
        '@nestjs/terminus': '^10.2.3',
        '@nestjs/axios': '^3.0.2',
        'axios': '^1.7.2'
    }, {});


    // Adding the sourceMap for the debugger
    updateJson(tree, `tsconfig.base.json`, (pkgJson) => {
        pkgJson.compilerOptions['sourceMap'] = true;
        return pkgJson;
    });

    updateJson(tree, `${applicationPath}/project.json`, (pkgJson) => {

        pkgJson.targets['build']['configurations'] = {
            'development': {
                'sourceMap': true
            },
            'production': {}
        };

        return pkgJson;
    });

    // Adding the settings library
    await libraryGenerator(tree, {
        name: 'settings',
        linter: Linter.EsLint,
        unitTestRunner: 'none',
        projectNameAndRootFormat: 'as-provided',
        strict: true,
        buildable: true,
        directory: 'libs/settings'
    });

    generateFiles(tree, path.join(__dirname, 'files', 'backend', 'libs', 'settings'), 'libs/settings', {});


    if (configuration.backend.database) {
        await createDatabase(tree, configuration, applicationPath);
    }
}


async function createDatabase(tree: Tree, configuration: Configuration, applicationPath: string) {
    if (!configuration.backend.database) {
        return;
    }

    await libraryGenerator(tree, {
        name: 'db',
        linter: Linter.EsLint,
        unitTestRunner: 'none',
        projectNameAndRootFormat: 'as-provided',
        strict: true,
        buildable: true,
        directory: 'libs/db'
    });

    await prismaGenerator(tree, {
        project: 'db',
        directory: 'prisma',
        database: configuration.backend.database
    });

    generateFiles(tree, path.join(__dirname, 'files', 'backend', 'libs', 'db'), 'libs/db', {});

    updateJson(tree, `${applicationPath}/project.json`, (pkgJson) => {

        if (!pkgJson.targets['build']['dependsOn']) {
            pkgJson.targets['build']['dependsOn'] = [];
        }

        pkgJson.targets['build']['dependsOn'].push('db:prisma-generate');

        return pkgJson;
    });
}
