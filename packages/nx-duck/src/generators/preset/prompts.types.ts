type ApplicationKind = 'backend' | 'frontend';

export type Configuration = {
    type: ApplicationKind[];
    backend: {
        database: 'mariadb' | 'mongodb';
        services: ('redis' | 'mailpit')[];
    },
    frontend: {
        services: ('ui' | 'sdk' | 'translations')[];
    }
}
