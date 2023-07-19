# LDSP - Local SSL Proxy

LDSP is a command-line tool for setting up a local HTTPS proxy with SSL/TLS encryption. It allows you to proxy requests from HTTPS to HTTP on your local machine.

## Installation

LDSP can be installed globally using npm:

```shell
npm install -g ldsp
```

Usage
-----

To start LDSP, open your terminal or command prompt and run the following command:

shell

```shell
sudo ldsp
```

Note for macOS and Linux users: You need to run the command with `sudo` to have the necessary permissions for modifying the hosts file.

Note for Windows users: You need to open the command prompt as an administrator to have the necessary permissions for modifying the hosts file.

By default, LDSP will prompt you to enter the domain and local port to proxy. Alternatively, you can specify the domain and port as command-line arguments:

shell

```shell
ldsp --domain example.com --port 3000
```

LDSP will add the specified domain to your hosts file and generate a self-signed SSL certificate for HTTPS connections. It will start the HTTPS proxy server and display the proxy URL.

To stop LDSP and remove the domain from the hosts file, press `Ctrl + C` in the terminal or command prompt.

Command-line Options
--------------------

LDSP supports the following command-line options:

*   `--domain, -d <domain>`: Specify the domain to add to the hosts file.
*   `--port, -p <localport>`: Specify the local port to proxy.
*   `--help, -h`: Display help and usage details.
*   `--version, -v`: Display the version number.

Requirements
------------

LDSP requires Node.js version 10 or above.

License
-------

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.