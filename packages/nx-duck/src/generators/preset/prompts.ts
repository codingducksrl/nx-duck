import * as inquirer from 'inquirer';
import { Configuration } from './prompts.types';


export async function promptConfiguration() {

    return inquirer
        .prompt<Configuration>([
            {
                type: 'checkbox',
                name: 'type',
                message: 'What kind of application are you building?',
                choices: [
                    { name: 'Backend', value: 'backend' },
                    { name: 'Frontend', value: 'frontend' }
                ]
            },
            {
                type: 'list',
                name: 'frontend.framework',
                message: 'What frontend framework do you want to use?',
                choices: [
                    { name: 'React', value: 'react', checked: true },
                    { name: 'NextJS', value: 'next', checked: false }
                ],
                when: (answers) => answers.type.includes('frontend')
            },
            {
                type: 'checkbox',
                name: 'frontend.services',
                message: 'What additional frontend libraries do you want?',
                choices: [
                    { name: 'Ui', value: 'ui', checked: true },
                    { name: 'SDK', value: 'sdk', checked: true },
                    { name: 'Translations', value: 'translations', checked: true }
                ],
                when: (answers) => answers.type.includes('frontend')
            },
            {
                type: 'list',
                name: 'backend.database',
                message: 'What database do you want?',
                choices: [
                    { name: 'MariaDB', value: 'mysql', checked: true },
                    { name: 'MongoDB', value: 'mongodb' },
                    { name: 'No database', value: false }
                ],
                when: (answers) => answers.type.includes('backend')
            },
            {
                type: 'checkbox',
                name: 'backend.services',
                message: 'What additional backend services do you want?',
                choices: [
                    { name: 'Redis', value: 'redis' },
                    { name: 'Email', value: 'email', checked: true },
                    { name: 'Filesystem', value: 'fs' }
                ],
                when: (answers) => answers.type.includes('backend')
            },
            {
                type: 'list',
                name: 'backend.deployment',
                message: 'Which deployment workflow do you want to use for the backend?',
                choices: [
                    { name: 'AWS ECR', value: 'aws-ecr', checked: true },
                    { name: 'None', value: false }
                ],
                when: (answers) => answers.type.includes('backend')
            },
            {
                type: 'list',
                name: 'frontend.deployment',
                message: 'Which deployment workflow do you want to use for the frontend?',
                choices: [
                    { name: 'AWS S3', value: 'aws-s3', checked: true },
                    { name: 'None', value: false }
                ],
                when: (answers) => answers.type.includes('frontend')
            },
            {
                type: 'confirm',
                name: 'staging',
                message: 'Do you have a staging environment?',
                default: true,
                when: (answers) => {
                    return (answers.frontend && answers.frontend.deployment) || (answers.backend && answers.backend.deployment);
                }
            }
        ]);

}
