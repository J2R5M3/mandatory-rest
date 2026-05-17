export async function encrypt(text: string, keyString: string): Promise<string> {
	// Need a 32-byte key for AES-256. If the provided key isn't 32 bytes, we hash it.
	const encoder = new TextEncoder();
	const keyData = encoder.encode(keyString);

	let rawKey: Uint8Array;
	if (keyData.length === 32) {
		rawKey = keyData;
	} else {
		rawKey = new Uint8Array(await crypto.subtle.digest('SHA-256', keyData));
	}

	const key = await crypto.subtle.importKey(
		'raw',
		rawKey,
		{ name: 'AES-GCM' },
		false,
		['encrypt']
	);

	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encodedText = encoder.encode(text);

	const cipherText = await crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv: iv
		},
		key,
		encodedText
	);

	// Combine IV and ciphertext, then base64 encode
	const combined = new Uint8Array(iv.length + cipherText.byteLength);
	combined.set(iv, 0);
	combined.set(new Uint8Array(cipherText), iv.length);

	return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encryptedData: string, keyString: string): Promise<string> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(keyString);

	let rawKey: Uint8Array;
	if (keyData.length === 32) {
		rawKey = keyData;
	} else {
		rawKey = new Uint8Array(await crypto.subtle.digest('SHA-256', keyData));
	}

	const key = await crypto.subtle.importKey(
		'raw',
		rawKey,
		{ name: 'AES-GCM' },
		false,
		['decrypt']
	);

	const combined = new Uint8Array(
		atob(encryptedData).split('').map(c => c.charCodeAt(0))
	);

	const iv = combined.slice(0, 12);
	const cipherText = combined.slice(12);

	const decryptedText = await crypto.subtle.decrypt(
		{
			name: 'AES-GCM',
			iv: iv
		},
		key,
		cipherText
	);

	return new TextDecoder().decode(decryptedText);
}
