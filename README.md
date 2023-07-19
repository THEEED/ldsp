
Local SSL Proxy
===============

Local SSL Proxy is a simple tool for developers that sets up a local HTTPS proxy to a specified domain. It's designed to help developers securely test their local web services.

Prerequisites
-------------

*   OpenSSL must be installed and available in your system's PATH.
*   The script must be run with root (on Linux/macOS) or Administrator (on Windows) privileges, due to the need to modify the system's hosts file and listen on port 443.

Installation
------------

Install the package globally using npm:

lua

```lua
npm install -g local-ssl-proxy
```

Usage
-----

After installing the package, you can run it with:

lua

```lua
sudo local-ssl-proxy
```

The tool will prompt you for:

*   The domain you want to add to your hosts file.
*   The local port to proxy.

The tool automatically checks if an SSL certificate and key exist, and if not, generates new ones using OpenSSL. It then sets up an HTTPS server that proxies to your specified port.

When you terminate the process (using `CTRL+C`), the domain is removed from your hosts file.

Note
----

If you're using this tool on Windows, you may need to run your command prompt or PowerShell as Administrator.

License
-------

MIT

---
