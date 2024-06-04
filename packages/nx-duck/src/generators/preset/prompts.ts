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
                name: 'backend.database',
                message: 'What database do you want?',
                choices: [
                    { name: 'MariaDB', value: 'mariadb' },
                    { name: 'MongoDB', value: 'mongodb' }
                ],
                when: (answers) => answers.type.includes('backend')
            },
            {
                type: 'checkbox',
                name: 'backend.services',
                message: 'What additional services do you want?',
                choices: [
                    { name: 'Redis', value: 'redist' },
                    { name: 'Mailpit', value: 'mailpit' }
                ],
                when: (answers) => answers.type.includes('backend')
            }
        ]);

}
