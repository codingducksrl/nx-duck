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
                message: 'What additional services do you want?',
                choices: [
                    { name: 'Redis', value: 'redist' },
                    { name: 'Mailpit', value: 'mailpit', checked: true }
                ],
                when: (answers) => answers.type.includes('backend')
            }
        ]);

}
