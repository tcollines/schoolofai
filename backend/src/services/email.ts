import tls from 'tls';
import { logger } from '../logger';
import { pool } from '../db';

export function sendOtpEmail(to: string, code: string): Promise<boolean> {
    return new Promise((resolve) => {
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\s+/g, '') : undefined;
        const host = process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = Number(process.env.SMTP_PORT) || 465; // Direct TLS (SMTPS)

        if (!user || !pass) {
            logger.error('SMTP credentials (SMTP_USER/SMTP_PASSWORD) are not configured in .env. Cannot send email.');
            resolve(false);
            return;
        }

        try {
            logger.info(`SMTP: Connecting to ${host}:${port} to send OTP to ${to}...`);
            const socket = tls.connect({
                host,
                port,
                rejectUnauthorized: false // Allow self-signed certificates in dev environments
            });

            let step = 0;
            const userBase64 = Buffer.from(user).toString('base64');
            const passBase64 = Buffer.from(pass).toString('base64');

            // Define email details in outer scope so they can be logged to database on success
            const subject = 'Your School of AI Verification Code';
            const bodyHtml = `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <h2 style="color: #7c3aed; text-align: center;">Welcome to School of AI</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">Use the following verification code to complete your login:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 4px; text-align: center; border-radius: 8px; margin: 20px 0; color: #111827; font-family: monospace;">
                        ${code}
                    </div>
                    <p style="font-size: 14px; color: #6b7280; text-align: center;">If you did not request this, you can safely ignore this email.</p>
                </div>
            `;

            const write = (cmd: string) => {
                socket.write(cmd + '\r\n');
            };

            let responseData = '';

            socket.on('data', (data) => {
                const response = data.toString();
                responseData += response;

                // Wait until we get a complete line or lines
                if (!response.endsWith('\r\n')) {
                    return;
                }

                const lines = responseData.split('\r\n').filter(l => l.trim().length > 0);
                responseData = ''; // Clear for next response accumulation
                
                // Get last line's status code
                const lastLine = lines[lines.length - 1];
                const codeMatch = lastLine.match(/^(\d{3})/);
                if (!codeMatch) return;
                const statusCode = parseInt(codeMatch[1], 10);

                if (statusCode >= 400) {
                    logger.error(`SMTP Error at step ${step}: ${lastLine}`);
                    socket.end();
                    resolve(false);
                    return;
                }

                switch (step) {
                    case 0: // Connected, server greeting received
                        if (statusCode === 220) {
                            step = 1;
                            write(`EHLO ${host}`);
                        }
                        break;
                    case 1: // EHLO response received
                        if (statusCode === 250) {
                            step = 2;
                            write('AUTH LOGIN');
                        }
                        break;
                    case 2: // AUTH LOGIN accepted, challenge received
                        if (statusCode === 334) {
                            step = 3;
                            write(userBase64);
                        }
                        break;
                    case 3: // Username accepted, challenge received
                        if (statusCode === 334) {
                            step = 4;
                            write(passBase64);
                        }
                        break;
                    case 4: // Login success
                        if (statusCode === 235) {
                            step = 5;
                            write(`MAIL FROM:<${user}>`);
                        }
                        break;
                    case 5: // Sender accepted
                        if (statusCode === 250) {
                            step = 6;
                            write(`RCPT TO:<${to}>`);
                        }
                        break;
                    case 6: // Recipient accepted
                        if (statusCode === 250) {
                            step = 7;
                            write('DATA');
                        }
                        break;
                    case 7: // Ready for email content
                        if (statusCode === 354) {
                            step = 8;
                            const emailContent = [
                                `From: "School of AI Auth" <${user}>`,
                                `To: <${to}>`,
                                `Subject: ${subject}`,
                                `MIME-Version: 1.0`,
                                `Content-Type: text/html; charset=utf-8`,
                                '',
                                bodyHtml,
                                '.',
                                ''
                            ].join('\r\n');

                            socket.write(emailContent);
                        }
                        break;
                    case 8: // Email accepted
                        if (statusCode === 250) {
                            step = 9;
                            write('QUIT');
                        }
                        break;
                    case 9: // Quit confirmation received
                        socket.end();
                        
                        // Store the sent email log in MySQL database
                        pool.query(
                            'INSERT INTO mails (sender_email, recipient_email, subject, body) VALUES (?, ?, ?, ?)',
                            [user, to, subject, bodyHtml]
                        ).then(() => {
                            logger.info(`Email successfully stored in MySQL database log for recipient: ${to}`);
                            resolve(true);
                        }).catch((dbErr) => {
                            logger.error(`Failed to store email log in MySQL database: ${(dbErr as Error).message}`);
                            // Resolve true anyway because the email was successfully sent to the recipient
                            resolve(true);
                        });
                        break;
                }
            });

            socket.on('error', (err) => {
                logger.error(`SMTP socket error: ${err.message}`);
                resolve(false);
            });

            socket.on('end', () => {
                if (step < 9) {
                    logger.warn('SMTP connection closed prematurely.');
                    resolve(false);
                }
            });
        } catch (e) {
            logger.error(`Failed to send email via SMTP: ${(e as Error).message}`);
            resolve(false);
        }
    });
}
