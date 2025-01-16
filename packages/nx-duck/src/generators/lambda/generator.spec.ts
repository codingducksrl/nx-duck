import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readProjectConfiguration, Tree } from '@nx/devkit';

import { lambdaGenerator } from './generator';
import { LambdaGeneratorSchema } from './schema';

describe('lambda generator', () => {
    let tree: Tree;
    const options: LambdaGeneratorSchema = { name: 'test' };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should run successfully', async () => {
        await lambdaGenerator(tree, options);
        const config = readProjectConfiguration(tree, 'test');
        expect(config).toBeDefined();
    });
});
