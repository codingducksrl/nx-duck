import { addDependenciesToPackageJson, formatFiles, generateFiles, readJson, Tree, updateJson } from '@nx/devkit';
import { applicationGenerator } from '@nx/node';
import * as path from 'path';
import { LambdaGeneratorSchema } from './schema';
import * as yaml from 'js-yaml';

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

    const docker = yaml.load(tree.read('docker-compose.yaml').toString('utf-8'));

    docker['services'][options.name] = {
        build: {
            context: `.`,
            dockerfile: 'Dockerfile'
        },
        platform: 'linux/arm64',
        command: [
            `dist/${options.name}/main.lambdaHandler`
        ],
        labels: [
            'traefik.enable=true',
            `traefik.http.routers.${options.name}.rule=PathPrefix(\`/lambda/${options.name}\`)`,
            `traefik.http.routers.${options.name}.entrypoints=web`,
            `traefik.http.services.${options.name}.loadbalancer.server.port=8080`,
            `traefik.http.services.${options.name}.loadbalancer.server.scheme=http`,
            `traefik.http.routers.${options.name}.middlewares=lambda-replacepath`
        ],
        networks: [
            'nest'
        ]
    };

    tree.write('docker-compose.yaml', yaml.dump(docker));

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
                'bundle': true,
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
