import tls from 'tls';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const to = 'djshirleybeats@gmail.com';
const code = '123456';
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\s+/g, '') : undefined;
const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT) || 465;

console.log('Using SMTP Configuration:');
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`User: ${user}`);
console.log(`Password length: ${pass ? pass.length : 0}`);

if (!user || !pass) {
    console.error('Error: SMTP_USER or SMTP_PASSWORD not set in .env');
    process.exit(1);
}

const socket = tls.connect({
    host,
    port,
    rejectUnauthorized: false
});

let step = 0;
const userBase64 = Buffer.from(user).toString('base64');
const passBase64 = Buffer.from(pass).toString('base64');

const write = (cmd: string) => {
    console.log(`Client: ${cmd}`);
    socket.write(cmd + '\r\n');
};

let responseData = '';

socket.on('data', (data) => {
    const response = data.toString();
    responseData += response;
    console.log(`Server: ${response.trim()}`);

    if (!response.endsWith('\r\n')) {
        return;
    }

    const lines = responseData.split('\r\n').filter(l => l.trim().length > 0);
    responseData = '';
    
    const lastLine = lines[lines.length - 1];
    const codeMatch = lastLine.match(/^(\d{3})/);
    if (!codeMatch) return;
    const statusCode = parseInt(codeMatch[1], 10);

    if (statusCode >= 400) {
        console.error(`Error at step ${step}: ${lastLine}`);
        socket.end();
        process.exit(1);
    }

    switch (step) {
        case 0:
            if (statusCode === 220) {
                step = 1;
                write(`EHLO ${host}`);
            }
            break;
        case 1:
            if (statusCode === 250) {
                step = 2;
                write('AUTH LOGIN');
            }
            break;
        case 2:
            if (statusCode === 334) {
                step = 3;
                write(userBase64);
            }
            break;
        case 3:
            if (statusCode === 334) {
                step = 4;
                write(passBase64);
            }
            break;
        case 4:
            if (statusCode === 235) {
                step = 5;
                write(`MAIL FROM:<${user}>`);
            }
            break;
        case 5:
            if (statusCode === 250) {
                step = 6;
                write(`RCPT TO:<${to}>`);
            }
            break;
        case 6:
            if (statusCode === 250) {
                step = 7;
                write('DATA');
            }
            break;
        case 7:
            if (statusCode === 354) {
                step = 8;
                const emailContent = [
                    `From: "School of AI Test" <${user}>`,
                    `To: <${to}>`,
                    `Subject: Test SMTP Code`,
                    `MIME-Version: 1.0`,
                    `Content-Type: text/html; charset=utf-8`,
                    '',
                    `Test code: ${code}`,
                    '.',
                    ''
                ].join('\r\n');
                socket.write(emailContent);
            }
            break;
        case 8:
            if (statusCode === 250) {
                step = 9;
                write('QUIT');
            }
            break;
        case 9:
            console.log('SUCCESS! SMTP dialogue finished.');
            socket.end();
            process.exit(0);
            break;
    }
});

socket.on('error', (err) => {
    console.error(`Socket error: ${err.message}`);
    process.exit(1);
});

socket.on('end', () => {
    if (step < 9) {
        console.error('Connection closed prematurely.');
        process.exit(1);
    }
});
