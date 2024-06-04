type ApplicationKind = 'backend' | 'frontend';

export type Configuration = {
    type: ApplicationKind[];
    backend: {
        database: 'mysql' | 'mongodb' | false;
        services: ('redis' | 'mailpit')[];
    },
    frontend: {
        services: ('ui' | 'sdk' | 'translations')[];
    }
}
