const fs = require('fs');

const path = 'src/cron.ts';
let content = fs.readFileSync(path, 'utf8');

const injectionCode = `
			if (isSuccess) {
				console.log(\`[Success Path] Found compliant time window. Injecting events to primary calendars.\`);

                // Actual insertion logic
                const { decrypt } = await import('./lib/crypto.js');
                const encryptionKey = env.ENCRYPTION_KEY || 'default_dev_encryption_key_32_chars!';

                for (const token of sessionTokens) {
                    if (token.is_primary === 1 && token.refresh_token !== 'none') {
                        try {
                            const refreshToken = await decrypt(token.refresh_token, encryptionKey);

                            // Let's schedule it at the start of the window for now
                            const eventStart = new Date(session.window_start);
                            const eventEnd = new Date(eventStart.getTime() + session.duration_mins * 60000);

                            if (token.provider === 'google') {
                                // 1. Get access token
                                const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                    body: new URLSearchParams({
                                        client_id: env.GOOGLE_CLIENT_ID,
                                        client_secret: env.GOOGLE_CLIENT_SECRET || '', // Need secret
                                        refresh_token: refreshToken,
                                        grant_type: 'refresh_token',
                                    }),
                                });
                                const tokenData = await tokenRes.json();

                                if (tokenData.access_token) {
                                    // 2. Create calendar event
                                    const event = {
                                        summary: session.title,
                                        description: 'Scheduled via mandatory.rest',
                                        start: { dateTime: eventStart.toISOString() },
                                        end: { dateTime: eventEnd.toISOString() }
                                    };

                                    await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': \`Bearer \${tokenData.access_token}\`,
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(event)
                                    });
                                    console.log(\`Successfully inserted Google Calendar event for \${token.email}\`);
                                } else {
                                    console.error('Failed to get Google access token:', tokenData);
                                }

                            } else if (token.provider === 'microsoft') {
                                // 1. Get access token
                                const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                    body: new URLSearchParams({
                                        client_id: env.MS_CLIENT_ID,
                                        client_secret: env.MS_CLIENT_SECRET || '',
                                        refresh_token: refreshToken,
                                        grant_type: 'refresh_token',
                                    }),
                                });
                                const tokenData = await tokenRes.json();

                                if (tokenData.access_token) {
                                    // 2. Create calendar event
                                    const event = {
                                        subject: session.title,
                                        body: { contentType: 'HTML', content: 'Scheduled via mandatory.rest' },
                                        start: { dateTime: eventStart.toISOString(), timeZone: 'UTC' },
                                        end: { dateTime: eventEnd.toISOString(), timeZone: 'UTC' }
                                    };

                                    await fetch('https://graph.microsoft.com/v1.0/me/events', {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': \`Bearer \${tokenData.access_token}\`,
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(event)
                                    });
                                    console.log(\`Successfully inserted Microsoft Calendar event for \${token.email}\`);
                                } else {
                                    console.error('Failed to get Microsoft access token:', tokenData);
                                }
                            }
                        } catch (e) {
                            console.error(\`Failed to process event for \${token.email}:\`, e);
                        }
                    }
                }

			} else {`;

content = content.replace(
  "			if (isSuccess) {\n				console.log(`[Success Path] Found compliant time window. Injecting events to primary calendars.`);\n			} else {",
  injectionCode
);

fs.writeFileSync(path, content);
