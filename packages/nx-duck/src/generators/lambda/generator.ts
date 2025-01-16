import { addProjectConfiguration, formatFiles, generateFiles, Tree, updateJson } from '@nx/devkit';
import * as path from 'path';
import { LambdaGeneratorSchema } from './schema';

export async function lambdaGenerator(
    tree: Tree,
    options: LambdaGeneratorSchema
) {
    const projectRoot = `lambdas/${options.name}`;
    addProjectConfiguration(tree, options.name, {
        root: projectRoot,
        projectType: 'application',
        sourceRoot: `${projectRoot}/src`,
        targets: {
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
                        'sourcemap': true,
                        'outExtension': {
                            '.mjs': '.mjs'
                        }
                    }
                },
                'configurations': {
                    'development': {
                        'sourceMap': true
                    },
                    'production': {
                        'esbuildOptions': {
                            'sourcemap': false,
                            'minify': true,
                            'outExtension': {
                                '.mjs': '.mjs'
                            }
                        }
                    }
                }
            }
        }
    });

    updateJson(tree, 'package.json', (pkgJson) => {

        if (!pkgJson.devDependencies['@types/aws-lambda']) {
            pkgJson.devDependencies['@types/aws-lambda'] = '^8.10.147';
        }


        return pkgJson;
    });

    generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);
    await formatFiles(tree);
}

export default lambdaGenerator;
