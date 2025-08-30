import { config } from 'dotenv';
config();

import '@/ai/flows/generate-document-summary.ts';
import '@/ai/flows/answer-questions-about-document.ts';
import '@/ai/flows/identify-risks-and-clauses.ts';
import '@/ai/flows/define-legal-term.ts';
