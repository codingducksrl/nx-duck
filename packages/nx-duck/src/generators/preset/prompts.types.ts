type ApplicationKind = 'backend' | 'frontend';

export type Configuration = {
    type: ApplicationKind[];
    backend: {
        framework: 'nest' | 'lambda';
        database: 'mysql' | 'mongodb' | false;
        services: ('redis' | 'email' | 'fs')[];
        deployment: 'aws-ecr' | false;
    },
    frontend: {
        framework: 'react' | 'next';
        services: ('ui' | 'sdk' | 'translations')[];
        deployment: 'aws-s3' | false;
    }
    staging: boolean | undefined
}
