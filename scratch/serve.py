import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

if __name__ == '__main__':
    port = 8089
    server = ThreadingHTTPServer(('127.0.0.1', port), CORSRequestHandler)
    print(f"Threading HTTP Server running on http://127.0.0.1:{port}")
    server.serve_forever()
