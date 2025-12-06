import { Module, Global, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Global()
@Module({})
export class FirebaseModule {
    private readonly logger = new Logger(FirebaseModule.name);

    constructor() {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            this.logger.warn(
                'Firebase credentials not provided. Firebase notifications will be disabled.',
            );
            return;
        }

        if (!admin.apps.length) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey: privateKey.replace(/\\n/g, '\n'),
                    }),
                });
                this.logger.log('Firebase initialized successfully');
            } catch (error) {
                this.logger.error(`Failed to initialize Firebase: ${error.message}`);
            }
        }
    }
}
