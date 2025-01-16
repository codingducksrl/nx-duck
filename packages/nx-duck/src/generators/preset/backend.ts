import { Configuration } from './prompts.types';
import { applicationGenerator, libraryGenerator } from '@nx/nest';
import { libraryGenerator as jsLibraryGenerator } from '@nx/js';
import { Linter } from '@nx/eslint';
import { addDependenciesToPackageJson, generateFiles, Tree, updateJson } from '@nx/devkit';
import * as path from 'node:path';
import { lambdaGenerator } from '../lambda/generator';

import { configurationGenerator as prismaGenerator } from '../prisma/generator';
import { runCommandsGenerator } from '@nx/workspace';

export function getBackendApplicationPath(configuration: Configuration) {
    return configuration.type.includes('frontend') ? 'apps/backend' : 'backend';
}

export async function createBackend(tree: Tree, configuration: Configuration, workspaceName: string) {

    if (configuration.backend.framework === 'nest') {
        await createNestJS(tree, configuration, workspaceName);
    }

    if (configuration.backend.framework === 'lambda') {
        await createLambda(tree, configuration, workspaceName);
    }
}

async function createLambda(tree: Tree, configuration: Configuration, workspaceName: string) {
    await lambdaGenerator(tree, {
        name: 'lambda'
    });

    await jsLibraryGenerator(tree, {
        name: 'settings',
        linter: Linter.EsLint,
        unitTestRunner: 'none',
        strict: true,
        buildable: true,
        directory: 'libs/settings'
    });

    generateFiles(tree, path.join(__dirname, 'files', 'backend', 'libs', 'settings-lambda'), 'libs/settings', {
        workspaceName: workspaceName
    });

    tree.delete('libs/settings/src/lib');
}

async function createNestJS(tree: Tree, configuration: Configuration, workspaceName: string) {
    const applicationPath = getBackendApplicationPath(configuration);

    await applicationGenerator(tree, {
        name: 'backend',
        linter: Linter.EsLint,
        unitTestRunner: 'jest',
        e2eTestRunner: 'none',
        strict: true,
        directory: applicationPath
    });

    generateFiles(tree, path.join(__dirname, 'files', 'backend', 'app'), applicationPath, {
        workspaceName: workspaceName,
        applicationPath: applicationPath,
        db: !!configuration.backend.database,
        email: configuration.backend.services.includes('email'),
        fs: configuration.backend.services.includes('fs'),
        migrations: configuration.backend.database && ['mysql'].includes(configuration.backend.database)
    });


    addDependenciesToPackageJson(tree, {
        '@nestjs/swagger': '^7.3.1',
        '@nestjs/config': '^3.2.2',
        '@nestjs/terminus': '^10.2.3',
        '@nestjs/axios': '^3.0.2',
        'class-validator': '^0.14.1',
        'class-transformer': '^0.5.1',
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
        strict: true,
        buildable: true,
        directory: 'libs/settings'
    });

    generateFiles(tree, path.join(__dirname, 'files', 'backend', 'libs', 'settings'), 'libs/settings', {
        email: configuration.backend.services.includes('email'),
        fs: configuration.backend.services.includes('fs')
    });

    tree.delete('libs/settings/src/lib');


    if (configuration.backend.database) {
        await createDatabase(tree, configuration, applicationPath);
    }

    if (configuration.backend.services.includes('email')) {
        await createEmail(tree, configuration, workspaceName, applicationPath);
    }

    if (configuration.backend.services.includes('fs')) {
        await createFilesystem(tree, configuration, workspaceName);
    }
}

async function createFilesystem(tree: Tree, configuration: Configuration, workspaceName: string) {
    await libraryGenerator(tree, {
        name: 'filesystem',
        linter: Linter.EsLint,
        unitTestRunner: 'none',
        strict: true,
        buildable: true,
        directory: 'libs/filesystem'
    });

    addDependenciesToPackageJson(tree, {
        '@aws-sdk/client-s3': '^3.590.0',
        '@aws-sdk/lib-storage': '^3.590.0',
        '@aws-sdk/s3-request-presigner': '^3.590.0',
        'mime-types': '^2.1.35'
    }, {
        '@types/mime-types': '^2.1.4'
    });

    generateFiles(tree, path.join(__dirname, 'files', 'backend', 'libs', 'filesystem'), 'libs/filesystem', {
        workspaceName: workspaceName
    });
}

async function createEmail(tree: Tree, configuration: Configuration, workspaceName: string, applicationPath: string) {
    await libraryGenerator(tree, {
        name: 'email',
        linter: Linter.EsLint,
        unitTestRunner: 'none',
        strict: true,
        buildable: true,
        directory: 'libs/email'
    });

    addDependenciesToPackageJson(tree, {
        '@nestjs-modules/mailer': '^2.0.2 ',
        'nodemailer': '^6.9.13 ',
        'handlebars': '^4.7.8',
        '@aws-sdk/client-ses': '^3.590.0'
    }, {
        '@types/nodemailer': '^6.4.15',
        'mjml': '^4.15.3'
    });

    updateJson(tree, `${applicationPath}/project.json`, (pkgJson) => {

        if (!pkgJson.targets['build']['dependsOn']) {
            pkgJson.targets['build']['dependsOn'] = [];
        }

        pkgJson.targets['build']['dependsOn'].push('email:mjml-build');

        return pkgJson;
    });

    await runCommandsGenerator(tree, {
        project: 'email',
        name: 'mjml-build',
        command: 'node ./libs/email/email-build.js'
    });

    generateFiles(tree, path.join(__dirname, 'files', 'backend', 'libs', 'email'), 'libs/email', {
        workspaceName: workspaceName
    });

    tree.delete('libs/email/src/lib');
}

async function createDatabase(tree: Tree, configuration: Configuration, applicationPath: string) {
    if (!configuration.backend.database) {
        return;
    }

    await libraryGenerator(tree, {
        name: 'db',
        linter: Linter.EsLint,
        unitTestRunner: 'none',
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
