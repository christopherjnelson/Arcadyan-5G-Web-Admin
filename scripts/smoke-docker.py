#!/usr/bin/env python3
"""Exercise the production image against a mock gateway; always clean up."""

import http.client
import json
import re
import subprocess
import sys
import time
import uuid


MOCK_IMAGE = (
    "node:24.18.1-alpine3.24@sha256:"
    "f70403e87646dc51b45295f4b8b70cdad0b63d2297c4c9899119b03f7af7a6b3"
)
MOCK_SERVER = r"""
const http = require('node:http');
http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    if (req.url === '/TMI/v1/typed') {
      res.setHeader('Content-Type', 'application/problem+json');
    }
    if (req.url === '/TMI/v1/denied') {
      res.statusCode = 401;
      res.setHeader('Set-Cookie', 'smoke=yes; HttpOnly; Path=/');
    }
    res.end(JSON.stringify({
      method: req.method, url: req.url, body,
      authorization: req.headers.authorization,
      cookie: req.headers.cookie,
    }));
  });
}).listen(8081, '0.0.0.0');
"""


def docker(*args, check=True):
    return subprocess.run(
        ["docker", *args], check=check, text=True, capture_output=True, timeout=120
    ).stdout.strip()


def request(port, path, method="GET", body=None, headers=None):
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
    try:
        connection.request(method, path, body=body, headers=headers or {})
        response = connection.getresponse()
        return response.status, response.headers, response.read()
    finally:
        connection.close()


def main():
    image = sys.argv[1] if len(sys.argv) > 1 else "arcadyan-5g-web-admin:local"
    prefix = f"arcadyan-smoke-{uuid.uuid4().hex[:10]}"
    network, mock, app = prefix, f"{prefix}-gateway", f"{prefix}-app"
    network_created = False
    containers = []
    try:
        docker("network", "create", network)
        network_created = True
        containers.append(mock)
        docker(
            "run", "-d", "--name", mock, "--network", network,
            "--network-alias", "gateway-mock", "--read-only", "--cap-drop=ALL",
            "--security-opt=no-new-privileges:true", "--user", "1000:1000",
            "--entrypoint", "node", MOCK_IMAGE, "-e", MOCK_SERVER,
        )
        containers.append(app)
        docker(
            "run", "-d", "--name", app, "--network", network,
            "--read-only", "--tmpfs", "/tmp:size=16m,mode=1777", "--cap-drop=ALL",
            "--security-opt=no-new-privileges:true", "-p", "127.0.0.1::8080",
            "-e", "GATEWAY_HOST=gateway-mock", "-e", "GATEWAY_PORT=8081", image,
        )
        info = json.loads(docker("inspect", app))[0]
        assert info["Config"]["User"] == "101:101", "Image must run without root"
        deadline = time.monotonic() + 30
        while True:
            info = json.loads(docker("inspect", app))[0]
            if info["State"]["Status"] == "exited":
                raise RuntimeError("Container exited before becoming ready")
            try:
                port = int(info["NetworkSettings"]["Ports"]["8080/tcp"][0]["HostPort"])
                assert request(port, "/healthz")[0] == 200
                break
            except (OSError, AssertionError, KeyError, IndexError, TypeError):
                if time.monotonic() >= deadline:
                    raise RuntimeError("Container did not become ready")
                time.sleep(0.2)

        status, headers, index = request(port, "/")
        assert status == 200 and b'<div id="root">' in index
        assert headers["X-Content-Type-Options"] == "nosniff"
        assert headers["X-Frame-Options"] == "DENY"
        assert "frame-ancestors 'none'" in headers["Content-Security-Policy"]
        assert headers["Cache-Control"] == "no-cache"
        for path in ["/login", "/wifi", "/system"]:
            assert request(port, path)[2] == index, f"SPA fallback failed: {path}"
        assets = re.findall(rb'(?:src|href)="(/assets/[^\"]+)"', index)
        assert assets, "Built assets were not referenced by index.html"
        for asset in assets:
            status, headers, content = request(port, asset.decode())
            assert status == 200 and content
            assert "immutable" in headers["Cache-Control"]
        assert request(port, "/assets/missing.js")[0] == 404
        assert request(port, "/api")[0] == 404

        status, headers, body = request(
            port, "/api/echo?get=all&value=a%20b",
            headers={"Authorization": "Bearer smoke-token", "Cookie": "session=smoke"},
        )
        payload = json.loads(body)
        assert status == 200
        assert payload["url"] == "/TMI/v1/echo?get=all&value=a%20b"
        assert payload["authorization"] == "Bearer smoke-token"
        assert payload["cookie"] == "session=smoke"
        assert headers["Content-Type"] == "application/json; charset=utf-8"
        assert headers["Cache-Control"] == "no-store"

        login_body = json.dumps({"username": "smoke", "password": "synthetic-only"})
        status, _, body = request(
            port, "/api/auth/login", method="POST", body=login_body,
            headers={"Content-Type": "application/json"},
        )
        payload = json.loads(body)
        assert status == 200 and payload["method"] == "POST"
        assert payload["url"] == "/TMI/v1/auth/login"
        assert payload["body"] == login_body, "Proxy changed the request body"
        assert request(port, "/api/typed")[1]["Content-Type"] == "application/problem+json"
        status, headers, body = request(port, "/api/denied")
        assert status == 401 and json.loads(body)["url"] == "/TMI/v1/denied"
        assert headers["Set-Cookie"] == "smoke=yes; HttpOnly; Path=/"
        assert headers["Cache-Control"] == "no-store"
        assert headers["X-Content-Type-Options"] == "nosniff"

        for variable, value in [("GATEWAY_HOST", "bad;hostname"), ("GATEWAY_PORT", "70000")]:
            result = subprocess.run(
                ["docker", "run", "--rm", "--read-only", "--tmpfs", "/tmp",
                 "--network", "none", "-e", f"{variable}={value}", image],
                text=True, capture_output=True, timeout=15,
            )
            assert result.returncode != 0 and variable in result.stderr
        print("Docker smoke checks passed: SPA, assets, API proxy, headers, auth, bodies, errors, non-root/read-only operation, and environment validation.")
    except Exception:
        for name in containers:
            result = subprocess.run(
                ["docker", "logs", "--tail", "30", name],
                text=True, capture_output=True, timeout=15,
            )
            print(result.stdout + result.stderr, file=sys.stderr)
        raise
    finally:
        for name in reversed(containers):
            docker("rm", "-f", name, check=False)
        if network_created:
            docker("network", "rm", network, check=False)


if __name__ == "__main__":
    main()
