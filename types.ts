
export interface Attachment {
    base64: string;
    mimeType: string;
    name: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    attachments?: Attachment[];
    isLoading?: boolean;
}
