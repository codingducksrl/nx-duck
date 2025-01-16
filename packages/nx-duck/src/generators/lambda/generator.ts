import { addDependenciesToPackageJson, formatFiles, generateFiles, readJson, Tree, updateJson } from '@nx/devkit';
import { applicationGenerator } from '@nx/node';
import * as path from 'path';
import { LambdaGeneratorSchema } from './schema';

export async function lambdaGenerator(
    tree: Tree,
    options: LambdaGeneratorSchema
) {
    const projectRoot = `lambdas/${options.name}`;

    await applicationGenerator(tree, {
        name: options.name,
        directory: projectRoot,
        bundler: 'esbuild',
        linter: 'eslint',
        e2eTestRunner: 'none',
        unitTestRunner: 'none',
        framework: 'none'
    });

    addDependenciesToPackageJson(tree, {}, {
        '@types/aws-lambda': '^8.10.147'
    });

    const packageJson = readJson(tree, 'package.json');
    const name = packageJson.name.replace(/@/g, '').split('/').shift();

    updateJson(tree, path.join('lambdas', options.name, 'project.json'), (file) => {
        file.targets = getTargets(projectRoot);
        return file;
    });

    updateJson(tree, path.join('lambdas', options.name, 'tsconfig.app.json'), (file) => {
        file.compilerOptions.module = 'esnext';
        file.compilerOptions.target = 'esnext';
        file.compilerOptions.moduleResolution = 'node';
        file.compilerOptions.esModuleInterop = true;
        return file;
    });

    generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
        ...options,
        workspaceName: name
    });
    await formatFiles(tree);
}

function getTargets(projectRoot: string) {
    return {
        'build': {
            'executor': '@nx/esbuild:esbuild',
            'outputs': ['{options.outputPath}'],
            'defaultConfiguration': 'production',
            'options': {
                'platform': 'node',
                'outputPath': `dist/${projectRoot}`,
                'format': ['esm'],
                'bundle': false,
                'main': `${projectRoot}/src/main.ts`,
                'tsConfig': `${projectRoot}/tsconfig.app.json`,
                'assets': [`${projectRoot}/src/assets`],
                'generatePackageJson': true,
                'esbuildOptions': {
                    'outExtension': {
                        '.js': '.mjs'
                    }
                }
            },
            'configurations': {
                'development': {
                    'sourcemap': false,
                    'minify': true
                },
                'production': {
                    'sourcemap': false,
                    'minify': true,
                    'esbuildOptions': {
                        'outExtension': {
                            '.js': '.mjs'
                        }
                    }
                }
            }
        }
    };
}

export default lambdaGenerator;
