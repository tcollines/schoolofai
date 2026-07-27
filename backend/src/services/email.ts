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
                <div style="background-color: #f9fafb; padding: 30px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <div style="max-width: 460px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); overflow: hidden;">
                        <!-- Header Gradient Accent -->
                        <div style="height: 5px; background: linear-gradient(90deg, #7c3aed, #4f46e5);"></div>
                        
                        <div style="padding: 40px 32px;">
                            <!-- Brand Title -->
                            <div style="text-align: center; margin-bottom: 28px;">
                                <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #1f2937;">School of AI</span>
                            </div>
                            
                            <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px 0; text-align: center;">Confirm your identity</h2>
                            
                            <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 24px 0; text-align: center;">
                                Please use the secure verification code below to complete your login. This code is valid for 10 minutes.
                            </p>
                            
                            <!-- Premium Code Box -->
                            <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
                                <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #7c3aed; display: block; line-height: 1; margin-left: 6px;">${code}</span>
                            </div>
                            
                            <p style="font-size: 13px; line-height: 1.5; color: #9ca3af; text-align: center; margin: 0 0 8px 0;">
                                For your security, please do not share this code with anyone.
                            </p>
                            <p style="font-size: 13px; line-height: 1.5; color: #9ca3af; text-align: center; margin: 0;">
                                If you did not request this code, you can safely ignore this email.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                                © 2026 School of AI. All rights reserved.
                            </p>
                        </div>
                    </div>
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

