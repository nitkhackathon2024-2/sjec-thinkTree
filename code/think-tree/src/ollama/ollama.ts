import { Ollama } from 'ollama'

export const ollama = new Ollama({ host: process.env.OLLAMA_URL! })

export const chat = async (
	messages: { role: string; content: string }[],
	options?: {
		format?: string;
		// stream?: boolean;
		keep_alive?: string | number;
	}
) => {
	try {
		return await ollama.chat({
			model: process.env.LLM!,
			messages,
			...options
		});
	} catch (error) {
		console.error('Error during chat:', error);
		throw error;
	}
};

export const generate = async (
	prompt: string,
	options?: {
		suffix?: string;
		system?: string;
		template?: string;
		raw?: boolean;
		format?: string;
		keep_alive?: string | number;
		// stream?: boolean;
	}
) => {
	try {
		return await ollama.generate({
			model: process.env.LLM!,
			prompt,
			...options
		});
	} catch (error) {
		console.error('Error during generate:', error);
		throw error;
	}
};

export const embed = async (
	input: string | string[],
	options?: {
		truncate?: boolean;
		keep_alive?: string | number;
	}
) => {
	try {
		return await ollama.embed({
			model: process.env.EMBEDDING_MODEL!,
			input,
			...options
		});
	} catch (err) {
		console.error('Error generating embeddings:', err)
		throw err
	}
}
