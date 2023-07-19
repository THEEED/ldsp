#!/usr/bin/env node

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
const pem = require('pem');

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
const privateKeyPath = path.join(__dirname, 'privateKey.pem');
const certificatePath = path.join(__dirname, 'certificate.pem');

const args = process.argv.slice(2);

let domain, localport, newEntry;

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--port' || arg === '-p') {
    localport = args[i + 1];
  } else if (arg === '--domain' || arg === '-d') {
    domain = args[i + 1];
  } else if (arg === '-h' || arg === '--help') {
    printHelp();
    process.exit(0);
  } else if (arg === '-v' || arg === '--version') {
    printVersion();
    process.exit(0);
  } else if (arg.startsWith('-') || arg.startsWith('--')) {
    console.error(`Unknown option: ${arg}`);
    printHelp();
    process.exit(1);
  }
}

if (!domain) {
  readline.question('Enter the domain to add to hosts: ', enteredDomain => {
    domain = enteredDomain;
    askForPort();
  });
} else {
  askForPort();
}

function askForPort() {
  if (!localport) {
    readline.question('Enter the local port to proxy: ', enteredPort => {
      localport = enteredPort;
      startProxy();
    });
  } else {
    startProxy();
  }
}

function startProxy() {
  readline.close();

  if (!domain || !localport) {
    console.error('Domain or local port is required.');
    process.exit(1);
  }

  // Add domain to hosts file
  const hostsContent = fs.readFileSync(hostsPath, 'utf8');
  newEntry = `127.0.0.1 ${domain}\n`;
  if (!hostsContent.includes(newEntry)) {
    fs.writeFileSync(hostsPath, hostsContent + newEntry);
  }

  // Check for certificate and key
  if (!fs.existsSync(privateKeyPath) || !fs.existsSync(certificatePath)) {
    console.log('Generating SSL certificate and key...');
    try {
      pem.createCertificate({ days: 1, selfSigned: true }, function(err, keys) {
        if (err) {
          throw err;
        }
        fs.writeFileSync(privateKeyPath, keys.serviceKey);
        fs.writeFileSync(certificatePath, keys.certificate);
        startProxyServer();
      });
    } catch (err) {
      console.error('Failed to generate SSL certificate and key.');
      process.exit(1);
    }
  } else {
    startProxyServer();
  }
}

function startProxyServer() {
  let options = {
    key: fs.readFileSync(privateKeyPath),
    cert: fs.readFileSync(certificatePath)
  };

  const server = https.createServer(options, (req, res) => {
    proxy.web(req, res, {
      target: `http://127.0.0.1:${localport}`,
    });
  }).listen(443);

  console.log(`HTTPS proxy server is running on https://${domain}...`);

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
}

function printHelp() {
  console.log('Usage: ldsp [--domain <domain>] [--port <localport>]');
  console.log('');
  console.log('Options:');
  console.log('  --domain, -d <domain>   Specify the domain to add to hosts');
  console.log('  --port, -p <localport>  Specify the local port to proxy');
  console.log('  -h, --help              Display help and usage details');
  console.log('  -v, --version           Display the version number');
}

function printVersion() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = require(packageJsonPath);
  console.log(`ldsp version ${packageJson.version}`);
}