export function sendInstructorApplicationEmail(to: string, username: string): Promise<boolean> {
    return new Promise((resolve) => {
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\s+/g, '') : undefined;
        const host = process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = Number(process.env.SMTP_PORT) || 465;

        if (!user || !pass) {
            logger.error('SMTP credentials not configured. Cannot send email.');
            resolve(false);
            return;
        }

        try {
            const socket = tls.connect({ host, port, rejectUnauthorized: false });
            let step = 0;
            const userBase64 = Buffer.from(user).toString('base64');
            const passBase64 = Buffer.from(pass).toString('base64');

            const subject = 'Instructor Application Received - Welile School of AI';
            const bodyHtml = `
                <div style="background-color: #f9fafb; padding: 30px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); overflow: hidden;">
                        <div style="height: 5px; background: linear-gradient(90deg, #7c3aed, #4f46e5);"></div>
                        <div style="padding: 40px 32px;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <span style="font-size: 22px; font-weight: 800; color: #1f2937;">Welile School of AI</span>
                            </div>
                            
                            <h2 style="font-size: 20px; font-weight: 750; color: #111827; margin: 0 0 16px 0; text-align: center;">Application Received! 🎓</h2>
                            
                            <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0;">
                                Hello ${username},
                            </p>
                            
                            <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 20px 0;">
                                We are thrilled to inform you that Welile School of AI has received your application to become an instructor! Our administrative team is currently reviewing your credentials, passport details, and curriculum courses plan.
                            </p>
                            
                            <div style="background: #f5f3ff; border-radius: 12px; padding: 16px; border: 1px solid #ddd6fe; text-align: center; margin-bottom: 20px;">
                                <span style="font-size: 14px; font-weight: 700; color: #7c3aed; display: block;">What happens next?</span>
                                <span style="font-size: 13px; color: #6b7280; display: block; margin-top: 4px;">We will verify your uploaded documents and get back to you with the results within 24-48 business hours.</span>
                            </div>

                            <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 8px 0;">
                                Thank you for your passion to share knowledge with our students!
                            </p>
                        </div>
                        <div style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                                © 2026 Welile School of AI. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            `;

            const write = (cmd: string) => { socket.write(cmd + '\r\n'); };
            let responseData = '';

            socket.on('data', (data) => {
                const response = data.toString();
                responseData += response;
                if (!response.endsWith('\r\n')) return;
                const lines = responseData.split('\r\n').filter(l => l.trim().length > 0);
                responseData = '';
                const lastLine = lines[lines.length - 1];
                const codeMatch = lastLine.match(/^(\d{3})/);
                if (!codeMatch) return;
                const statusCode = parseInt(codeMatch[1], 10);

                if (statusCode >= 400) {
                    logger.error(`SMTP Application Email Error at step ${step}: ${lastLine}`);
                    socket.end();
                    resolve(false);
                    return;
                }

                switch (step) {
                    case 0:
                        if (statusCode === 220) { step = 1; write(`EHLO ${host}`); }
                        break;
                    case 1:
                        if (statusCode === 250) { step = 2; write('AUTH LOGIN'); }
                        break;
                    case 2:
                        if (statusCode === 334) { step = 3; write(userBase64); }
                        break;
                    case 3:
                        if (statusCode === 334) { step = 4; write(passBase64); }
                        break;
                    case 4:
                        if (statusCode === 235) { step = 5; write(`MAIL FROM:<${user}>`); }
                        break;
                    case 5:
                        if (statusCode === 250) { step = 6; write(`RCPT TO:<${to}>`); }
                        break;
                    case 6:
                        if (statusCode === 250) { step = 7; write('DATA'); }
                        break;
                    case 7:
                        if (statusCode === 354) {
                            step = 8;
                            const emailContent = [
                                `From: "Welile School of AI" <${user}>`,
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
                    case 8:
                        if (statusCode === 250) { step = 9; write('QUIT'); }
                        break;
                    case 9:
                        socket.end();
                        pool.query(
                            'INSERT INTO mails (sender_email, recipient_email, subject, body) VALUES (?, ?, ?, ?)',
                            [user, to, subject, bodyHtml]
                        ).then(() => {
                            logger.info(`Application confirmation email logged in DB for applicant: ${to}`);
                            resolve(true);
                        }).catch((dbErr) => {
                            logger.error(`Failed to log application email: ${(dbErr as Error).message}`);
                            resolve(true);
                        });
                        break;
                }
            });

            socket.on('error', (err) => {
                logger.error(`SMTP socket error: ${err.message}`);
                resolve(false);
            });
        } catch (e) {
            logger.error(`Failed to send email via SMTP: ${(e as Error).message}`);
            resolve(false);
        }
    });
}

export function sendInstructorStatusEmail(to: string, username: string, approved: boolean): Promise<boolean> {
    return new Promise((resolve) => {
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\s+/g, '') : undefined;
        const host = process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = Number(process.env.SMTP_PORT) || 465;

        if (!user || !pass) {
            logger.error('SMTP credentials not configured. Cannot send email.');
            resolve(false);
            return;
        }

        try {
            const socket = tls.connect({ host, port, rejectUnauthorized: false });
            let step = 0;
            const userBase64 = Buffer.from(user).toString('base64');
            const passBase64 = Buffer.from(pass).toString('base64');

            const subject = approved
                ? 'Instructor Application Approved! - Welile School of AI'
                : 'Instructor Application Status Update - Welile School of AI';

            const statusTitle = approved ? 'Application Approved! 🎉' : 'Application Update ℹ️';
            const statusColor = approved ? '#10b981' : '#ef4444';
            const statusBg = approved ? '#ecfdf5' : '#fef2f2';
            const statusBorder = approved ? '#a7f3d0' : '#fecaca';
            
            const messageBody = approved
                ? `Congratulations! Your application to become an instructor has been approved. Your role has been updated, and you can now log in as an instructor to set up your courses and manage students.`
                : `Thank you for your interest in teaching at Welile School of AI. After carefully reviewing your profile and courses syllabus, we regret to inform you that we cannot approve your application at this time. Feel free to re-apply in the future with updated course portfolios.`;

            const bodyHtml = `
                <div style="background-color: #f9fafb; padding: 30px 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); overflow: hidden;">
                        <div style="height: 5px; background: ${approved ? '#10b981' : '#ef4444'};"></div>
                        <div style="padding: 40px 32px;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <span style="font-size: 22px; font-weight: 800; color: #1f2937;">Welile School of AI</span>
                            </div>
                            
                            <h2 style="font-size: 20px; font-weight: 750; color: #111827; margin: 0 0 16px 0; text-align: center;">${statusTitle}</h2>
                            
                            <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 16px 0;">
                                Hello ${username},
                            </p>
                            
                            <div style="background: ${statusBg}; border-radius: 12px; padding: 18px; border: 1px solid ${statusBorder}; margin-bottom: 20px;">
                                <p style="font-size: 14px; line-height: 1.6; color: #1f2937; margin: 0;">
                                    ${messageBody}
                                </p>
                            </div>
                        </div>
                        <div style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                                © 2026 Welile School of AI. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            `;

            const write = (cmd: string) => { socket.write(cmd + '\r\n'); };
            let responseData = '';

            socket.on('data', (data) => {
                const response = data.toString();
                responseData += response;
                if (!response.endsWith('\r\n')) return;
                const lines = responseData.split('\r\n').filter(l => l.trim().length > 0);
                responseData = '';
                const lastLine = lines[lines.length - 1];
                const codeMatch = lastLine.match(/^(\d{3})/);
                if (!codeMatch) return;
                const statusCode = parseInt(codeMatch[1], 10);

                if (statusCode >= 400) {
                    logger.error(`SMTP Status Email Error at step ${step}: ${lastLine}`);
                    socket.end();
                    resolve(false);
                    return;
                }

                switch (step) {
                    case 0:
                        if (statusCode === 220) { step = 1; write(`EHLO ${host}`); }
                        break;
                    case 1:
                        if (statusCode === 250) { step = 2; write('AUTH LOGIN'); }
                        break;
                    case 2:
                        if (statusCode === 334) { step = 3; write(userBase64); }
                        break;
                    case 3:
                        if (statusCode === 334) { step = 4; write(passBase64); }
                        break;
                    case 4:
                        if (statusCode === 235) { step = 5; write(`MAIL FROM:<${user}>`); }
                        break;
                    case 5:
                        if (statusCode === 250) { step = 6; write(`RCPT TO:<${to}>`); }
                        break;
                    case 6:
                        if (statusCode === 250) { step = 7; write('DATA'); }
                        break;
                    case 7:
                        if (statusCode === 354) {
                            step = 8;
                            const emailContent = [
                                `From: "Welile School of AI" <${user}>`,
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
                    case 8:
                        if (statusCode === 250) { step = 9; write('QUIT'); }
                        break;
                    case 9:
                        socket.end();
                        pool.query(
                            'INSERT INTO mails (sender_email, recipient_email, subject, body) VALUES (?, ?, ?, ?)',
                            [user, to, subject, bodyHtml]
                        ).then(() => {
                            logger.info(`Status notification email logged in DB for applicant: ${to}`);
                            resolve(true);
                        }).catch((dbErr) => {
                            logger.error(`Failed to log status email: ${(dbErr as Error).message}`);
                            resolve(true);
                        });
                        break;
                }
            });

            socket.on('error', (err) => {
                logger.error(`SMTP socket error: ${err.message}`);
                resolve(false);
            });
        } catch (e) {
            logger.error(`Failed to send email via SMTP: ${(e as Error).message}`);
            resolve(false);
        }
    });
}
