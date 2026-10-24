import os
import sys
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Forçar diretório do script como diretório de trabalho
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class YchanHandler(SimpleHTTPRequestHandler):
    """
    Handler HTTP com tipos MIME estritamente corrigidos para Windows,
    evitando que o navegador interprete HTML, CSS ou JS como text/plain.
    """
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.html': 'text/html; charset=utf-8',
        '.htm': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.svg': 'image/svg+xml; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
    }

    def end_headers(self):
        # Desabilitar cache para garantir que alterações sejam refletidas imediatamente
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run():
    port = 8080
    server_address = ('127.0.0.1', port)
    
    try:
        httpd = HTTPServer(server_address, YchanHandler)
    except OSError:
        port = 8085
        server_address = ('127.0.0.1', port)
        httpd = HTTPServer(server_address, YchanHandler)

    url = f"http://localhost:{port}/index.html"
    print("=" * 60)
    print("  🌊 YCHAN IMAGEBOARD - SERVIDOR LOCAL ATIVO")
    print("=" * 60)
    print(f"  URL: {url}")
    print("  MIME-Types: text/html, text/css, application/javascript")
    print("  Pressione Ctrl+C para encerrar o servidor.")
    print("=" * 60)
    
    # Abre automaticamente no navegador padrão do usuário
    webbrowser.open(url)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado pelo usuário.")

if __name__ == '__main__':
    run()
