const https = require('https');
const httpProxy = require('http-proxy');
const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
const os = require('os');
const path = require('path');
const net = require('net');

// Path to the hosts file depending on the OS
const hostsPath = os.platform() === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts';

// Checking user rights on Unix-like systems
if (os.platform() !== 'win32' && (process.getuid && process.getuid() !== 0)) {
  console.error('This script must be run as root.');
  process.exit(1);
}

// Checking the availability of port 443
const portInUse = port => {
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once('error', err => (err.code === 'EADDRINUSE' ? resolve(true) : reject(err)))
      .once('listening', () => tester.once('close', () => resolve(false)).close())
      .listen(port);
  });
};

const proxy = httpProxy.createProxyServer();

// Path to your certificates
const keyPath = path.join(__dirname, 'server.key');
const certPath = path.join(__dirname, 'server.cert');

readline.question('Enter the local port to proxy: ', async port => {
  if (await portInUse(port)) {
    console.error(`Port ${port} is already in use.`);
    process.exit(1);
  }

  readline.question('Enter the domain to add to hosts: ', domain => {
    readline.close();

    // Add domain to hosts file
    const hostsContent = fs.readFileSync(hostsPath, 'utf8');
    const newEntry = `127.0.0.1 ${domain}\n`;
    if (!hostsContent.includes(newEntry)) {
      fs.writeFileSync(hostsPath, hostsContent + newEntry);
    }

    // Check for certificate and key
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.log('Generating SSL certificate and key...');
      try {
        execSync(`openssl genrsa -out ${keyPath} 2048`);
        execSync(`openssl req -new -x509 -key ${keyPath} -out ${certPath} -days 365 -subj "/C=US/ST=Denial/L=Springfield/O=Dis/CN=www.example.com"`);
      } catch (err) {
        console.error('OpenSSL is not available. Please ensure that OpenSSL is installed and available in the PATH.');
        process.exit(1);
      }
    }

    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    const server = https.createServer(options, (req, res) => {
      proxy.web(req, res, {
        target: `http://127.0.0.1:${port}`,
      });
    }).listen(443);

    console.log(`HTTPS proxy server is running on https://${domain}...`);

    // Remove domain from hosts file on process exit
    process.on('SIGINT', () => {
      console.log('\nRemoving domain from hosts and shutting down...');
      const hostsContent = fs.readFileSync(hostsPath, 'utf8');
      const updatedContent = hostsContent.replace(newEntry, '');
      fs.writeFileSync(hostsPath, updatedContent);

      const timeout = 1000; // Timeout of 1 second
      const exitTimer = setTimeout(() => process.exit(), timeout); // Force exit if server is not closed within timeout

      server.close(() => {
        clearTimeout(exitTimer);
        process.exit();
      });
    });
  });
});
